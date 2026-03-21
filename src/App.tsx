import React from 'react';
import Sidebar from './components/Sidebar';
import PDFGrid from './components/PDFGrid';
import UploadModal from './components/UploadModal';
import PDFViewer from './components/PDFViewer';
import ChatAgent from './components/ChatAgent';
import ImageToPdfModal from './components/ImageToPdfModal';
import Login from './components/Login';
import { Plus, LayoutGrid, List, Filter, ChevronDown, FileText, HardDrive, Calendar, Image as ImageIcon, LogOut, User as UserIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, type PDFDocument } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { auth, logout } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, loading] = useAuthState(auth);

  React.useEffect(() => {
    if (user) {
      console.log('User signed in:', user.uid, 'Anonymous:', user.isAnonymous);
    } else if (!loading) {
      console.log('No user signed in');
    }
  }, [user, loading]);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [isImageToPdfModalOpen, setIsImageToPdfModalOpen] = React.useState(false);
  const [viewingPdf, setViewingPdf] = React.useState<PDFDocument | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [isMobile, setIsMobile] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [theme, setTheme] = React.useState<'zinc' | 'slate' | 'stone' | 'indigo'>(() => {
    return (localStorage.getItem('pdf-vault-theme') as any) || 'zinc';
  });

  React.useEffect(() => {
    localStorage.setItem('pdf-vault-theme', theme);
  }, [theme]);

  const themes = {
    zinc: { bg: 'bg-zinc-50/50', header: 'bg-white/80', text: 'text-zinc-900', accent: 'bg-zinc-900' },
    slate: { bg: 'bg-slate-900', header: 'bg-slate-800/80', text: 'text-slate-100', accent: 'bg-slate-700' },
    stone: { bg: 'bg-stone-100', header: 'bg-stone-50/80', text: 'text-stone-900', accent: 'bg-stone-800' },
    indigo: { bg: 'bg-indigo-50/50', header: 'bg-white/80', text: 'text-indigo-900', accent: 'bg-indigo-900' }
  };

  const currentTheme = themes[theme];

  const stats = useLiveQuery(async () => {
    const allPdfs = await db.pdfs.toArray();
    const totalSize = allPdfs.reduce((acc, pdf) => acc + pdf.size, 0);
    const totalCount = allPdfs.length;
    return { totalSize, totalCount };
  }, []);

  const selectedFolderName = useLiveQuery(async () => {
    if (selectedFolderId === null) return null;
    const folder = await db.folders.get(selectedFolderId);
    return folder?.name || null;
  }, [selectedFolderId]);

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${theme === 'slate' ? 'bg-slate-950 text-slate-100' : 'bg-white text-zinc-900'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-900/10 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Initializing PDF Vault...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login theme={theme} />;
  }

  return (
    <div className={`flex h-screen ${theme === 'slate' ? 'bg-slate-950 text-slate-100' : 'bg-white text-zinc-900'} font-sans selection:bg-zinc-900 selection:text-white overflow-hidden transition-colors duration-300 relative`}>
      <AnimatePresence>
        {(!isMobile || isSidebarOpen) && (
          <motion.div
            initial={isMobile ? { x: -300 } : undefined}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -300 } : undefined}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "z-50 shrink-0",
              isMobile ? "fixed inset-0 w-full h-full bg-black/50 backdrop-blur-sm" : "relative"
            )}
            onClick={() => isMobile && setIsSidebarOpen(false)}
          >
            <div 
              className={cn("h-full", isMobile ? "w-72" : "w-64")}
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                selectedFolderId={selectedFolderId}
                onSelectFolder={(id) => {
                  setSelectedFolderId(id);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenImageToPdf={() => {
                  setIsImageToPdfModalOpen(true);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                theme={theme}
                isMobile={isMobile}
                onClose={() => setIsSidebarOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-1 flex flex-col min-w-0 ${currentTheme.bg} transition-colors duration-300 relative`}>
        <header className={`h-16 sm:h-20 border-b ${theme === 'slate' ? 'border-slate-700 bg-slate-900/80' : 'border-zinc-200 bg-white/80'} backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300`}>
          <div className="flex items-center gap-2 sm:gap-4">
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 rounded-xl transition-colors ${theme === 'slate' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col">
              <h2 className={`text-sm sm:text-xl font-bold ${currentTheme.text} truncate max-w-[120px] sm:max-w-none`}>
                {selectedFolderName ? `${selectedCategory} / ${selectedFolderName}` : (selectedCategory || 'All Documents')}
              </h2>
              {isMobile && (
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                  {stats?.totalCount || 0} Files
                </p>
              )}
            </div>
            {!isMobile && (
              <>
                <div className={`w-px h-6 ${theme === 'slate' ? 'bg-slate-700' : 'bg-zinc-200'}`} />
                <div className={`flex items-center gap-1 ${theme === 'slate' ? 'bg-slate-800' : 'bg-zinc-100'} p-1 rounded-xl`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'list' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {!isMobile && (
              <div className={`flex items-center gap-1 ${theme === 'slate' ? 'bg-slate-800' : 'bg-zinc-100'} p-1 rounded-xl mr-2`}>
                {(['zinc', 'slate', 'stone', 'indigo'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`w-6 h-6 rounded-lg border-2 transition-all ${
                      theme === t 
                        ? 'border-zinc-900 scale-110 shadow-sm' 
                        : 'border-transparent hover:scale-105'
                    } ${
                      t === 'zinc' ? 'bg-zinc-200' :
                      t === 'slate' ? 'bg-slate-700' :
                      t === 'stone' ? 'bg-stone-300' :
                      'bg-indigo-400'
                    }`}
                    title={`${t.charAt(0).toUpperCase() + t.slice(1)} Theme`}
                  />
                ))}
              </div>
            )}

            <div className={`flex items-center gap-2 sm:gap-6 ${!isMobile && 'mr-4'}`}>
              <div className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-xl ${theme === 'slate' ? 'bg-slate-800/50 border-slate-700' : 'bg-zinc-100/50 border-zinc-200'} border`}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />
                )}
                {!isMobile && (
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold ${theme === 'slate' ? 'text-slate-500' : 'text-zinc-400'} uppercase tracking-widest leading-none`}>
                      {user.isAnonymous ? 'Guest' : 'User'}
                    </span>
                    <span className={`text-xs font-bold ${currentTheme.text} truncate max-w-[80px] sm:max-w-[100px]`}>
                      {user.displayName || user.email || (user.isAnonymous ? 'Anonymous' : user.uid.slice(0, 8))}
                    </span>
                  </div>
                )}
                <button
                  onClick={logout}
                  className={`p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors ${theme === 'slate' ? 'text-slate-400' : 'text-zinc-400'}`}
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {!isMobile && (
                <>
                  <div className={`w-px h-8 ${theme === 'slate' ? 'bg-slate-700' : 'bg-zinc-200'}`} />
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold ${theme === 'slate' ? 'text-slate-500' : 'text-zinc-400'} uppercase tracking-widest`}>Storage</span>
                    <span className={`text-sm font-bold ${currentTheme.text}`}>
                      {stats ? (stats.totalSize / 1024 / 1024).toFixed(1) : 0} MB
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold ${theme === 'slate' ? 'text-slate-500' : 'text-zinc-400'} uppercase tracking-widest`}>Files</span>
                    <span className={`text-sm font-bold ${currentTheme.text}`}>
                      {stats?.totalCount || 0}
                    </span>
                  </div>
                </>
              )}
            </div>

            {!isMobile && (
              <>
                <button
                  onClick={() => setIsImageToPdfModalOpen(true)}
                  className={`px-4 py-2.5 ${theme === 'slate' ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'} rounded-xl font-semibold text-sm transition-all flex items-center gap-2`}
                  title="Convert Images to PDF"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden lg:inline">Images to PDF</span>
                </button>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-semibold text-sm hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/10"
                >
                  <Plus className="w-4 h-4" />
                  Upload PDF
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-20 lg:pb-0">
          <PDFGrid
            category={selectedCategory}
            folderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            searchQuery={searchQuery}
            onView={setViewingPdf}
          />
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className={`fixed bottom-0 left-0 right-0 h-16 border-t ${theme === 'slate' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-zinc-200'} backdrop-blur-lg flex items-center justify-around px-4 z-40`}>
            <button 
              onClick={() => {
                setSelectedCategory(null);
                setSelectedFolderId(null);
              }}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${!selectedCategory && !selectedFolderId ? (theme === 'slate' ? 'text-white' : 'text-zinc-900') : 'text-zinc-400'}`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Vault</span>
            </button>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${isSidebarOpen ? (theme === 'slate' ? 'text-white' : 'text-zinc-900') : 'text-zinc-400'}`}
            >
              <Filter className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Filter</span>
            </button>
            <button 
              onClick={() => setIsImageToPdfModalOpen(true)}
              className="flex flex-col items-center gap-1 p-2 text-zinc-400"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Images</span>
            </button>
            <button 
              onClick={() => {
                // Trigger search focus in sidebar
                setIsSidebarOpen(true);
                setTimeout(() => {
                  const searchInput = document.querySelector('input[placeholder="Search PDFs..."]') as HTMLInputElement;
                  if (searchInput) searchInput.focus();
                }, 300);
              }}
              className="flex flex-col items-center gap-1 p-2 text-zinc-400"
            >
              <Search className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Search</span>
            </button>
          </div>
        )}

        {/* Mobile FAB */}
        {isMobile && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsUploadModalOpen(true)}
            className={`fixed bottom-20 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-40 m3-elevation-2 ${theme === 'slate' ? 'bg-slate-700 text-white' : 'bg-zinc-900 text-white'}`}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        theme={theme}
      />

      <ImageToPdfModal
        isOpen={isImageToPdfModalOpen}
        onClose={() => setIsImageToPdfModalOpen(false)}
        theme={theme}
      />

      <AnimatePresence>
        {viewingPdf && (
          <PDFViewer
            pdf={viewingPdf}
            onClose={() => setViewingPdf(null)}
          />
        )}
      </AnimatePresence>

      <ChatAgent theme={theme} />
    </div>
  );
}
