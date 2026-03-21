import React from 'react';
import { db } from '../db';
import { X, Image as ImageIcon, FileText, CheckCircle2, AlertCircle, Loader2, Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

interface ImageToPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'zinc' | 'slate' | 'stone' | 'indigo';
}

interface SelectedImage {
  id: string;
  file: File;
  preview: string;
}

export default function ImageToPdfModal({ isOpen, onClose, theme = 'zinc' }: ImageToPdfModalProps) {
  const categories = useLiveQuery(() => db.categories.toArray());
  const [selectedImages, setSelectedImages] = React.useState<SelectedImage[]>([]);
  const [pdfName, setPdfName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [folderId, setFolderId] = React.useState<string>('');
  const [isConverting, setIsConverting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: File[] = [];
    if ('files' in e.target && e.target.files) {
      files = Array.from(e.target.files);
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      files = Array.from(e.dataTransfer.files);
    }

    const validImages = files.filter(f => f.type.startsWith('image/'));
    
    if (validImages.length === 0 && files.length > 0) {
      setError('Please select valid image files.');
      return;
    }

    const newImages = validImages.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file)
    }));

    setSelectedImages(prev => [...prev, ...newImages]);
    setError(null);
    if ('value' in e.target) (e.target as HTMLInputElement).value = '';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageChange(e);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length > 0) {
      const files = imageItems.map(item => item.getAsFile()).filter((f): f is File => f !== null);
      const newImages = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file)
      }));
      setSelectedImages(prev => [...prev, ...newImages]);
      setError(null);
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...selectedImages];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newImages.length) return;
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setSelectedImages(newImages);
  };

  const convertToPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedImages.length === 0 || !category || !pdfName.trim()) return;

    setIsConverting(true);
    setError(null);

    try {
      const pdf = new jsPDF();
      
      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        const imgData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(img.file);
        });

        if (i > 0) pdf.addPage();
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
        const width = imgProps.width * ratio;
        const height = imgProps.height * ratio;
        const x = (pdfWidth - width) / 2;
        const y = (pdfHeight - height) / 2;

        pdf.addImage(imgData, 'JPEG', x, y, width, height);
      }

      const pdfOutput = pdf.output('blob');
      
      await db.pdfs.add({
        name: pdfName.trim() + '.pdf',
        category,
        folderId: folderId ? parseInt(folderId) : undefined,
        size: pdfOutput.size,
        type: 'application/pdf',
        data: pdfOutput,
        createdAt: Date.now()
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (err) {
      setError('Failed to convert images to PDF.');
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  const resetForm = () => {
    selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setSelectedImages([]);
    setPdfName('');
    setCategory('');
    setFolderId('');
    setSuccess(false);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${theme === 'slate' ? 'bg-slate-900 border border-slate-700' : 'bg-white'} w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300 flex flex-col max-h-[90vh]`}
      >
        <div className={`p-6 border-b ${theme === 'slate' ? 'border-slate-800' : 'border-zinc-100'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme === 'slate' ? 'bg-slate-800 text-slate-400' : 'bg-zinc-100 text-zinc-500'}`}>
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className={`text-xl font-bold ${theme === 'slate' ? 'text-white' : 'text-zinc-900'}`}>Images to PDF</h2>
          </div>
          <button onClick={onClose} className={`p-2 ${theme === 'slate' ? 'hover:bg-slate-800' : 'hover:bg-zinc-100'} rounded-full transition-colors`}>
            <X className={`w-5 h-5 ${theme === 'slate' ? 'text-slate-400' : 'text-zinc-500'}`} />
          </button>
        </div>

        <form onPaste={handlePaste} onSubmit={convertToPdf} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${theme === 'slate' ? 'text-slate-300' : 'text-zinc-700'}`}>PDF Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter PDF name..."
                  value={pdfName}
                  onChange={(e) => setPdfName(e.target.value)}
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
                  <label className={`text-sm font-semibold ${theme === 'slate' ? 'text-slate-300' : 'text-zinc-700'}`}>Folder</label>
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
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-semibold ${theme === 'slate' ? 'text-slate-300' : 'text-zinc-700'}`}>Select Images</label>
              <div 
                className="relative group h-[124px]"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                  isDragging
                    ? (theme === 'slate' ? 'border-slate-400 bg-slate-800' : 'border-zinc-900 bg-zinc-100')
                    : (theme === 'slate'
                        ? 'border-slate-700 bg-slate-800/50 group-hover:border-slate-500'
                        : 'border-zinc-200 bg-zinc-50/50 group-hover:border-zinc-400')
                }`}>
                  <Plus className={`w-6 h-6 ${isDragging ? (theme === 'slate' ? 'text-white' : 'text-zinc-900') : (theme === 'slate' ? 'text-slate-500' : 'text-zinc-400')}`} />
                  <span className={`text-sm font-medium ${isDragging ? (theme === 'slate' ? 'text-white' : 'text-zinc-900') : (theme === 'slate' ? 'text-slate-300 group-hover:text-white' : 'text-zinc-600')}`}>
                    {isDragging ? 'Drop Images Here' : 'Add, Drop or Paste Images'}
                  </span>
                  {!isDragging && (
                    <span className={`text-[10px] ${theme === 'slate' ? 'text-slate-500' : 'text-zinc-400'}`}>
                      Supports multi-select & folder drop
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={`text-sm font-semibold ${theme === 'slate' ? 'text-slate-300' : 'text-zinc-700'}`}>
                Selected Images ({selectedImages.length})
              </label>
              {selectedImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedImages([])}
                  className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 rounded-2xl border ${
              theme === 'slate' ? 'bg-slate-950/50 border-slate-800' : 'bg-zinc-50/50 border-zinc-100'
            }`}>
              <AnimatePresence>
                {selectedImages.map((img, index) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`relative group aspect-square rounded-xl overflow-hidden border ${
                      theme === 'slate' ? 'border-slate-700' : 'border-zinc-200'
                    }`}
                  >
                    <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white disabled:opacity-30"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'down')}
                          disabled={index === selectedImages.length - 1}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white disabled:opacity-30"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                      {index + 1}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {selectedImages.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-400">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">No images selected</p>
                </div>
              )}
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
                PDF created successfully!
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={selectedImages.length === 0 || !category || isConverting || success}
            className={`w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xl ${
              theme === 'slate' 
                ? 'bg-slate-700 text-white hover:bg-slate-600 shadow-slate-900/40' 
                : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-900/20'
            }`}
          >
            {isConverting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Converting to PDF...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Convert to PDF
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
