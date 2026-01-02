import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import DocumentPreview from './components/DocumentPreview';
import './index.css';

function App() {
  const [generatedResult, setGeneratedResult] = useState(null);
  const [liveDraft, setLiveDraft] = useState('');

  const handleGenerationUpdate = (update) => {
    if (typeof update === 'string') {
       setLiveDraft(update);
    } else if (update && typeof update === 'object') {
       // This is the final result
       setGeneratedResult(update);
       setLiveDraft('');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-surface-950 text-white relative font-sans selection:bg-brand-500/30">
      
      {/* Background Ambience / Mesh Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-900/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
      </div>

      <div className="relative z-10 flex h-full p-4 gap-4">
        {/* Left Panel - Chat Interface */}
        <div className="w-[45%] h-full flex flex-col bg-surface-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10">
          <ChatInterface onGenerate={handleGenerationUpdate} />
        </div>

        {/* Right Panel - Document Preview */}
        <div className="flex-1 h-full bg-surface-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10 relative group">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px] pointer-events-none"></div>
          <DocumentPreview result={generatedResult} liveDraft={liveDraft} />
        </div>
      </div>
    </div>
  );
}

export default App;
