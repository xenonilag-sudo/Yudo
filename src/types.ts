export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  article_count?: number;
}

export interface ArticleSection {
  id: number;
  article_id: number;
  section_anchor: string;
  section_title: string;
  section_level: number;
  sort_order: number;
}

export interface Article {
  id: number;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  author_title?: string;
  reading_time: number;
  tags: string;
  views: number;
  is_featured: number;
  published_at: string;
  updated_at: string;
  sections?: ArticleSection[];
}

export interface SearchFilter {
  keyword: string;
  categoryId?: number | null;
  tag?: string | null;
  sortBy: 'relevance' | 'newest' | 'views' | 'title';
}

export interface SqlQueryResult {
  columns: string[];
  values: (string | number | null)[][];
  rowCount: number;
  durationMs: number;
  error?: string;
}

export interface DatabaseFileInfo {
  fileName: string;
  fileSize: number;
  fileType: 'sql' | 'sqlite_binary';
  loadedAt: string;
  isCustom: boolean;
}

export interface DatabaseStats {
  totalArticles: number;
  totalCategories: number;
  totalSections: number;
  totalQueriesRun: number;
  databaseSizeBytes: number;
  lastQueryTimeMs: number;
  isConnected: boolean;
  fileInfo?: DatabaseFileInfo;
}

export interface QueryLog {
  id: number;
  query_text: string;
  executed_at: string;
  result_count: number;
  duration_ms: number;
}
