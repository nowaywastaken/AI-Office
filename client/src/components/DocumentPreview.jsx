export default function DocumentPreview({ result }) {
  if (!result) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="text-center text-gray-500">
          <div className="text-8xl mb-4 opacity-20">📄</div>
          <p className="text-lg">Document preview will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-800 to-slate-900 p-6">
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 h-full border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Generated Document</h2>
          <a
            href={result.file_url}
            download
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <span>⬇</span> Download
          </a>
        </div>
        
        <div className="bg-white rounded-lg p-8 h-[calc(100%-80px)] overflow-auto shadow-2xl">
          {/* Simulated Document Preview */}
          <div className="prose max-w-none">
            <p className="text-gray-600 text-center">
              {result.message}
            </p>
            <p className="text-gray-400 text-sm text-center mt-4">
              Full preview coming soon. Download the file to view in your Office application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
