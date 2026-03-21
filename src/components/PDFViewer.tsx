import React from 'react';
import { X, Download, Maximize2, Minimize2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PDFDocument } from '../db';

interface PDFViewerProps {
  pdf: PDFDocument | null;
  onClose: () => void;
}

export default function PDFViewer({ pdf, onClose }: PDFViewerProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (pdf) {
      const url = URL.createObjectURL(pdf.data);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfUrl(null);
    }
  }, [pdf]);

  if (!pdf || !pdfUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen ? 'w-full h-full' : 'w-full max-w-5xl h-[85vh]'
        }`}
      >
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-zinc-900 truncate max-w-[200px] sm:max-w-md" title={pdf.name}>
                {pdf.name}
              </h2>
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{pdf.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (pdfUrl) {
                  window.open(pdfUrl, '_blank');
                }
              }}
              className="p-2 hover:bg-zinc-200 rounded-xl text-zinc-600 transition-colors"
              title="Open in New Tab"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = pdfUrl;
                a.download = pdf.name;
                a.click();
              }}
              className="p-2 hover:bg-zinc-200 rounded-xl text-zinc-600 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-zinc-200 rounded-xl text-zinc-600 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <div className="w-px h-6 bg-zinc-200 mx-2" />
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-zinc-800 relative overflow-hidden flex flex-col">
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-full border-none"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-zinc-900 text-white">
              <Download className="w-12 h-12 mb-4 text-zinc-500" />
              <h3 className="text-lg font-bold mb-2">PDF Viewer Blocked</h3>
              <p className="text-sm text-zinc-400 mb-6 max-w-md">
                Your browser (Microsoft Edge) might be blocking the embedded PDF viewer. 
                Please click the button below to view the document.
              </p>
              <button
                onClick={() => window.open(pdfUrl, '_blank')}
                className="px-6 py-3 bg-white text-zinc-900 rounded-2xl font-bold hover:bg-zinc-200 transition-all flex items-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Open PDF in New Tab
              </button>
            </div>
          </object>
        </div>
      </motion.div>
    </div>
  );
}
