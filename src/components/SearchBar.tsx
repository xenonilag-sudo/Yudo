import React from 'react';
import { SlidersHorizontal, ArrowUpDown, Tag } from 'lucide-react';
import { Category, SearchFilter } from '../types';

interface SearchBarProps {
  filter: SearchFilter;
  categories: Category[];
  popularTags: string[];
  resultCount: number;
  durationMs: number;
  sqlUsed?: string;
  onFilterChange: (newFilter: Partial<SearchFilter>) => void;
  onClearFilters: () => void;
  onShowSqlInfo?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filter,
  categories,
  popularTags,
  resultCount,
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilter = !!(filter.keyword || filter.categoryId || filter.tag);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 mb-8">
      {/* Category and Sort Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category & Sort Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[180px] sm:min-w-[210px]">
            <select
              id="select-category-filter"
              value={filter.categoryId || ''}
              onChange={(e) =>
                onFilterChange({
                  categoryId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
            >
              <option value="">Tất cả chuyên mục ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.article_count ? `(${cat.article_count})` : ''}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative min-w-[140px] sm:min-w-[160px]">
            <select
              id="select-sort-filter"
              value={filter.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SearchFilter['sortBy'] })}
              className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
            >
              <option value="relevance">Độ liên quan</option>
              <option value="newest">Mới nhất</option>
              <option value="views">Xem nhiều nhất</option>
              <option value="title">Tên A-Z</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Results Counter & Reset Filter */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-800">
            {resultCount} {resultCount === 1 ? 'bài hướng dẫn' : 'bài hướng dẫn'}
          </span>
          {hasActiveFilter && (
            <>
              <span>•</span>
              <button
                type="button"
                onClick={onClearFilters}
                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
              >
                Xóa bộ lọc
              </button>
            </>
          )}
        </div>
      </div>

      {/* Suggested Quick Search Tags */}
      {popularTags.length > 0 && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-400 mr-1">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>Chủ đề nhanh:</span>
          </div>
          {popularTags.slice(0, 8).map((tag) => {
            const isSelected = filter.tag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onFilterChange({ tag: isSelected ? undefined : tag })}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
