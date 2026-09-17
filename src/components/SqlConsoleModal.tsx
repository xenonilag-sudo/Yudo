import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  Download,
  FileCode,
  Table as TableIcon,
  Clock,
  AlertCircle,
  Database,
  Copy,
  Check,
} from 'lucide-react';
import { executeRawSQL, exportCurrentDatabaseSql, getRawSqlFile } from '../services/sqlDatabase';
import { SqlQueryResult } from '../types';

interface SqlConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

const PRESET_QUERIES = [
  {
    name: 'Top bài viết có lượt tra cứu cao nhất',
    sql: 'SELECT id, title, views, author, reading_time FROM articles ORDER BY views DESC LIMIT 5;',
  },
  {
    name: 'Thống kê số lượng bài viết theo từng danh mục',
    sql: 'SELECT c.id, c.name, COUNT(a.id) AS total_articles FROM categories c LEFT JOIN articles a ON c.id = a.category_id GROUP BY c.id ORDER BY total_articles DESC;',
  },
  {
    name: 'Danh sách mục lục chi tiết của bài viết số 1',
    sql: 'SELECT id, section_title, section_anchor, section_level, sort_order FROM article_sections WHERE article_id = 1 ORDER BY sort_order ASC;',
  },
  {
    name: 'Các bài viết thuộc lĩnh vực Bán dẫn hoặc AI',
    sql: "SELECT id, title, tags, views, published_at FROM articles WHERE tags LIKE '%Bán dẫn%' OR tags LIKE '%AI%';",
  },
  {
    name: 'Nhật ký 10 truy vấn gần nhất trong hệ thống',
    sql: 'SELECT id, query_text, executed_at, result_count, duration_ms FROM queries_log ORDER BY id DESC LIMIT 10;',
  },
];

export const SqlConsoleModal: React.FC<SqlConsoleModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'file' | 'schema'>('console');
  const [query, setQuery] = useState(PRESET_QUERIES[0].sql);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [rawSql, setRawSql] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRawSql(getRawSqlFile());
      handleRunQuery(query);
    }
  }, [isOpen]);

  const handleRunQuery = async (sqlToRun?: string) => {
    const targetSql = sqlToRun || query;
    if (!targetSql.trim()) return;

    setIsExecuting(true);
    try {
      const res = await executeRawSQL(targetSql);
      setResult(res);
      // If it was an INSERT / UPDATE / DELETE, refresh portal data
      if (/^(insert|update|delete|drop|create)/i.test(targetSql.trim())) {
        onRefreshData();
      }
    } catch (err: unknown) {
      setResult({
        columns: [],
        values: [],
        rowCount: 0,
        durationMs: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownloadSqlFile = () => {
    const currentSql = exportCurrentDatabaseSql() || rawSql;
    const blob = new Blob([currentSql], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database-${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySqlFile = () => {
    navigator.clipboard.writeText(rawSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">SQL Database Explorer & Query Engine</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  SQLite WASM (database.sql)
                </span>
              </div>
              <p className="text-xs text-slate-400">Trực tiếp thực thi truy vấn SQL và khám phá tệp cơ sở dữ liệu</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSqlFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors"
              title="Tải tệp database.sql về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải tệp .sql</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 text-xs font-medium gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg transition-all ${
              activeTab === 'console'
                ? 'bg-white text-indigo-700 font-bold border-t-2 border-indigo-600 border-x border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Trình thực thi SQL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg transition-all ${
              activeTab === 'file'
                ? 'bg-white text-indigo-700 font-bold border-t-2 border-indigo-600 border-x border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Xem tệp database.sql gốc</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg transition-all ${
              activeTab === 'schema'
                ? 'bg-white text-indigo-700 font-bold border-t-2 border-indigo-600 border-x border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Lược đồ bảng (Schema)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-5 bg-slate-50/50">
          {activeTab === 'console' && (
            <div className="flex flex-col h-full gap-4">
              {/* Preset Queries */}
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1.5">Truy vấn mẫu nhanh:</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_QUERIES.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(item.sql);
                        handleRunQuery(item.sql);
                      }}
                      className="text-xs shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors text-slate-700"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* SQL Query Editor */}
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={3}
                  placeholder="Nhập câu lệnh SQL (SELECT, INSERT, UPDATE, DELETE...)"
                  className="w-full p-3 font-mono text-xs sm:text-sm bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => handleRunQuery()}
                  disabled={isExecuting}
                  className="absolute right-3 bottom-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Đang chạy...' : 'Thực thi SQL'}</span>
                </button>
              </div>

              {/* Result Area */}
              <div className="flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 flex flex-col shadow-2xs">
                {/* Result Status Bar */}
                <div className="p-2.5 px-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-semibold text-slate-800">Kết quả truy vấn:</span>
                    {result && !result.error && (
                      <span className="text-slate-500 font-mono">
                        {result.rowCount} dòng trả về
                      </span>
                    )}
                  </div>
                  {result && (
                    <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>{result.durationMs} ms</span>
                    </div>
                  )}
                </div>

                {/* Table or Error */}
                <div className="flex-1 overflow-auto p-2">
                  {result?.error ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Lỗi thực thi SQL:</strong>
                        <p className="font-mono mt-1">{result.error}</p>
                      </div>
                    </div>
                  ) : result && result.columns.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {result.columns.map((col, idx) => (
                            <th key={idx} className="p-2.5 text-slate-700 font-bold uppercase tracking-wider">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.values.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-indigo-50/40 transition-colors">
                            {row.map((cell, colIdx) => (
                              <td key={colIdx} className="p-2.5 text-slate-600 truncate max-w-[280px]">
                                {cell === null ? (
                                  <span className="text-slate-300 italic">NULL</span>
                                ) : (
                                  String(cell)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Không có kết quả hoặc truy vấn thực hiện thành công với 0 bản ghi trả về.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between pb-2 text-xs text-slate-500">
                <span>Nội dung tệp <code className="font-mono text-indigo-700">/public/database.sql</code> (Lưu trữ toàn bộ văn bản và dữ liệu bảng):</span>
                <button
                  type="button"
                  onClick={handleCopySqlFile}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Đã sao chép' : 'Sao chép toàn bộ'}</span>
                </button>
              </div>
              <pre className="flex-1 p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-auto border border-slate-700 leading-relaxed">
                {rawSql}
              </pre>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="h-full overflow-y-auto space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>Bảng <code>categories</code> (Mục lục chuyên mục)</span>
                </h3>
                <pre className="bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
{`CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);`}
                </pre>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>Bảng <code>articles</code> (Lưu trữ văn bản và dữ liệu bài viết)</span>
                </h3>
                <pre className="bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
{`CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_title TEXT,
  reading_time INTEGER DEFAULT 5,
  tags TEXT,
  views INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`}
                </pre>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>Bảng <code>article_sections</code> (Mục lục chi tiết từng bài viết)</span>
                </h3>
                <pre className="bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
{`CREATE TABLE article_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  section_anchor TEXT NOT NULL,
  section_title TEXT NOT NULL,
  section_level INTEGER DEFAULT 2,
  sort_order INTEGER NOT NULL
);`}
                </pre>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>Bảng <code>queries_log</code> (Lịch sử tra cứu thời gian thực)</span>
                </h3>
                <pre className="bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
{`CREATE TABLE queries_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_text TEXT NOT NULL,
  executed_at TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  duration_ms REAL DEFAULT 0.0
);`}
                </pre>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
