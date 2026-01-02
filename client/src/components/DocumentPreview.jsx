import { useState, useEffect, useRef } from 'react';
import { api, API_HOST } from '../services/api';
import { Download, Copy, Maximize2, FileText, Loader2, AlertCircle, Table as TableIcon, Presentation, Zap } from 'lucide-react';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function DocumentPreview({ result, liveDraft }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [excelData, setExcelData] = useState(null);
  
  const docxRef = useRef(null);

  useEffect(() => {
    if (result?.file_url) {
      const filename = result.file_url.split('/').pop();
      const ext = filename.split('.').pop().toLowerCase();
      setFileType(ext);
      fetchAndRenderPreview(filename, ext);
    } else {
      setFileType(null);
      setExcelData(null);
    }
  }, [result]);

  const fetchAndRenderPreview = async (filename, ext) => {
    setIsLoading(true);
    setError(null);
    setExcelData(null);

    try {
      if (ext === 'docx') {
        const blob = await api.getFileBlob(filename);
        if (docxRef.current) {
          docxRef.current.innerHTML = '';
          await renderAsync(blob, docxRef.current, null, {
            className: "docx-render",
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
          });
        }
      } else if (ext === 'xlsx') {
        const blob = await api.getFileBlob(filename);
        const buffer = await blob.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setExcelData(data);
      }
    } catch (err) {
      console.error('Preview error:', err);
      setError('无法加载文档预览。请直接下载查看。');
    } finally {
      setIsLoading(false);
    }
  };

  if (!result && !liveDraft) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in select-none">
        <div className="w-64 h-64 relative mb-8 opacity-50">
           <div className="absolute inset-0 bg-gradient-to-tr from-surface-800 to-transparent rounded-2xl border border-white/5 transform rotate-3"></div>
           <div className="absolute inset-0 bg-surface-900/80 backdrop-blur-sm rounded-2xl border border-white/10 transform -rotate-3 flex items-center justify-center">
             <FileText size={80} className="text-surface-700" />
           </div>
        </div>
        <h3 className="text-xl font-semibold text-white/50 font-display tracking-wide">就绪，待创建</h3>
        <p className="text-surface-500 mt-2 max-w-xs text-sm">
          生成的文档将在此处显示。您可以实时预览并立即下载。
        </p>
      </div>
    );
  }

  // Handle live streaming preview
  if (liveDraft && !result) {
    return (
      <div className="h-full flex flex-col p-8 animate-fade-in relative overflow-hidden bg-surface-950/30">
        <div className="flex items-center gap-3 mb-6 p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl">
          <Zap className="text-brand-400 animate-pulse" size={20} />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">正在生成实时草稿...</h3>
            <p className="text-[10px] text-surface-400">AI 正在努力创作中，完成后将自动转换为专业 Office 格式</p>
          </div>
        </div>
        <div className="flex-1 bg-white shadow-2xl rounded-sm p-12 overflow-auto custom-scrollbar prose prose-slate max-w-3xl mx-auto w-full prose-headings:text-surface-900 prose-p:text-surface-700">
           <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {liveDraft}
          </ReactMarkdown>
          <div className="w-1 h-5 bg-brand-500 animate-pulse inline-block align-middle ml-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative animate-fade-in group">
      {/* Floating Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-surface-900/95 backdrop-blur-md rounded-full px-2 py-1.5 shadow-2xl border border-white/20 opacity-90 group-hover:opacity-100 transition-all duration-300 transform translate-y-0 shadow-brand-500/10">
        <a
          href={`${API_HOST}${result.file_url}`}
          download
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all shadow-lg shadow-brand-600/20 active:scale-95"
        >
          <Download size={14} />
          <span className="text-xs uppercase tracking-wider font-bold">下载文档</span>
        </a>
        <div className="w-px h-4 bg-white/20 mx-1"></div>
        <button className="p-2 text-surface-200 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-90" title="复制">
          <Copy size={16} />
        </button>
        <button className="p-2 text-surface-200 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-90" title="全屏">
           <Maximize2 size={16} />
        </button>
      </div>

      {/* Document Workspace */}
      <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar flex justify-center bg-surface-950/30">
        
        {/* Paper Container */}
        <div className={`w-full ${fileType === 'xlsx' ? 'max-w-7xl' : 'max-w-3xl'} bg-white min-h-[95%] shadow-2xl rounded-sm relative overflow-hidden ring-1 ring-white/10`}>
          {/* Simulated Office UI Header */}
          <div className="h-10 bg-surface-50 border-b border-surface-200 flex items-center px-4 gap-2 opacity-50 pointer-events-none select-none">
            <div className="w-3 h-3 rounded-full bg-red-400/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-400/50"></div>
            <div className="ml-4 text-[10px] font-bold text-surface-400 uppercase tracking-tighter">
              {fileType} Editor Mode
            </div>
          </div>

          <div className={`${fileType === 'xlsx' ? 'p-2' : 'p-4 md:p-12'} h-full min-h-[500px]`}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-surface-400 italic">
                <Loader2 className="animate-spin mb-4" size={32} />
                正在加载专业预览...
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-red-500">
                <AlertCircle className="mb-4" size={32} />
                <p>{error}</p>
              </div>
            ) : fileType === 'docx' ? (
              <div ref={docxRef} className="docx-container" />
            ) : fileType === 'xlsx' && excelData ? (
              <div className="overflow-auto max-h-[70vh]">
                <table className="min-w-full border-collapse text-sm text-left text-gray-700">
                  <thead className="sticky top-0 bg-gray-100 shadow-sm">
                    <tr>
                      {excelData[0]?.map((cell, idx) => (
                        <th key={idx} className="border border-gray-200 px-4 py-2 font-semibold bg-gray-50">{cell}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.slice(1).map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="border border-gray-200 px-4 py-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : fileType === 'pptx' ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-surface-500 bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
                <Presentation size={48} className="mb-4 opacity-50" />
                <h4 className="text-lg font-semibold mb-2">PowerPoint 专业预览正在完善中</h4>
                <p className="text-sm max-w-xs text-center opacity-70">
                  当前支持基础结构预览，建议下载后在 Microsoft Office 中查看完整动画和布局。
                </p>
                <div className="mt-6 flex gap-2">
                  <div className="h-8 w-16 bg-surface-200 rounded animate-pulse"></div>
                  <div className="h-8 w-24 bg-surface-200 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-surface-200 rounded animate-pulse"></div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center text-gray-300 text-[10px] uppercase tracking-[0.3em] font-sans select-none pointer-events-none">
            Powered by AI Office Engine
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .docx-container {
          background: white;
          padding: 0 !important;
        }
        .docx-render {
          margin: 0 auto;
          box-shadow: none !important;
          padding: 0 !important;
          border: none !important;
        }
        .docx-render section {
          padding: 2cm !important;
          margin-bottom: 0 !important;
          box-shadow: none !important;
          width: 100% !important;
        }
      `}} />
    </div>
  );
}
