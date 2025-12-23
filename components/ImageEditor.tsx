
import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { ImageResult } from '../types';

const ImageEditor: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ImageResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleEdit = async () => {
    if (!selectedImage || !prompt) return;

    setIsProcessing(true);
    try {
      const base64Data = selectedImage.split(',')[1];
      const result = await GeminiService.editImage(base64Data, mimeType, prompt);
      
      if (result) {
        const newResult: ImageResult = {
          url: result,
          prompt: prompt,
          timestamp: Date.now()
        };
        setHistory(prev => [newResult, ...prev]);
        setSelectedImage(result);
        setPrompt('');
      }
    } catch (error) {
      console.error('Image edit failed:', error);
      alert('Failed to edit image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Editor Side */}
        <div className="space-y-6">
          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`relative aspect-square rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
              selectedImage ? 'border-indigo-500 bg-slate-900' : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
            }`}
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Workspace" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium">Change Image</span>
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium">Upload an Image</h3>
                <p className="text-slate-400 text-sm mt-1">PNG, JPG, or WEBP</p>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <label className="block text-sm font-medium text-slate-400 uppercase tracking-wider">Describe your edit</label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g., "Add a futuristic neon helmet to the person", "Convert this to a watercolor painting", "Remove the background"'
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-32"
              />
              <button
                disabled={!selectedImage || !prompt || isProcessing}
                onClick={handleEdit}
                className="absolute bottom-3 right-3 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all shadow-lg"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </div>
                ) : 'Edit Image'}
              </button>
            </div>
          </div>
        </div>

        {/* History Side */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Generation History
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {history.length === 0 ? (
              <div className="col-span-2 py-20 text-center bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                <p className="text-slate-500">Your edited images will appear here.</p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="group relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-indigo-500 transition-all">
                  <img src={item.url} alt={`History ${idx}`} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <p className="text-[10px] text-slate-300 line-clamp-2">{item.prompt}</p>
                    <button 
                      onClick={() => setSelectedImage(item.url)}
                      className="mt-2 text-xs text-indigo-400 font-semibold hover:text-indigo-300"
                    >
                      Reuse as Base
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
