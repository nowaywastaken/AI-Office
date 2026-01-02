import { useState, useRef, useEffect } from 'react';
import { api, API_HOST } from '../services/api';
import SettingsModal from './SettingsModal';
import { 
  Send, 
  Settings, 
  MessageSquare, 
  Download, 
  FileText, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import '../MarkdownStyles.css';

export default function ChatInterface({ onGenerate }) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Track if AI is ready to generate + cached info
  const [pendingGeneration, setPendingGeneration] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null); // { structure, type, fileUrl }
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  // Check connectivity
  useEffect(() => {
    const checkStatus = async () => {
      try {
        await api.getStatus();
        setIsOnline(true);
      } catch (err) {
        setIsOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const getAiConfig = () => {
    const savedConfig = localStorage.getItem('ai_office_config');
    return savedConfig ? JSON.parse(savedConfig) : null;
  };

  // Chat with AI (streaming mode)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isOnline) return;

    const aiConfig = getAiConfig();

    // Validate API Key
    if (!aiConfig?.apiKey?.trim()) {
      setHistory(prev => [...prev, { role: 'user', content: message }]);
      setHistory(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ 请先配置 API Key 才能使用 AI 功能。点击右上角 ⚙️ 设置。' 
      }]);
      setMessage('');
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    const userMessage = message;
    setMessage('');
    
    // Check if we are in modification mode for an active document
    if (activeDocument) {
      setHistory(prev => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: '正在更新文档...', isStreaming: true }]);
      
      try {
        const result = await api.modifyDocument(
          activeDocument.structure,
          userMessage,
          activeDocument.type,
          aiConfig
        );
        
        setActiveDocument({
          ...activeDocument,
          structure: result.structure,
          fileUrl: result.file_url
        });
        
        setHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { 
            role: 'assistant', 
            content: `✅ 文档已更新！${result.message}`, 
            fileUrl: result.file_url 
          };
          return newHistory;
        });
        
        if (onGenerate) onGenerate(result);
      } catch (error) {
        setHistory(prev => [...prev, { role: 'assistant', content: `更新失败: ${error.message}`, isError: true }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Standard chat flow
    const newUserMsg = { role: 'user', content: userMessage };
    const newAiMsg = { role: 'assistant', content: '', isStreaming: true };
    setHistory(prev => [...prev, newUserMsg, newAiMsg]);
    
    try {
      const apiMessages = [...history, newUserMsg]
        .map(m => ({ role: m.role, content: m.content }));
      
      let fullContent = '';
      await api.chatStream(apiMessages, aiConfig, (update) => {
        const content = typeof update === 'function' ? update(fullContent) : (fullContent + update);
        fullContent = content;
        setHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].content = fullContent;
          return newHistory;
        });
      });

      const readyMatch = fullContent.match(/\[READY:(word|excel|ppt):(.*?)\]/);
      let cleanedContent = fullContent;
      let readyData = null;

      if (readyMatch) {
         cleanedContent = fullContent.replace(readyMatch[0], '').trim();
         readyData = { type: readyMatch[1], summary: readyMatch[2] };
      }

      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { 
          ...newHistory[newHistory.length - 1],
          content: cleanedContent, 
          isStreaming: false 
        };
        return newHistory;
      });

      if (readyData) {
        setPendingGeneration({
          ...readyData,
          fullContext: [...apiMessages, { role: 'assistant', content: cleanedContent }]
        });
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { 
          ...newHistory[newHistory.length - 1],
          content: `❌ 错误: ${error.message}`,
          isError: true,
          isStreaming: false 
        };
        return newHistory;
      });
    } finally {
      setIsLoading(false);
    }

  };

  const handleGenerate = async () => {
    if (!pendingGeneration) return;
    
    const aiConfig = getAiConfig();
    setIsLoading(true);
    
    try {
      const fullPrompt = pendingGeneration.fullContext
        .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
        .join('\n\n');
      
      let fullStreamContent = '';
      let structureString = '';
      let isCapturingStructure = false;

      // Use streaming generation for real-time preview
      await api.generateDocumentStream(
        fullPrompt,
        pendingGeneration.type,
        aiConfig,
        (chunk) => {
          if (chunk.includes('<STRUCTURE>')) {
             isCapturingStructure = true;
             const parts = chunk.split('<STRUCTURE>');
             fullStreamContent += parts[0];
             structureString += parts[1] || '';
             if (onGenerate) onGenerate(fullStreamContent);
          } else if (chunk.includes('</STRUCTURE>')) {
             const parts = chunk.split('</STRUCTURE>');
             structureString += parts[0];
             isCapturingStructure = false;
          } else if (isCapturingStructure) {
             structureString += chunk;
          } else {
             fullStreamContent += chunk;
             if (onGenerate) onGenerate(fullStreamContent);
          }
        }
      );

      let parsedStructure = null;
      try {
        if (structureString) {
          // Clean up potential markdown noise around JSON
          const cleanJson = structureString.replace(/```json|```/g, '').trim();
          parsedStructure = JSON.parse(cleanJson);
        }
      } catch (e) {
        console.error('Failed to parse structure from stream:', e);
      }

      // Now we have the structure (hopefully), generate the final document
      // We pass the parsedStructure as raw_structure to the backend to skip LLM
      const result = await api.generateDocument(
        pendingGeneration.type,
        'Generated Document',
        fullPrompt,
        aiConfig,
        parsedStructure // new argument for raw_structure
      );
      
      setHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `✅ 文档已生成！${result.message}`, 
        fileUrl: result.file_url 
      }]);
      
      setActiveDocument({
        structure: result.structure,
        type: pendingGeneration.type,
        fileUrl: result.file_url
      });
      
      if (onGenerate) onGenerate(result);
      setPendingGeneration(null);
      
    } catch (error) {
      setHistory(prev => [...prev, { role: 'assistant', content: `生成失败: ${error.message}`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-surface-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Sparkles size={20} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white tracking-wide font-display flex items-center gap-2">
              Office AI 助手
              {isOnline ? (
                <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-medium">
                  <Wifi size={10} /> 已连接
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full font-medium">
                  <WifiOff size={10} /> 连接断开
                </span>
              )}
            </h1>
            <p className="text-surface-400 text-xs font-medium">与 AI 对话，即刻生成专业文档</p>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-surface-400 hover:text-white transition-all border border-white/5"
            title="AI 设置"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-surface-800/50 flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-xl">
              <MessageSquare size={40} className="text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 font-display">开始协作吧</h2>
            <p className="text-surface-400 max-w-sm leading-relaxed">
              输入您的需求，我将为您精准生成 Word 报告、Excel 表格或 PPT 幻灯片。
            </p>
            
            <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-md">
              {['写一份项目策划书', '创建月度收支表', '做一个商业路演PPT', '撰写个人简历'].map((item) => (
                <button 
                  key={item}
                  onClick={() => setMessage(item)}
                  className="p-3.5 rounded-xl bg-surface-800/40 border border-white/5 text-sm text-surface-300 hover:bg-surface-700/50 hover:text-white transition-all text-left"
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
                msg.isError ? 'bg-red-500/10 border border-red-500/20 text-red-200' :
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-tr-none' 
                  : 'bg-surface-800 text-surface-100 rounded-tl-none border border-white/5'
              }`}>
                {msg.isError && <AlertCircle size={14} className="inline mr-2 mb-1" />}
                <div className={`prose ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.isStreaming && <span className="inline-block w-1 h-4 ml-1 bg-brand-400 animate-pulse align-middle" />}
                
                {msg.fileUrl && (
                  <a href={`${API_HOST}${msg.fileUrl}`} className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                      <Download size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">下载文档</p>
                      <p className="text-xs text-white/50">点击保存到本地</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && !history[history.length-1]?.isStreaming && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-surface-800 rounded-2xl rounded-tl-none px-5 py-4 border border-white/5 shadow-lg">
                <Loader2 size={18} className="text-brand-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Action Buttons */}
      {pendingGeneration && !isLoading && (
        <div className="px-6 py-4 bg-surface-900/80 backdrop-blur-md border-t border-white/5 flex gap-3 animate-fade-in">
          <button
            onClick={() => setPendingGeneration(null)}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10"
          >
            继续对话
          </button>
          <button
            onClick={handleGenerate}
            className="flex-1 px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            <span>生成并开始实时同步</span>
          </button>
        </div>
      )}

      {activeDocument && !isLoading && !pendingGeneration && (
        <div className="px-6 py-2 bg-brand-500/10 border-t border-brand-500/20 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-[10px] text-brand-400 font-bold uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></div>
            正在持续优化当前文档
          </div>
          <button 
            onClick={() => setActiveDocument(null)}
            className="text-[10px] text-surface-500 hover:text-white transition-colors"
          >
            结束修改
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-6 pt-2 z-10">
        <form onSubmit={handleSubmit} className={`relative bg-surface-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl ring-1 ring-white/5 transition-all ${!isOnline ? 'opacity-50 grayscale' : 'focus-within:ring-brand-500/50'}`}>
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
              disabled={!isOnline}
              placeholder={isOnline ? "描述您想创建的文档..." : "服务器连接已断开..."}
              rows={1}
              className="w-full bg-transparent border-0 text-white placeholder-surface-500 focus:ring-0 resize-none px-4 py-3 max-h-32 min-h-[50px] no-scrollbar"
              style={{ height: 'auto', minHeight: '52px' }}
            />
            
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="text-[10px] text-surface-500 uppercase tracking-widest font-semibold">
                {pendingGeneration ? '✨ 文档已就绪' : 'Enter 发送 · Shift+Enter 换行'}
              </div>

              <button
                type="submit"
                disabled={isLoading || !message.trim() || !isOnline}
                className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-lg shadow-brand-600/20"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
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

