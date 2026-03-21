import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Folder, Plus, Search, Trash2, ChevronRight, ChevronDown, File, Image as ImageIcon, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  selectedFolderId: number | null;
  onSelectFolder: (folderId: number | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenImageToPdf: () => void;
  theme: 'zinc' | 'slate' | 'stone' | 'indigo';
  isMobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  selectedCategory,
  onSelectCategory,
  selectedFolderId,
  onSelectFolder,
  searchQuery,
  onSearchChange,
  onOpenImageToPdf,
  theme,
  isMobile,
  onClose
}: SidebarProps) {
  const categories = useLiveQuery(() => db.categories.toArray());
  const folders = useLiveQuery(() => db.folders.toArray());
  const [newCategory, setNewCategory] = React.useState('');
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);

  const sidebarThemes = {
    zinc: 'bg-zinc-50 border-zinc-200 text-zinc-900',
    slate: 'bg-slate-900 border-slate-800 text-slate-100',
    stone: 'bg-stone-50 border-stone-200 text-stone-900',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900'
  };

  const currentSidebarTheme = sidebarThemes[theme];
  const [newFolder, setNewFolder] = React.useState('');
  const [addingFolderTo, setAddingFolderTo] = React.useState<{ category: string, parentId?: number } | null>(null);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = React.useState<Set<number>>(new Set());

  const toggleCategory = (name: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleFolder = (id: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await db.categories.add({ name: newCategory.trim() });
      setNewCategory('');
      setIsAddingCategory(false);
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const handleAddFolder = async (e: React.FormEvent, categoryName: string, parentId?: number) => {
    e.preventDefault();
    if (!newFolder.trim()) return;
    try {
      await db.folders.add({ name: newFolder.trim(), categoryName, parentId });
      setNewFolder('');
      setAddingFolderTo(null);
      if (parentId) {
        const newExpanded = new Set(expandedFolders);
        newExpanded.add(parentId);
        setExpandedFolders(newExpanded);
      } else {
        const newExpanded = new Set(expandedCategories);
        newExpanded.add(categoryName);
        setExpandedCategories(newExpanded);
      }
    } catch (error) {
      console.error('Failed to add folder:', error);
    }
  };

  const [deletingId, setDeletingId] = React.useState<{ type: 'category' | 'folder', id: number } | null>(null);

  const handleDeleteCategory = async (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId?.type === 'category' && deletingId.id === id) {
      try {
        await db.categories.delete(id);
        if (selectedCategory === name) {
          onSelectCategory(null);
          onSelectFolder(null);
        }
        setDeletingId(null);
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert('Failed to delete category. Please try again.');
      }
    } else {
      setDeletingId({ type: 'category', id });
      setTimeout(() => setDeletingId(prev => (prev?.type === 'category' && prev.id === id) ? null : prev), 3000);
    }
  };

  const handleDeleteFolder = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId?.type === 'folder' && deletingId.id === id) {
      try {
        await db.folders.delete(id);
        // Update children folders
        await db.folders.where('parentId').equals(id).modify({ parentId: undefined });
        // Update PDFs
        await db.pdfs.where('folderId').equals(id).modify({ folderId: undefined });
        if (selectedFolderId === id) onSelectFolder(null);
        setDeletingId(null);
      } catch (error) {
        console.error('Failed to delete folder:', error);
        alert('Failed to delete folder. Please try again.');
      }
    } else {
      setDeletingId({ type: 'folder', id });
      setTimeout(() => setDeletingId(prev => (prev?.type === 'folder' && prev.id === id) ? null : prev), 3000);
    }
  };

  const renderFolders = (categoryName: string, parentId?: number, depth = 0) => {
    const currentFolders = folders?.filter(f => f.categoryName === categoryName && f.parentId === parentId);
    if (!currentFolders) return null;

    return (
      <div className={cn("space-y-1", depth > 0 && "ml-4")}>
        {currentFolders.map((folder) => {
          const isFolderSelected = selectedFolderId === folder.id;
          const isExpanded = expandedFolders.has(folder.id!);
          const hasChildren = folders?.some(f => f.parentId === folder.id);

          return (
            <div key={folder.id} className="space-y-1">
              <div className="group relative flex items-center">
                <button
                  onClick={() => toggleFolder(folder.id!)}
                  className={cn(
                    "p-1 rounded-md transition-opacity",
                    theme === 'slate' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-zinc-200 text-zinc-400',
                    !hasChildren && "opacity-0 pointer-events-none"
                  )}
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => {
                    onSelectCategory(categoryName);
                    onSelectFolder(folder.id!);
                  }}
                  className={cn(
                    "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                    isFolderSelected
                      ? (theme === 'slate' ? "bg-slate-800 text-white" : "bg-zinc-200 text-zinc-900")
                      : (theme === 'slate' ? "text-slate-500 hover:bg-slate-800" : "text-zinc-500 hover:bg-zinc-200")
                  )}
                >
                  <File className={cn("w-3.5 h-3.5", isFolderSelected ? (theme === 'slate' ? "text-white" : "text-zinc-900") : (theme === 'slate' ? "text-slate-600" : "text-zinc-400"))} />
                  <span className="truncate">{folder.name}</span>
                </button>
                <div className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all",
                  deletingId?.type === 'folder' && deletingId.id === folder.id
                    ? "opacity-100 z-10"
                    : "opacity-0 group-hover:opacity-100"
                )}>
                  <button
                    onClick={() => setAddingFolderTo({ category: categoryName, parentId: folder.id })}
                    className={cn("p-1 rounded-md", theme === 'slate' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-zinc-200 text-zinc-500')}
                    title="Add Subfolder"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteFolder(folder.id!, e)}
                    className={cn(
                      "p-1 rounded-md transition-all flex items-center gap-1",
                      deletingId?.type === 'folder' && deletingId.id === folder.id
                        ? "bg-red-600 text-white px-2"
                        : "hover:bg-red-100 hover:text-red-600 text-zinc-500"
                    )}
                    title={deletingId?.type === 'folder' && deletingId.id === folder.id ? "Confirm Delete" : "Delete Folder"}
                  >
                    <Trash2 className="w-3 h-3" />
                    {deletingId?.type === 'folder' && deletingId.id === folder.id && <span className="text-[8px] font-bold uppercase">Confirm</span>}
                  </button>
                </div>
              </div>

              {addingFolderTo?.parentId === folder.id && (
                <form onSubmit={(e) => handleAddFolder(e, categoryName, folder.id)} className="ml-8 mr-2 mb-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="New subfolder..."
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                    onBlur={() => !newFolder && setAddingFolderTo(null)}
                    className="w-full px-3 py-1 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
                  />
                </form>
              )}

              {isExpanded && renderFolders(categoryName, folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("w-64 h-full border-r flex flex-col p-4 transition-colors duration-300", currentSidebarTheme)}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className={cn("text-xl font-bold flex items-center gap-2", theme === 'slate' ? 'text-white' : 'text-zinc-900')}>
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", theme === 'slate' ? 'bg-slate-700' : 'bg-zinc-900')}>
            P
          </div>
          PDF Vault
        </h1>
        {isMobile && onClose && (
          <button 
            onClick={onClose}
            className={cn("p-2 rounded-xl transition-colors", theme === 'slate' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-zinc-100 text-zinc-600')}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", theme === 'slate' ? 'text-slate-500' : 'text-zinc-400')} />
        <input
          type="text"
          placeholder="Search PDFs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all",
            theme === 'slate' 
              ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-slate-700" 
              : "bg-white border-zinc-200 text-zinc-900 focus:ring-zinc-900/5"
          )}
        />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className={cn("text-xs font-semibold uppercase tracking-wider", theme === 'slate' ? 'text-slate-500' : 'text-zinc-400')}>Categories</span>
          <button
            onClick={() => setIsAddingCategory(!isAddingCategory)}
            className={cn("p-1 rounded-md transition-colors", theme === 'slate' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-zinc-200 text-zinc-600')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {isAddingCategory && (
          <form onSubmit={handleAddCategory} className="mb-4 px-2">
            <input
              autoFocus
              type="text"
              placeholder="New category..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
            />
          </form>
        )}

        <div className="space-y-1">
          <button
            onClick={() => {
              onSelectCategory(null);
              onSelectFolder(null);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
              selectedCategory === null && selectedFolderId === null
                ? (theme === 'slate' ? "bg-slate-700 text-white" : "bg-zinc-900 text-white")
                : (theme === 'slate' ? "text-slate-400 hover:bg-slate-800" : "text-zinc-600 hover:bg-zinc-200")
            )}
          >
            <Folder className={cn("w-4 h-4", selectedCategory === null && selectedFolderId === null ? "text-white" : (theme === 'slate' ? "text-slate-500" : "text-zinc-400"))} />
            All Documents
          </button>

          {categories?.map((cat) => {
            const isExpanded = expandedCategories.has(cat.name);
            const isSelected = selectedCategory === cat.name && selectedFolderId === null;

            return (
              <div key={cat.id} className="space-y-1">
                <div className="group relative flex items-center">
                  <button
                    onClick={() => toggleCategory(cat.name)}
                    className={cn("p-1 rounded-md", theme === 'slate' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-zinc-200 text-zinc-400')}
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.name);
                      onSelectFolder(null);
                    }}
                    className={cn(
                      "flex-1 flex items-center gap-3 px-2 py-2 rounded-xl text-sm font-medium transition-all",
                      isSelected
                        ? (theme === 'slate' ? "bg-slate-700 text-white" : "bg-zinc-900 text-white")
                        : (theme === 'slate' ? "text-slate-400 hover:bg-slate-800" : "text-zinc-600 hover:bg-zinc-200")
                    )}
                  >
                    <Folder className={cn("w-4 h-4", isSelected ? "text-white" : (theme === 'slate' ? "text-slate-500" : "text-zinc-400"))} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                  <div className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all",
                    deletingId?.type === 'category' && deletingId.id === cat.id
                      ? "opacity-100 z-10"
                      : "opacity-0 group-hover:opacity-100"
                  )}>
                    <button
                      onClick={() => setAddingFolderTo({ category: cat.name })}
                      className={cn("p-1 rounded-md", theme === 'slate' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-zinc-200 text-zinc-500')}
                      title="Add Folder"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {cat.id && (
                      <button
                        onClick={(e) => handleDeleteCategory(cat.id!, cat.name, e)}
                        className={cn(
                          "p-1 rounded-md transition-all flex items-center gap-1",
                          deletingId?.type === 'category' && deletingId.id === cat.id
                            ? "bg-red-600 text-white px-2"
                            : "hover:bg-red-100 hover:text-red-600 text-zinc-500"
                        )}
                        title={deletingId?.type === 'category' && deletingId.id === cat.id ? "Confirm Delete" : "Delete Category"}
                      >
                        <Trash2 className="w-3 h-3" />
                        {deletingId?.type === 'category' && deletingId.id === cat.id && <span className="text-[8px] font-bold uppercase">Confirm</span>}
                      </button>
                    )}
                  </div>
                </div>

                {addingFolderTo?.category === cat.name && !addingFolderTo.parentId && (
                  <form onSubmit={(e) => handleAddFolder(e, cat.name)} className="ml-8 mr-2 mb-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="New folder..."
                      value={newFolder}
                      onChange={(e) => setNewFolder(e.target.value)}
                      onBlur={() => !newFolder && setAddingFolderTo(null)}
                      className="w-full px-3 py-1 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
                    />
                  </form>
                )}

                {isExpanded && renderFolders(cat.name)}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-200/10">
          <button
            onClick={onOpenImageToPdf}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group",
              theme === 'slate'
                ? "bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-colors",
              theme === 'slate' ? "bg-slate-700 text-slate-400 group-hover:text-white" : "bg-white text-zinc-500 group-hover:text-zinc-900"
            )}>
              <ImageIcon className="w-4 h-4" />
            </div>
            Combine Images
          </button>
        </div>
      </div>

      <div className={cn("mt-auto pt-4 border-t", theme === 'slate' ? 'border-slate-800' : 'border-zinc-200')}>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className={cn("w-8 h-8 rounded-full", theme === 'slate' ? 'bg-slate-800' : 'bg-zinc-200')} />
          <div className="flex flex-col">
            <span className={cn("text-xs font-semibold", theme === 'slate' ? 'text-white' : 'text-zinc-900')}>User</span>
            <span className={cn("text-[10px]", theme === 'slate' ? 'text-slate-500' : 'text-zinc-500')}>Free Plan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
