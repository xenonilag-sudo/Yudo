import React from 'react';
import { ChevronRight, Clock, Tag, ArrowUpRight } from 'lucide-react';
import { Article, Category } from '../types';

interface TableOfContentsProps {
  categories: Category[];
  allArticles: Article[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  onSelectArticle: (article: Article) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  categories,
  allArticles,
  selectedCategoryId,
  onSelectCategory,
  onSelectArticle,
}) => {
  return (
    <div className="space-y-8">
      {/* Category Filter Pills Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Mục Lục Cẩm Nang Discord
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Duyệt cẩm nang theo chuyên đề: Kiến trúc kênh, Phân quyền vai trò, AutoMod, Bot và Quản trị
            </p>
          </div>

          {/* Quick Jump Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedCategoryId === null
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tất cả ({allArticles.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  selectedCategoryId === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.name} ({cat.article_count || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Category Tree */}
      <div className="grid grid-cols-1 gap-6">
        {categories
          .filter((cat) => selectedCategoryId === null || cat.id === selectedCategoryId)
          .map((cat) => {
            const categoryArticles = allArticles.filter((a) => a.category_id === cat.id);

            return (
              <div
                key={cat.id}
                id={`toc-category-${cat.slug}`}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {cat.sort_order}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{cat.name}</h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                          {categoryArticles.length} bài viết
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                </div>

                {/* Articles List inside Category */}
                {categoryArticles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3">Chưa có bài viết trong danh mục này.</p>
                ) : (
                  <div className="space-y-3">
                    {categoryArticles.map((article, idx) => (
                      <div
                        key={article.id}
                        onClick={() => onSelectArticle(article)}
                        className="group flex items-start justify-between gap-4 p-3.5 rounded-xl hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-mono font-semibold text-slate-400 mt-1 min-w-[24px]">
                            {cat.sort_order}.{idx + 1}
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                              <span>{article.title}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {article.summary}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {article.reading_time} phút đọc
                              </span>
                              <span>•</span>
                              <span>Tác giả: {article.author}</span>
                              {article.tags && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-slate-500">
                                    <Tag className="w-3 h-3" />
                                    {article.tags.split(',')[0]}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="shrink-0 p-1.5 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-white"
                          title="Xem bài viết"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
