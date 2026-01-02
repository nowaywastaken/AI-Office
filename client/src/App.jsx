import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import DocumentPreview from './components/DocumentPreview';
import './index.css';

function App() {
  const [generatedResult, setGeneratedResult] = useState(null);

  return (
    <div className="h-screen w-screen flex bg-slate-900">
      {/* Left Panel - Chat Interface */}
      <div className="w-1/2 h-full border-r border-white/10">
        <ChatInterface onGenerate={setGeneratedResult} />
      </div>

      {/* Right Panel - Document Preview */}
      <div className="w-1/2 h-full">
        <DocumentPreview result={generatedResult} />
      </div>
    </div>
  );
}

export default App;
