import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Tag,
  Share2,
  Bookmark,
  Check,
  ListTree,
  ChevronRight,
  Printer,
  Type,
} from 'lucide-react';
import { Article } from '../types';

interface ArticleDetailViewProps {
  article: Article;
  onBack: () => void;
  onSelectRelated: (article: Article) => void;
  allArticles: Article[];
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  onBack,
  onSelectRelated,
  allArticles,
}) => {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [activeAnchor, setActiveAnchor] = useState<string>('');

  const sections = article.sections || [];

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].section_anchor);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveAnchor(sections[i].section_anchor);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScrollToAnchor = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveAnchor(anchor);
    }
  };

  // Related articles in same category
  const relatedArticles = allArticles
    .filter((a) => a.category_id === article.category_id && a.id !== article.id)
    .slice(0, 3);

  const tagList = article.tags
    ? article.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  // Simple Markdown parser for article content
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        const title = trimmed.replace(/^#\s+/, '');
        const anchor = title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        elements.push(
          <h2
            key={index}
            id={anchor}
            className="text-xl sm:text-2xl font-bold text-slate-900 mt-8 mb-4 pt-6 border-t border-slate-100 scroll-mt-24 flex items-center gap-2 group"
          >
            <span className="w-1.5 h-6 rounded-full bg-indigo-600 inline-block"></span>
            <span>{title}</span>
          </h2>
        );
      } else if (trimmed.startsWith('## ')) {
        const title = trimmed.replace(/^##\s+/, '');
        const anchor = title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        elements.push(
          <h3
            key={index}
            id={anchor}
            className="text-lg sm:text-xl font-semibold text-slate-800 mt-6 mb-3 scroll-mt-24 text-indigo-950"
          >
            {title}
          </h3>
        );
      } else if (trimmed.startsWith('- ')) {
        elements.push(
          <li key={index} className="ml-5 list-disc text-slate-700 leading-relaxed my-1.5 pl-1">
            {renderInlineMarkdown(trimmed.replace(/^- /, ''))}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <li key={index} className="ml-5 list-decimal text-slate-700 leading-relaxed my-1.5 pl-1">
            {renderInlineMarkdown(trimmed.replace(/^\d+\.\s/, ''))}
          </li>
        );
      } else if (trimmed === '') {
        elements.push(<div key={index} className="h-3" />);
      } else {
        elements.push(
          <p key={index} className="text-slate-700 leading-relaxed text-base mb-3.5">
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      }
    });

    return elements;
  };

  const renderInlineMarkdown = (text: string) => {
    // Basic bold **text** and code `code` support
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top action & navigation bar */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Font size toggle for reading comfort */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs text-slate-600">
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded-md transition-all ${
                fontSize === 'normal' ? 'bg-white font-bold text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Cỡ chữ chuẩn"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded-md transition-all ${
                fontSize === 'large' ? 'bg-white font-bold text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Cỡ chữ vừa"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-1 rounded-md transition-all ${
                fontSize === 'xlarge' ? 'bg-white font-bold text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Cỡ chữ lớn"
            >
              A++
            </button>
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-1.5 rounded-lg border transition-colors ${
              bookmarked
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
            title="Lưu bài viết"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Copy link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Chia sẻ'}</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors hidden sm:block"
            title="In bài viết"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Content (8 cols) + Sticky Table of Contents (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Article Body */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs">
          {/* Category badge and read time */}
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
            <span className="font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {article.category_name}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.reading_time} phút đọc
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.views.toLocaleString()} lượt tra cứu
            </span>
          </div>

          {/* Article Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            {article.title}
          </h1>

          {/* Summary Box */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border-l-4 border-indigo-600 text-slate-700 text-sm sm:text-base leading-relaxed mb-8 italic">
            {article.summary}
          </div>

          {/* Author Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-100 mb-8">
            <div className="w-11 h-11 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {article.author.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{article.author}</div>
              <div className="text-xs text-slate-500">{article.author_title || 'Chuyên gia nghiên cứu'}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Xuất bản: {new Date(article.published_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Rendered Document Content */}
          <div className={`prose prose-slate max-w-none ${
            fontSize === 'normal' ? 'text-base leading-relaxed' : fontSize === 'large' ? 'text-lg leading-relaxed' : 'text-xl leading-relaxed'
          }`}>
            {renderFormattedContent(article.content)}
          </div>

          {/* Tags */}
          {tagList.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Từ khóa:</span>
              {tagList.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Table of Contents & Related Articles */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          
          {/* Table of Contents (Mục lục bài viết) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3 pb-3 border-b border-slate-100">
              <ListTree className="w-4 h-4 text-indigo-600" />
              <span>MỤC LỤC BÀI VIẾT</span>
            </div>

            {sections.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Bài viết chưa có phân mục con.</p>
            ) : (
              <nav className="space-y-1 text-xs">
                {sections.map((sec) => {
                  const isActive = activeAnchor === sec.section_anchor;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleScrollToAnchor(sec.section_anchor)}
                      className={`w-full text-left py-1.5 px-2 rounded-lg transition-all flex items-start gap-2 leading-relaxed ${
                        sec.section_level === 2 ? 'pl-4 text-slate-500' : 'font-medium'
                      } ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <ChevronRight className={`w-3 h-3 shrink-0 mt-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-300'}`} />
                      <span className="line-clamp-2">{sec.section_title}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                Tài liệu cùng chuyên mục
              </h3>
              <div className="space-y-3">
                {relatedArticles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="group cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <h4 className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {rel.reading_time} phút đọc • {rel.views} lượt xem
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
