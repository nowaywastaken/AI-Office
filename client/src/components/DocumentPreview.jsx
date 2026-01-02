import { API_HOST } from '../services/api';

export default function DocumentPreview({ result }) {
  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in select-none">
        <div className="w-64 h-64 relative mb-8 opacity-50">
           {/* Abstract Empty State Graphic using CSS only */}
           <div className="absolute inset-0 bg-gradient-to-tr from-surface-800 to-transparent rounded-2xl border border-white/5 transform rotate-3"></div>
           <div className="absolute inset-0 bg-surface-900/80 backdrop-blur-sm rounded-2xl border border-white/10 transform -rotate-3 flex items-center justify-center">
             <div className="text-6xl grayscale opacity-20">📄</div>
           </div>
        </div>
        <h3 className="text-xl font-semibold text-white/50 font-display tracking-wide">Ready to Create</h3>
        <p className="text-surface-500 mt-2 max-w-xs text-sm">
          Generated documents will appear here. You can preview and download them instantly.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative animate-fade-in group">
      {/* Floating Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-surface-900/90 backdrop-blur-md rounded-full px-2 py-1.5 shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
        <a
          href={`${API_HOST}${result.file_url}`}
          download
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all shadow-lg shadow-brand-600/20"
        >
          <span>Downloading...</span> 
          {/* Note: In a real app we might want separate state for downloading vs just link */}
          <span className="text-white/80 text-xs uppercase tracking-wider font-bold">Save</span>
        </a>
        <div className="w-px h-4 bg-white/10 mx-1"></div>
        <button className="p-2 text-surface-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
          <span className="sr-only">Copy</span>
          📋
        </button>
        <button className="p-2 text-surface-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
           <span className="sr-only">Fullscreen</span>
           ⛶
        </button>
      </div>

      {/* Document Workspace */}
      <div className="flex-1 overflow-auto p-8 custom-scrollbar flex justify-center bg-surface-950/30">
        
        {/* Paper Container */}
        <div className="w-full max-w-3xl bg-white min-h-[140%] shadow-2xl rounded-sm relative overflow-hidden ring-1 ring-white/10">
          {/* Simulated Office UI Header */}
          <div className="h-10 bg-surface-50 border-b border-surface-200 flex items-center px-4 gap-2 opacity-50 pointer-events-none select-none">
            <div className="w-3 h-3 rounded-full bg-red-400/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-400/50"></div>
          </div>

          <div className="p-12 prose max-w-none prose-slate">
            {/* Content Placeholder / Preview */}
            <h1 className="text-4xl font-bold text-gray-900 mb-6 font-display border-b pb-4 border-gray-100">
              Generated Document
            </h1>
            
            <div className="text-gray-700 leading-loose whitespace-pre-wrap font-serif text-lg">
              {result.message}
            </div>

            {/* Watermark/Footer */}
            <div className="absolute bottom-8 left-0 right-0 text-center text-gray-300 text-xs uppercase tracking-[0.2em] font-sans select-none">
              AI Office Suite Generated
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
