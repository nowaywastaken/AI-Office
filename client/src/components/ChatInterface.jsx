import { useState, useRef, useEffect } from 'react';
import { api, API_HOST } from '../services/api';
import SettingsModal from './SettingsModal';

export default function ChatInterface({ onGenerate }) {
  const [message, setMessage] = useState('');
  const [docType, setDocType] = useState('word');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setHistory(prev => [...prev, { role: 'user', content: message }]);
    setMessage('');

    try {
      // Get AI config from localStorage
      const savedConfig = localStorage.getItem('ai_office_config');
      const aiConfig = savedConfig ? JSON.parse(savedConfig) : null;
      
      const result = await api.generateDocument(docType, 'Generated Document', message, aiConfig);
      setHistory(prev => [...prev, { role: 'assistant', content: result.message, fileUrl: result.file_url }]);
      if (onGenerate) onGenerate(result);
    } catch (error) {
      setHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-surface-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">
            AI
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white tracking-wide font-display">Office Suite</h1>
            <p className="text-surface-400 text-xs font-medium">Auto-generate professional documents</p>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-surface-400 hover:text-white transition-all border border-white/5"
            title="AI Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-surface-800/50 flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-xl">
              <span className="text-4xl">👋</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 font-display">Welcome Back</h2>
            <p className="text-surface-400 max-w-sm leading-relaxed">
              Describe the document you want to create, and I'll generate it properly formatted in seconds.
            </p>
            
            <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-md">
              {['Project Proposal', 'Financial Report', 'Marketing Slide', 'Invoice Template'].map((item) => (
                <button 
                  key={item}
                  onClick={() => setMessage(`Create a ${item.toLowerCase()} for...`)}
                  className="p-3 rounded-xl bg-surface-800/40 border border-white/5 text-sm text-surface-300 hover:bg-surface-700/50 hover:text-white transition-all text-left"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {history.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-tr-sm' 
                  : 'bg-surface-800 text-surface-100 rounded-tl-sm border border-white/5'
              }`}>
                <p className="leading-relaxed">{msg.content}</p>
                {msg.fileUrl && (
                  <a href={`${API_HOST}${msg.fileUrl}`} className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                      ⬇
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">Download Document</p>
                      <p className="text-xs text-white/50">Ready to view</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-surface-800 rounded-2xl rounded-tl-sm px-5 py-4 border border-white/5 shadow-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 pt-2 z-10">
        <form onSubmit={handleSubmit} className="relative bg-surface-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl ring-1 ring-white/5 transition-all focus-within:ring-brand-500/50">
          
          <div className="flex flex-col gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Describe your document idea..."
              rows={1}
              className="w-full bg-transparent border-0 text-white placeholder-surface-500 focus:ring-0 resize-none px-4 py-3 max-h-32 min-h-[50px] no-scrollbar"
              style={{ height: 'auto', minHeight: '52px' }}
            />
            
            <div className="flex items-center justify-between px-2 pb-1">
              {/* Document Type Selector */}
              <div className="flex bg-surface-950/50 rounded-lg p-1 border border-white/5">
                {[
                  { id: 'word', icon: '📝', label: 'Word' },
                  { id: 'excel', icon: '📊', label: 'Excel' },
                  { id: 'ppt', icon: '📽️', label: 'PPT' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setDocType(type.id)}
                    className={`nav-item px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                      docType === type.id
                        ? 'bg-surface-700 text-white shadow-sm'
                        : 'text-surface-400 hover:text-white hover:bg-surface-800'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-lg shadow-brand-600/20"
              >
                <span className="transform -rotate-45 relative top-[-1px]">➤</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
