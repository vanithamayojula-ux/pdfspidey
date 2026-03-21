import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PDFDocument } from '../db';
import { FileText, MoreVertical, Trash2, Eye, Download, Calendar, HardDrive, Folder } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PDFGridProps {
  category: string | null;
  folderId: number | null;
  onSelectFolder: (id: number | null) => void;
  searchQuery: string;
  onView: (pdf: PDFDocument) => void;
}

export default function PDFGrid({ category, folderId, onSelectFolder, searchQuery, onView }: PDFGridProps) {
  const folders = useLiveQuery(async () => {
    if (!category || searchQuery) return [];
    return await db.folders
      .where('categoryName')
      .equals(category)
      .filter(f => f.parentId === (folderId ?? undefined))
      .toArray();
  }, [category, folderId, searchQuery]);

  const pdfs = useLiveQuery(async () => {
    let collection = db.pdfs.toCollection();
    
    if (folderId !== null) {
      collection = db.pdfs.where('folderId').equals(folderId);
    } else if (category) {
      collection = db.pdfs.where('category').equals(category);
    }
    
    const allPdfs = await collection.reverse().sortBy('createdAt');
    
    if (searchQuery) {
      return allPdfs.filter(pdf => 
        pdf.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return allPdfs;
  }, [category, folderId, searchQuery]);

  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [deletingFolderId, setDeletingFolderId] = React.useState<number | null>(null);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === id) {
      try {
        await db.pdfs.delete(id);
        setDeletingId(null);
      } catch (error) {
        console.error('Failed to delete PDF:', error);
        alert('Failed to delete the document. Please try again.');
      }
    } else {
      setDeletingId(id);
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setDeletingId(prev => prev === id ? null : prev), 3000);
    }
  };

  const handleDeleteFolder = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingFolderId === id) {
      try {
        await db.folders.delete(id);
        // Update subfolders
        await db.folders.where('parentId').equals(id).modify({ parentId: undefined });
        // Update PDFs that were in this folder
        await db.pdfs.where('folderId').equals(id).modify({ folderId: undefined });
        setDeletingFolderId(null);
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    } else {
      setDeletingFolderId(id);
      setTimeout(() => setDeletingFolderId(prev => prev === id ? null : prev), 3000);
    }
  };

  const handleDownload = (pdf: PDFDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = URL.createObjectURL(pdf.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdf.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!pdfs && !folders) return null;

  const isEmpty = (!pdfs || pdfs.length === 0) && (!folders || folders.length === 0);

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-zinc-300" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">No documents found</h3>
        <p className="text-sm text-zinc-500 max-w-xs">
          {searchQuery 
            ? `We couldn't find any documents matching "${searchQuery}"`
            : "This space is empty. Start by uploading a PDF or creating a folder."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Folders Section */}
      {folders && folders.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Folders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {folders.map((folder) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectFolder(folder.id!)}
                className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-zinc-200 rounded-2xl hover:shadow-lg hover:border-zinc-300 transition-all cursor-pointer relative"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Folder className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 truncate pr-6">{folder.name}</h4>
                </div>
                <button
                  onClick={(e) => handleDeleteFolder(folder.id!, e)}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 rounded-lg transition-all flex items-center gap-1",
                    deletingFolderId === folder.id
                      ? "bg-red-600 text-white px-3 opacity-100"
                      : "hover:bg-red-50 hover:text-red-600 text-zinc-400"
                  )}
                  title={deletingFolderId === folder.id ? "Confirm Delete" : "Delete Folder"}
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {deletingFolderId === folder.id && <span className="text-[8px] sm:text-[10px] font-bold uppercase">Confirm</span>}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      <div className="space-y-3 sm:space-y-4">
        {folders && folders.length > 0 && (
          <h3 className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Documents</h3>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {pdfs?.map((pdf) => (
              <motion.div
                layout
                key={pdf.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => onView(pdf)}
                className="group bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:border-zinc-300 transition-all cursor-pointer relative"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(pdf);
                      }}
                      className="p-1.5 sm:p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                      title="View"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDownload(pdf, e)}
                      className="p-1.5 sm:p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(pdf.id!, e)}
                      className={cn(
                        "p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2",
                        deletingId === pdf.id
                          ? "bg-red-600 text-white px-2 sm:px-3"
                          : "hover:bg-red-50 text-zinc-500 hover:text-red-600"
                      )}
                      title={deletingId === pdf.id ? "Confirm Delete" : "Delete"}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {deletingId === pdf.id && <span className="text-[8px] sm:text-[10px] font-bold uppercase">Confirm</span>}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 truncate pr-4" title={pdf.name}>
                    {pdf.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                    <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-600">{pdf.category}</span>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-zinc-50 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {format(pdf.createdAt, 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {(pdf.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
