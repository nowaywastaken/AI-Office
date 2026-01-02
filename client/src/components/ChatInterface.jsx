import { useState } from 'react';
import { api } from '../services/api';

export default function ChatInterface({ onGenerate }) {
  const [message, setMessage] = useState('');
  const [docType, setDocType] = useState('word');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setHistory(prev => [...prev, { role: 'user', content: message }]);

    try {
      const result = await api.generateDocument(docType, 'Generated Document', message);
      setHistory(prev => [...prev, { role: 'assistant', content: result.message, fileUrl: result.file_url }]);
      if (onGenerate) onGenerate(result);
    } catch (error) {
      setHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">AI Office Suite</h1>
        <p className="text-purple-300 text-sm">Create Word, Excel, PPT from natural language</p>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {history.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-lg">Describe what you want to create</p>
            <p className="text-sm mt-2">e.g., "Create a project proposal with 1.5 line spacing, 12pt Arial font"</p>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-white backdrop-blur-sm'
            }`}>
              <p>{msg.content}</p>
              {msg.fileUrl && (
                <a href={msg.fileUrl} className="text-purple-300 underline text-sm mt-2 block">
                  Download File
                </a>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-white/10">
        {/* Document Type Selector */}
        <div className="flex gap-2 mb-4">
          {['word', 'excel', 'ppt'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setDocType(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                docType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your document..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            {isLoading ? '...' : 'Generate'}
          </button>
        </div>
      </form>
    </div>
  );
}
