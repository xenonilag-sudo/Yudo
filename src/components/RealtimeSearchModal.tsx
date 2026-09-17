import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, BookOpen, Clock, Tag } from 'lucide-react';
import { Article } from '../types';
import { searchArticlesRealtime } from '../services/sqlDatabase';

interface RealtimeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
}

export const RealtimeSearchModal: React.FC<RealtimeSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
}) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      doSearch('');
    } else {
      setKeyword('');
    }
  }, [isOpen]);

  const doSearch = async (kw: string) => {
    try {
      const res = await searchArticlesRealtime({
        keyword: kw,
        sortBy: 'relevance',
      });
      setResults(res.articles);
      setSelectedIndex(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (val: string) => {
    setKeyword(val);
    doSearch(val);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectArticle(results[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-12 sm:pt-20 p-4">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search header */}
        <div className="relative border-b border-slate-200 p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Tìm kiếm nhanh cẩm nang Discord: roles, bot, bảo mật, onboarding..."
            className="w-full text-base bg-transparent border-none focus:outline-hidden text-slate-900 placeholder:text-slate-400"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => handleInputChange('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Results summary bar */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            {results.length} {results.length === 1 ? 'bài hướng dẫn' : 'bài hướng dẫn phù hợp'}
          </span>
          <span className="text-[11px] text-slate-400">Dùng phím ↑ ↓ để duyệt, Enter để mở</span>
        </div>

        {/* Results list */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Không tìm thấy tài liệu phù hợp với từ khóa &quot;{keyword}&quot;.
            </div>
          ) : (
            results.map((article, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={article.id}
                  onClick={() => {
                    onSelectArticle(article);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                          {article.category_name}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {article.reading_time}p
                        </span>
                      </div>
                      <h4
                        className={`text-sm font-semibold line-clamp-1 ${
                          isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'
                        }`}
                      >
                        {article.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {article.summary}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 mt-2 transition-transform ${
                      isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info with shortcuts */}
        <div className="bg-slate-50 text-slate-500 px-4 py-2.5 text-xs flex items-center justify-between border-t border-slate-200">
          <div className="flex items-center gap-3">
            <span>Dùng phím <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">↓</kbd> để chọn</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">↵ Enter</kbd> để đọc</span>
          </div>
          <span className="shrink-0 text-slate-400">ESC để đóng</span>
        </div>
      </div>
    </div>
  );
};
