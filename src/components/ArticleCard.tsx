import React from 'react';
import { Clock, Eye, Calendar, ArrowRight, Tag } from 'lucide-react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onSelect: (article: Article) => void;
  searchKeyword?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelect,
  searchKeyword,
}) => {
  // Helper to highlight matching text
  const renderHighlighted = (text: string, keyword?: string) => {
    if (!keyword || !keyword.trim()) return text;
    const kw = keyword.trim();
    const parts = text.split(new RegExp(`(${kw})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === kw.toLowerCase() ? (
            <mark key={i} className="bg-amber-100 text-amber-900 font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const tagList = article.tags
    ? article.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const formattedDate = new Date(article.published_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <article
      id={`article-card-${article.id}`}
      onClick={() => onSelect(article)}
      className="group bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Header row: category + metadata */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {article.category_name || 'Thông tin'}
          </span>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.reading_time} phút</span>
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{article.views.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
          {renderHighlighted(article.title, searchKeyword)}
        </h3>

        {/* Summary */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
          {renderHighlighted(article.summary, searchKeyword)}
        </p>
      </div>

      <div>
        {/* Tags */}
        {tagList.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <Tag className="w-3 h-3 text-slate-400 shrink-0" />
            {tagList.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
            {tagList.length > 3 && (
              <span className="text-[11px] text-slate-400">+{tagList.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer: Author & Read link */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px]">
              {article.author.charAt(0)}
            </div>
            <div>
              <span className="font-medium text-slate-800 block leading-tight">{article.author}</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" /> {formattedDate}
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform text-xs">
            Đọc tiếp
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
