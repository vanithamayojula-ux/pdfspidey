import React from 'react';
import { db } from '../db';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'zinc' | 'slate' | 'stone' | 'indigo';
}

export default function UploadModal({ isOpen, onClose, theme = 'zinc' }: UploadModalProps) {
  const categories = useLiveQuery(() => db.categories.toArray());
  const [file, setFile] = React.useState<File | null>(null);
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [folderId, setFolderId] = React.useState<string>('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const folders = useLiveQuery(
    () => (category ? db.folders.where('categoryName').equals(category).toArray() : []),
    [category]
  );

  const getHierarchicalFolders = () => {
    if (!folders) return [];
    
    const result: { id: number; name: string; depth: number }[] = [];
    
    const addChildren = (parentId?: number, depth = 0) => {
      const children = folders.filter(f => f.parentId === parentId);
      children.forEach(child => {
        result.push({ id: child.id!, name: child.name, depth });
        addChildren(child.id, depth + 1);
      });
    };
    
    addChildren(undefined);
    return result;
  };

  const hierarchicalFolders = getHierarchicalFolders();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setName(selectedFile.name.replace(/\.[^/.]+$/, "")); // Default name without extension
      setError(null);
    } else {
      setError('Please select a valid PDF file.');
      setFile(null);
      setName('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !category || !name.trim()) return;

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const blob = new Blob([reader.result as ArrayBuffer], { type: 'application/pdf' });
        await db.pdfs.add({
          name: name.trim() + '.pdf',
          category,
          folderId: folderId ? parseInt(folderId) : undefined,
          size: file.size,
          type: file.type,
          data: blob,
          createdAt: Date.now()
        });
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setFile(null);
          setName('');
          setCategory('');
          setFolderId('');
          setSuccess(false);
        }, 1500);
      };
      reader.onerror = () => setError('Failed to read file.');
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('Failed to upload PDF.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${theme === 'slate' ? 'bg-slate-900 border border-slate-700' : 'bg-white'} w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300`}
      >
        <div className={`p-6 border-b ${theme === 'slate' ? 'border-slate-800' : 'border-zinc-100'} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${theme === 'slate' ? 'text-white' : 'text-zinc-900'}`}>Upload PDF</h2>
          <button onClick={onClose} className={`p-2 ${theme === 'slate' ? 'hover:bg-slate-800' : 'hover:bg-zinc-100'} rounded-full transition-colors`}>
            <X className={`w-5 h-5 ${theme === 'slate' ? 'text-slate-400' : 'text-zinc-500'}`} />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className={`text-sm font-semibold ${theme === 'slate' ? 'text-slate-300' : 'text-zinc-700'}`}>Document Name</label>
            <input
              type="text"
              required
              placeholder="Enter document name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                theme === 'slate' 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-slate-600' 
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-zinc-900/5'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={`text-sm font-semibold ${theme === 'slate' ? 'text-slate-300' : 'text-zinc-700'}`}>Category</label>
              <select
                required
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setFolderId('');
                }}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  theme === 'slate' 
                    ? 'bg-slate-800 border-slate-700 text-white focus:ring-slate-600' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-zinc-900/5'
                }`}
              >
                <option value="" className={theme === 'slate' ? 'bg-slate-900 text-white' : ''}>Select...</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.name} className={theme === 'slate' ? 'bg-slate-900 text-white' : ''}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-semibold ${theme === 'slate' ? 'text-slate-300' : 'text-zinc-700'}`}>Folder (Optional)</label>
              <select
                value={folderId}
                disabled={!category}
                onChange={(e) => setFolderId(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                  theme === 'slate' 
                    ? 'bg-slate-800 border-slate-700 text-white focus:ring-slate-600' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-zinc-900/5'
                }`}
              >
                <option value="" className={theme === 'slate' ? 'bg-slate-900 text-white' : ''}>Root</option>
                {hierarchicalFolders.map((f) => (
                  <option key={f.id} value={f.id} className={theme === 'slate' ? 'bg-slate-900 text-white' : ''}>
                    {'\u00A0'.repeat(f.depth * 3)}{f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-semibold ${theme === 'slate' ? 'text-slate-300' : 'text-zinc-700'}`}>PDF File</label>
            <div className="relative group">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all ${
                theme === 'slate'
                  ? 'border-slate-700 bg-slate-800/50 group-hover:border-slate-500'
                  : 'border-zinc-200 bg-zinc-50/50 group-hover:border-zinc-400'
              }`}>
                {file ? (
                  <>
                    <FileText className={`w-10 h-10 ${theme === 'slate' ? 'text-white' : 'text-zinc-900'}`} />
                    <span className={`text-sm font-medium truncate max-w-[200px] ${theme === 'slate' ? 'text-white' : 'text-zinc-900'}`}>{file.name}</span>
                    <span className={`text-xs ${theme === 'slate' ? 'text-slate-400' : 'text-zinc-500'}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </>
                ) : (
                  <>
                    <Upload className={`w-10 h-10 transition-colors ${theme === 'slate' ? 'text-slate-400 group-hover:text-slate-200' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                    <span className={`text-sm font-medium ${theme === 'slate' ? 'text-slate-300 group-hover:text-white' : 'text-zinc-600'}`}>Click or drag PDF here</span>
                    <span className={`text-xs ${theme === 'slate' ? 'text-slate-500' : 'text-zinc-400'}`}>Maximum file size: 50MB</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                  theme === 'slate' ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 'bg-red-50 text-red-600'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                  theme === 'slate' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Upload successful!
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={!file || !category || isUploading || success}
            className={`w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg ${
              theme === 'slate' 
                ? 'bg-slate-700 text-white hover:bg-slate-600 shadow-slate-900/20' 
                : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-900/10'
            }`}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Upload Document'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
