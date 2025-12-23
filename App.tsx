
import React, { useState } from 'react';
import { AppTab } from './types';
import LiveVoice from './components/LiveVoice';
import ImageEditor from './components/ImageEditor';
import VideoGenerator from './components/VideoGenerator';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.LIVE_VOICE);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.LIVE_VOICE:
        return <LiveVoice />;
      case AppTab.IMAGE_LAB:
        return <ImageEditor />;
      case AppTab.VIDEO_CREATOR:
        return <VideoGenerator />;
      default:
        return <LiveVoice />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Gemini Suite
              </span>
            </div>
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-4">
                <button
                  onClick={() => setActiveTab(AppTab.LIVE_VOICE)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === AppTab.LIVE_VOICE ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Live Voice
                </button>
                <button
                  onClick={() => setActiveTab(AppTab.IMAGE_LAB)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === AppTab.IMAGE_LAB ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Image Lab
                </button>
                <button
                  onClick={() => setActiveTab(AppTab.VIDEO_CREATOR)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === AppTab.VIDEO_CREATOR ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Video Creator
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-50">
        <button
          onClick={() => setActiveTab(AppTab.LIVE_VOICE)}
          className={`flex flex-col items-center gap-1 ${activeTab === AppTab.LIVE_VOICE ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span className="text-[10px]">Voice</span>
        </button>
        <button
          onClick={() => setActiveTab(AppTab.IMAGE_LAB)}
          className={`flex flex-col items-center gap-1 ${activeTab === AppTab.IMAGE_LAB ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px]">Image</span>
        </button>
        <button
          onClick={() => setActiveTab(AppTab.VIDEO_CREATOR)}
          className={`flex flex-col items-center gap-1 ${activeTab === AppTab.VIDEO_CREATOR ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px]">Video</span>
        </button>
      </div>
    </div>
  );
};

export default App;
