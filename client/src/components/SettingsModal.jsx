import { useState, useEffect } from 'react';

export default function SettingsModal({ isOpen, onClose }) {
  const [config, setConfig] = useState({
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.0-flash-001'
  });

  useEffect(() => {
    const saved = localStorage.getItem('ai_office_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai_office_config', JSON.stringify(config));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white font-display">AI Settings</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-surface-400"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-300">API Provider (Base URL)</label>
            <input 
              type="text"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="https://openrouter.ai/api/v1"
              className="w-full bg-surface-800 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-surface-600 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-300">API Key</label>
            <input 
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full bg-surface-800 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-surface-600 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-300">AI Model</label>
            <input 
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="google/gemini-2.0-flash-001"
              className="w-full bg-surface-800 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-surface-600 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
            />
          </div>

          <p className="text-xs text-surface-500 italic">
            * Settings are stored locally in your browser.
          </p>
        </div>

        <div className="p-6 bg-surface-850/50 border-t border-white/5 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-lg shadow-brand-600/20 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
