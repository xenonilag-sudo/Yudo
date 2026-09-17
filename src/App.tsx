/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  ListTree,
  Search,
  MessageSquare,
  X,
} from 'lucide-react';
import { Article, Category, DatabaseStats, SearchFilter } from './types';
import {
  getDatabase,
  getDatabaseStats,
  getCategories,
  searchArticlesRealtime,
  getArticleBySlugOrId,
  getAllTags,
} from './services/sqlDatabase';
import { SearchBar } from './components/SearchBar';
import { ArticleCard } from './components/ArticleCard';
import { TableOfContents } from './components/TableOfContents';
import { ArticleDetailView } from './components/ArticleDetailView';
import { RealtimeSearchModal } from './components/RealtimeSearchModal';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Data
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);

  // Navigation and active view
  const [currentView, setCurrentView] = useState<'articles' | 'toc' | 'article-detail'>('articles');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedTocCategory, setSelectedTocCategory] = useState<number | null>(null);

  // Search and filters
  const [filter, setFilter] = useState<SearchFilter>({
    keyword: '',
    categoryId: undefined,
    tag: undefined,
    sortBy: 'relevance',
  });
  const [queryDurationMs, setQueryDurationMs] = useState<number>(0);
  const [sqlUsed, setSqlUsed] = useState<string>('');

  // Search Modal
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Initialize Database and load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize database instance from /database.sql
      await getDatabase();

      const [statsData, categoriesData, searchResult, tags] = await Promise.all([
        getDatabaseStats(),
        getCategories(),
        searchArticlesRealtime({ keyword: '', sortBy: 'relevance' }),
        getAllTags(),
      ]);

      setStats(statsData);
      setCategories(categoriesData);
      setArticles(searchResult.articles);
      setAllArticles(searchResult.articles);
      setPopularTags(tags);
      setQueryDurationMs(searchResult.durationMs);
      setSqlUsed(searchResult.sqlUsed);
    } catch (err: unknown) {
      console.error('Failed to initialize database:', err);
      setError(err instanceof Error ? err.message : 'Không thể khởi tạo dữ liệu hướng dẫn.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Execute Real-Time Search whenever filters change
  useEffect(() => {
    if (isLoading) return;

    let isMounted = true;
    const runSearch = async () => {
      try {
        const res = await searchArticlesRealtime(filter);
        if (isMounted) {
          setArticles(res.articles);
          setQueryDurationMs(res.durationMs);
          setSqlUsed(res.sqlUsed);
        }
      } catch (err) {
        console.error('Realtime search error:', err);
      }
    };

    runSearch();
    return () => {
      isMounted = false;
    };
  }, [filter, isLoading]);

  // Global Keyboard Shortcuts (Ctrl+K, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isSearchModalOpen) setIsSearchModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen]);

  // Open an article and increment views
  const handleSelectArticle = async (article: Article) => {
    try {
      const detailed = await getArticleBySlugOrId(article.id);
      if (detailed) {
        setSelectedArticle(detailed);
        setCurrentView('article-detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Refresh stats
        const newStats = await getDatabaseStats();
        setStats(newStats);
      }
    } catch (err) {
      console.error('Error fetching article details:', err);
    }
  };

  // Filter modifications
  const handleFilterChange = (newFilter: Partial<SearchFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
    if (currentView !== 'articles') {
      setCurrentView('articles');
    }
  };

  const handleClearFilters = () => {
    setFilter({
      keyword: '',
      categoryId: undefined,
      tag: undefined,
      sortBy: 'relevance',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Main Container - Focused purely on Discord Server Knowledge */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md animate-pulse mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Đang tải tài liệu Discord Server...</h2>
            <p className="text-xs text-slate-500">
              Khởi tạo cẩm nang kiến trúc, phân quyền và bảo mật server.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 my-8 text-center max-w-xl mx-auto">
            <h3 className="font-bold text-base mb-1">Không thể khởi tạo dữ liệu</h3>
            <p className="text-xs mb-4">{error}</p>
            <button
              type="button"
              onClick={loadInitialData}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Thanh tra cứu nhanh dài bằng theo màn hệ thống */}
            {currentView !== 'article-detail' && (
              <div className="w-full mb-6">
                <div className="relative w-full shadow-xs rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-600">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="system-quick-search-input"
                    value={filter.keyword}
                    onChange={(e) => {
                      handleFilterChange({ keyword: e.target.value });
                      if (currentView !== 'articles') setCurrentView('articles');
                    }}
                    placeholder="Tra cứu nhanh cẩm nang Discord: phân quyền roles, bot, bảo mật chống raid, onboarding... (Ctrl + K)"
                    className="w-full pl-12 pr-28 py-3.5 sm:py-4 text-sm sm:text-base bg-transparent rounded-2xl focus:outline-hidden text-slate-900 placeholder:text-slate-400 font-normal"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-2">
                    {filter.keyword && (
                      <button
                        type="button"
                        onClick={() => handleFilterChange({ keyword: '' })}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Xóa từ khóa tìm kiếm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsSearchModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 text-xs font-medium transition-colors"
                      title="Mở bảng tra cứu nhanh chuyên sâu (Ctrl+K)"
                    >
                      <span className="hidden sm:inline text-[11px] text-slate-500 font-sans">Nhanh</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] text-slate-500 font-mono border border-slate-200">
                        ⌘K
                      </kbd>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View Switcher: Displayed when not inside Article Detail view */}
            {currentView !== 'article-detail' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200">
                {/* View Tabs */}
                <div className="inline-flex p-1 bg-slate-200/80 rounded-xl self-start">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('articles');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      currentView === 'articles'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Bài Hướng Dẫn ({allArticles.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('toc');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      currentView === 'toc'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ListTree className="w-4 h-4" />
                    <span>Mục Lục ({categories.length} chuyên đề)</span>
                  </button>
                </div>

                {/* Shortcuts hint */}
                <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
                  <span>Nhấn</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px]">
                    Ctrl+K
                  </kbd>
                  <span>hoặc gõ vào thanh để tra cứu tức thời</span>
                </div>
              </div>
            )}

            {/* View 1: Article List & Search */}
            {currentView === 'articles' && (
              <div className="space-y-6">
                
                {/* Real-time Search and Filter Panel */}
                <SearchBar
                  filter={filter}
                  categories={categories}
                  popularTags={popularTags}
                  resultCount={articles.length}
                  durationMs={queryDurationMs}
                  sqlUsed={sqlUsed}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />

                {/* Category Quick Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ categoryId: undefined })}
                    className={`text-xs px-3.5 py-2 rounded-xl font-medium shrink-0 transition-all ${
                      filter.categoryId === undefined
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Tất cả ({allArticles.length})
                  </button>
                  {categories.map((cat) => {
                    const isSelected = filter.categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          handleFilterChange({
                            categoryId: isSelected ? undefined : cat.id,
                          })
                        }
                        className={`text-xs px-3.5 py-2 rounded-xl font-medium shrink-0 transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {cat.name} ({cat.article_count || 0})
                      </button>
                    );
                  })}
                </div>

                {/* Articles Grid */}
                {articles.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">Không tìm thấy tài liệu phù hợp</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Hãy thử tìm kiếm với từ khóa khác như "roles", "bot", "bảo mật", "onboarding" hoặc xóa bộ lọc.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Đặt lại toàn bộ lọc
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {articles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onSelect={handleSelectArticle}
                        searchKeyword={filter.keyword}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* View 2: Hierarchical Table of Contents (Mục lục) */}
            {currentView === 'toc' && (
              <TableOfContents
                categories={categories}
                allArticles={allArticles}
                selectedCategoryId={selectedTocCategory}
                onSelectCategory={(catId) => setSelectedTocCategory(catId)}
                onSelectArticle={handleSelectArticle}
              />
            )}

            {/* View 3: Article Reading Detail */}
            {currentView === 'article-detail' && selectedArticle && (
              <ArticleDetailView
                article={selectedArticle}
                onBack={() => setCurrentView('articles')}
                onSelectRelated={handleSelectArticle}
                allArticles={allArticles}
              />
            )}
          </>
        )}

      </main>

      {/* Realtime Search Modal (Ctrl+K) */}
      <RealtimeSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectArticle={handleSelectArticle}
      />

    </div>
  );
}
