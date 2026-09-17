import React from 'react';
import { Database, Search, Terminal, BookOpen, Layers, Lock, FileCode, Check } from 'lucide-react';
import { DatabaseStats } from '../types';

interface HeaderProps {
  stats: DatabaseStats | null;
  onOpenSearchModal: () => void;
  onOpenSqlConsole: () => void;
  onOpenDatabaseManager: () => void;
  currentView: 'articles' | 'toc' | 'article-detail';
  onNavigate: (view: 'articles' | 'toc') => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onOpenSearchModal,
  onOpenSqlConsole,
  onOpenDatabaseManager,
  currentView,
  onNavigate,
}) => {
  const fileName = stats?.fileInfo?.fileName || 'database.sql';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('articles')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">INFOPORTAL</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80 inline-flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-600" />
                  Chỉ đọc (Read-Only)
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Tra cứu dữ liệu thời gian thực đồng bộ từ file DB</p>
            </div>
          </div>

          {/* Quick Realtime Search Button */}
          <button
            type="button"
            id="btn-quick-search-trigger"
            onClick={onOpenSearchModal}
            className="flex-1 max-w-md hidden md:flex items-center justify-between px-3.5 py-2 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span>Tra cứu nhanh văn bản, từ khóa...</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 shadow-2xs">
              <kbd>Ctrl</kbd>+<kbd>K</kbd>
            </div>
          </button>

          {/* Nav & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View navigation */}
            <nav className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                id="nav-articles-btn"
                onClick={() => onNavigate('articles')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  currentView === 'articles' || currentView === 'article-detail'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tài liệu</span>
              </button>
              <button
                type="button"
                id="nav-toc-btn"
                onClick={() => onNavigate('toc')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  currentView === 'toc'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mục lục</span>
              </button>
            </nav>

            {/* Mobile search button */}
            <button
              type="button"
              id="btn-mobile-search"
              onClick={onOpenSearchModal}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              title="Tra cứu nhanh"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* SQL Console Inspector button */}
            <button
              type="button"
              id="btn-sql-console"
              onClick={onOpenSqlConsole}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Khám phá cơ sở dữ liệu SQL"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>SQL Console</span>
              {stats && (
                <span className="ml-0.5 text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  {stats.lastQueryTimeMs}ms
                </span>
              )}
            </button>

            {/* Database File Manager / Switcher Button (Replaces Add Document Button) */}
            <button
              type="button"
              id="btn-database-manager"
              onClick={onOpenDatabaseManager}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
              title="Quản lý và Nạp file Database"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Tệp DB:</span>
              <span className="max-w-[110px] truncate font-mono text-[11px] text-indigo-900">
                {fileName.replace(' (Mặc định)', '')}
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
