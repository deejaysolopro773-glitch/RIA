
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { VideoResult } from '../types';

const VideoGenerator: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [history, setHistory] = useState<VideoResult[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if ((window as any).aistudio?.hasSelectedApiKey) {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    }
  };

  const handleSelectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success after trigger to mitigate race conditions
      setHasApiKey(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!selectedImage || !hasApiKey) return;

    setIsProcessing(true);
    setStatusMessage('Initiating cinematic generation...');
    
    try {
      const base64Data = selectedImage.split(',')[1];
      let operation = await GeminiService.generateVideo(base64Data, mimeType, prompt, aspectRatio);

      while (!operation.done) {
        setStatusMessage('Gemini is dreaming up your video... This may take a minute.');
        await new Promise(r => setTimeout(r, 8000));
        operation = await GeminiService.pollVideoOperation(operation);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        const videoResponse = await fetch(fetchUrl);
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);

        const newResult: VideoResult = {
          url: videoUrl,
          prompt: prompt || 'Generated video',
          timestamp: Date.now()
        };
        setHistory(prev => [newResult, ...prev]);
        setStatusMessage('Generation complete!');
      }
    } catch (error: any) {
      console.error('Video generation failed:', error);
      if (error?.message?.includes('Requested entity was not found')) {
        setHasApiKey(false);
        alert('API Key session expired. Please select a project again.');
      } else {
        alert('Generation failed. Ensure you have selected a paid GCP project.');
      }
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 text-center max-w-xl mx-auto">
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
          <svg className="w-16 h-16 text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Access Veo Cinematic Video</h2>
          <p className="text-slate-400">
            High-quality video generation requires a paid Google Cloud project API key.
            Select your project to continue.
          </p>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm text-slate-400 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              Check the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-400 underline">billing documentation</a> for details on enabling paid features.
            </p>
          </div>
        </div>
        <button
          onClick={handleSelectKey}
          className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-indigo-900/40"
        >
          Select API Key
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
      {/* Left: Configuration */}
      <div className="lg:col-span-5 space-y-8">
        <section className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            Create New Video
          </h3>
          
          <div className="space-y-6">
            <div 
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                selectedImage ? 'border-indigo-500 bg-slate-800' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'
              }`}
            >
              {selectedImage ? (
                <img src={selectedImage} alt="Base" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <svg className="w-10 h-10 text-slate-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium text-slate-400">Select Starting Image</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`py-3 rounded-xl border font-medium transition-all ${
                    aspectRatio === '16:9' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Landscape (16:9)
                </button>
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`py-3 rounded-xl border font-medium transition-all ${
                    aspectRatio === '9:16' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Portrait (9:16)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400">Movement & Style Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'The camera orbits the character as they begin to run', 'Cinematic slow motion, sun flare, 4k detail'"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-28"
              />
            </div>

            <button
              disabled={!selectedImage || isProcessing}
              onClick={generateVideo}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                isProcessing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Generating...</span>
                </>
              ) : 'Animate Photo'}
            </button>
          </div>
        </section>

        {isProcessing && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
               <svg className="w-6 h-6 text-indigo-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
               </svg>
            </div>
            <p className="text-sm text-indigo-300 font-medium">{statusMessage}</p>
          </div>
        )}
      </div>

      {/* Right: Results */}
      <div className="lg:col-span-7 space-y-8">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Generation Gallery
        </h3>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl text-slate-500 p-8 text-center">
            <svg className="w-20 h-20 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Once generated, your cinematic clips will appear here.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {history.map((video, idx) => (
              <div key={idx} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl group">
                <div className="relative">
                  <video 
                    controls 
                    className="w-full h-full"
                    poster={selectedImage || undefined}
                  >
                    <source src={video.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={video.url} 
                      download={`gemini-video-${idx}.mp4`}
                      className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors inline-block"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Cinematic Generation</span>
                     <span className="text-[10px] text-slate-500">{new Date(video.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 italic text-sm">"{video.prompt}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerator;
