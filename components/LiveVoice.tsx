
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createBlobFromPCM } from '../utils/audio';
import { TranscriptionEntry } from '../types';

const LiveVoice: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [status, setStatus] = useState<string>('Ready to talk');
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const transcriptionBufferRef = useRef({ user: '', model: '' });

  const cleanup = useCallback(() => {
    setIsActive(false);
    setStatus('Ready to talk');
    if (audioContextInRef.current) {
        audioContextInRef.current.close();
        audioContextInRef.current = null;
    }
    if (audioContextOutRef.current) {
        audioContextOutRef.current.close();
        audioContextOutRef.current = null;
    }
    activeSourcesRef.current.forEach(s => s.stop());
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const handleStart = async () => {
    try {
      setStatus('Connecting...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('Listening...');
            setIsActive(true);
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlobFromPCM(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.outputTranscription) {
              transcriptionBufferRef.current.model += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              transcriptionBufferRef.current.user += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              setTranscriptions(prev => [
                ...prev,
                { role: 'user', text: transcriptionBufferRef.current.user || '(Audio input)' },
                { role: 'model', text: transcriptionBufferRef.current.model || '(Audio response)' }
              ]);
              transcriptionBufferRef.current = { user: '', model: '' };
            }

            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                activeSourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            cleanup();
          },
          onclose: () => {
            cleanup();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: 'You are a friendly and helpful creative companion. Keep responses concise and natural for voice conversation.'
        },
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (error) {
      console.error('Failed to start session:', error);
      setStatus('Failed to connect');
    }
  };

  const handleStop = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
    }
    cleanup();
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center space-y-6 shadow-2xl">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
          isActive ? 'bg-indigo-600 animate-pulse scale-110' : 'bg-slate-800'
        }`}>
          <svg className={`w-12 h-12 ${isActive ? 'text-white' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">{status}</h2>
          <p className="text-slate-400 text-sm max-w-xs">
            {isActive ? 'Your conversation is encrypted and private.' : 'Click the button below to start a real-time conversation.'}
          </p>
        </div>

        <button
          onClick={isActive ? handleStop : handleStart}
          className={`px-10 py-4 rounded-full font-semibold text-lg transition-all transform active:scale-95 ${
            isActive 
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/20' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20'
          }`}
        >
          {isActive ? 'End Session' : 'Start Conversing'}
        </button>
      </div>

      {transcriptions.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex-1 overflow-y-auto max-h-[400px] space-y-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Transcription History</h3>
          {transcriptions.map((t, i) => (
            <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                t.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
              }`}>
                {t.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveVoice;
