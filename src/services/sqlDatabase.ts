import initSqlJs, { Database, QueryExecResult, SqlJsStatic } from 'sql.js';
import { Article, ArticleSection, Category, DatabaseFileInfo, DatabaseStats, QueryLog, SearchFilter, SqlQueryResult } from '../types';

let dbInstance: Database | null = null;
let sqlModule: SqlJsStatic | null = null;
let initPromise: Promise<Database> | null = null;
let rawSqlContent: string = '';

let currentFileInfo: DatabaseFileInfo = {
  fileName: 'database.sql (Mặc định)',
  fileSize: 0,
  fileType: 'sql',
  loadedAt: new Date().toLocaleTimeString('vi-VN'),
  isCustom: false,
};

async function getSqlModule(): Promise<SqlJsStatic> {
  if (sqlModule) return sqlModule;

  try {
    // Attempt to fetch wasm binary directly as ArrayBuffer
    // This avoids streaming compilation MIME-type issues in different hosting environments
    const wasmRes = await fetch('/sql-wasm-browser.wasm');
    if (wasmRes.ok) {
      const buffer = await wasmRes.arrayBuffer();
      // Ensure the magic header is \0asm (0x00, 0x61, 0x73, 0x6d)
      const bytes = new Uint8Array(buffer, 0, 4);
      if (bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d) {
        sqlModule = await initSqlJs({
          wasmBinary: buffer,
        });
        return sqlModule;
      }
    }
  } catch (err) {
    console.warn('Direct wasm binary fetch failed, falling back to locateFile:', err);
  }

  // Fallback to locateFile method
  sqlModule = await initSqlJs({
    locateFile: (file) => `/${file}`,
  });
  return sqlModule;
}

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const SQL = await getSqlModule();

      // Fetch the raw database.sql file
      const response = await fetch('/database.sql');
      if (!response.ok) {
        throw new Error(`Failed to load /database.sql: ${response.statusText}`);
      }
      rawSqlContent = await response.text();

      currentFileInfo = {
        fileName: 'database.sql (Mặc định)',
        fileSize: new Blob([rawSqlContent]).size,
        fileType: 'sql',
        loadedAt: new Date().toLocaleTimeString('vi-VN'),
        isCustom: false,
      };

      const db = new SQL.Database();
      db.run(rawSqlContent);
      dbInstance = db;
      return db;
    } catch (err) {
      console.error('Error initializing SQL Database:', err);
      throw err;
    }
  })();

  return initPromise;
}

export function getDatabaseFileInfo(): DatabaseFileInfo {
  return currentFileInfo;
}

export function getRawSqlFile(): string {
  return rawSqlContent;
}

export async function loadDatabaseFromSqlText(sqlText: string, fileName = 'custom_database.sql'): Promise<void> {
  const SQL = await getSqlModule();

  const db = new SQL.Database();
  db.run(sqlText);

  // Validate that tables exist
  const check = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='articles'");
  if (!check || check.length === 0) {
    throw new Error('Tệp SQL không chứa bảng `articles`. Vui lòng kiểm tra lại cấu trúc lược đồ.');
  }

  dbInstance = db;
  rawSqlContent = sqlText;
  currentFileInfo = {
    fileName,
    fileSize: new Blob([sqlText]).size,
    fileType: 'sql',
    loadedAt: new Date().toLocaleTimeString('vi-VN'),
    isCustom: true,
  };
}

export async function loadDatabaseFromBinary(buffer: Uint8Array, fileName = 'custom_database.db'): Promise<void> {
  const SQL = await getSqlModule();

  const db = new SQL.Database(buffer);

  // Validate that tables exist
  const check = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='articles'");
  if (!check || check.length === 0) {
    throw new Error('Tệp cơ sở dữ liệu SQLite không chứa bảng `articles`. Vui lòng kiểm tra lại.');
  }

  dbInstance = db;
  rawSqlContent = `-- Cơ sở dữ liệu nạp từ tệp nhị phân SQLite: ${fileName}\n-- Dung lượng: ${buffer.byteLength} bytes\n`;
  currentFileInfo = {
    fileName,
    fileSize: buffer.byteLength,
    fileType: 'sqlite_binary',
    loadedAt: new Date().toLocaleTimeString('vi-VN'),
    isCustom: true,
  };
}

export async function resetToDefaultDatabase(): Promise<void> {
  dbInstance = null;
  initPromise = null;
  await getDatabase();
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const db = await getDatabase();
  const startTime = performance.now();

  const articleCountRes = db.exec('SELECT COUNT(*) FROM articles');
  const catCountRes = db.exec('SELECT COUNT(*) FROM categories');
  const secCountRes = db.exec('SELECT COUNT(*) FROM article_sections');
  const queryCountRes = db.exec('SELECT COUNT(*) FROM queries_log');

  const totalArticles = (articleCountRes[0]?.values[0]?.[0] as number) || 0;
  const totalCategories = (catCountRes[0]?.values[0]?.[0] as number) || 0;
  const totalSections = (secCountRes[0]?.values[0]?.[0] as number) || 0;
  const totalQueriesRun = (queryCountRes[0]?.values[0]?.[0] as number) || 0;

  // Export binary array to calculate database size
  const binaryArray = db.export();
  const databaseSizeBytes = binaryArray.byteLength;
  const duration = performance.now() - startTime;

  return {
    totalArticles,
    totalCategories,
    totalSections,
    totalQueriesRun,
    databaseSizeBytes,
    lastQueryTimeMs: parseFloat(duration.toFixed(2)),
    isConnected: true,
    fileInfo: currentFileInfo,
  };
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const sql = `
    SELECT c.id, c.slug, c.name, c.description, c.icon, c.sort_order, COUNT(a.id) as article_count
    FROM categories c
    LEFT JOIN articles a ON c.id = a.category_id
    GROUP BY c.id
    ORDER BY c.sort_order ASC;
  `;
  const result = db.exec(sql);
  if (!result || result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as unknown as Category;
  });
}

export async function searchArticlesRealtime(
  filter: SearchFilter
): Promise<{ articles: Article[]; durationMs: number; sqlUsed: string }> {
  const db = await getDatabase();
  const startTime = performance.now();

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter.categoryId) {
    conditions.push('a.category_id = ?');
    params.push(filter.categoryId);
  }

  if (filter.tag) {
    conditions.push('a.tags LIKE ?');
    params.push(`%${filter.tag}%`);
  }

  if (filter.keyword && filter.keyword.trim() !== '') {
    const kw = `%${filter.keyword.trim()}%`;
    conditions.push('(a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ? OR a.tags LIKE ? OR a.author LIKE ?)');
    params.push(kw, kw, kw, kw, kw);
  }

  let orderBy = 'a.published_at DESC';
  if (filter.sortBy === 'views') {
    orderBy = 'a.views DESC';
  } else if (filter.sortBy === 'title') {
    orderBy = 'a.title ASC';
  } else if (filter.sortBy === 'relevance' && filter.keyword) {
    orderBy = `CASE 
      WHEN a.title LIKE '${filter.keyword.replace(/'/g, "''")}%' THEN 1
      WHEN a.title LIKE '%${filter.keyword.replace(/'/g, "''")}%' THEN 2
      ELSE 3 END, a.views DESC`;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT 
      a.id, a.category_id, a.slug, a.title, a.summary, a.content,
      a.author, a.author_title, a.reading_time, a.tags, a.views, a.is_featured,
      a.published_at, a.updated_at,
      c.name as category_name, c.slug as category_slug
    FROM articles a
    JOIN categories c ON a.category_id = c.id
    ${whereClause}
    ORDER BY ${orderBy};
  `;

  const stmt = db.prepare(sql);
  stmt.bind(params);

  const articles: Article[] = [];
  while (stmt.step()) {
    articles.push(stmt.getAsObject() as unknown as Article);
  }
  stmt.free();

  const durationMs = parseFloat((performance.now() - startTime).toFixed(2));

  // Log query in SQL database
  try {
    const logSql = 'INSERT INTO queries_log (query_text, executed_at, result_count, duration_ms) VALUES (?, datetime("now"), ?, ?)';
    const logStmt = db.prepare(logSql);
    logStmt.run([`SEARCH [${filter.keyword || '*'}] (${conditions.length} filters)`, articles.length, durationMs]);
    logStmt.free();
  } catch (e) {
    console.warn('Logging query failed:', e);
  }

  return { articles, durationMs, sqlUsed: sql.trim() };
}

export async function getArticleBySlugOrId(identifier: string | number): Promise<Article | null> {
  const db = await getDatabase();
  const isNumeric = typeof identifier === 'number' || /^\d+$/.test(String(identifier));

  const sql = `
    SELECT 
      a.id, a.category_id, a.slug, a.title, a.summary, a.content,
      a.author, a.author_title, a.reading_time, a.tags, a.views, a.is_featured,
      a.published_at, a.updated_at,
      c.name as category_name, c.slug as category_slug
    FROM articles a
    JOIN categories c ON a.category_id = c.id
    WHERE ${isNumeric ? 'a.id = ?' : 'a.slug = ?'}
    LIMIT 1;
  `;

  const stmt = db.prepare(sql);
  stmt.bind([identifier]);

  let article: Article | null = null;
  if (stmt.step()) {
    article = stmt.getAsObject() as unknown as Article;
  }
  stmt.free();

  if (!article) return null;

  // Increment view counter
  try {
    const updateStmt = db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?');
    updateStmt.run([article.id]);
    updateStmt.free();
    article.views += 1;
  } catch (e) {
    console.warn('Failed to update views:', e);
  }

  // Load article sections
  const sectionsSql = `
    SELECT id, article_id, section_anchor, section_title, section_level, sort_order
    FROM article_sections
    WHERE article_id = ?
    ORDER BY sort_order ASC;
  `;
  const secStmt = db.prepare(sectionsSql);
  secStmt.bind([article.id]);
  const sections: ArticleSection[] = [];
  while (secStmt.step()) {
    sections.push(secStmt.getAsObject() as unknown as ArticleSection);
  }
  secStmt.free();
  article.sections = sections;

  return article;
}

export async function getAllTags(): Promise<string[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT tags FROM articles');
  if (!res || res.length === 0) return [];

  const tagSet = new Set<string>();
  res[0].values.forEach((row) => {
    const tagStr = row[0] as string;
    if (tagStr) {
      tagStr.split(',').forEach((t) => {
        const clean = t.trim();
        if (clean) tagSet.add(clean);
      });
    }
  });

  return Array.from(tagSet);
}

export async function executeRawSQL(sqlQuery: string): Promise<SqlQueryResult> {
  const db = await getDatabase();
  const startTime = performance.now();

  try {
    const results: QueryExecResult[] = db.exec(sqlQuery);
    const durationMs = parseFloat((performance.now() - startTime).toFixed(2));

    if (!results || results.length === 0) {
      return {
        columns: [],
        values: [],
        rowCount: 0,
        durationMs,
      };
    }

    const first = results[0];
    const safeValues: (string | number | null)[][] = first.values.map((row) =>
      row.map((val) => {
        if (val === null) return null;
        if (typeof val === 'number' || typeof val === 'string') return val;
        if (val instanceof Uint8Array) return `[BLOB ${val.byteLength} bytes]`;
        return String(val);
      })
    );

    return {
      columns: first.columns,
      values: safeValues,
      rowCount: safeValues.length,
      durationMs,
    };
  } catch (err: unknown) {
    const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      columns: [],
      values: [],
      rowCount: 0,
      durationMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getRecentQueryLogs(limit = 10): Promise<QueryLog[]> {
  const db = await getDatabase();
  const sql = `SELECT id, query_text, executed_at, result_count, duration_ms FROM queries_log ORDER BY id DESC LIMIT ?`;
  const stmt = db.prepare(sql);
  stmt.bind([limit]);

  const logs: QueryLog[] = [];
  while (stmt.step()) {
    logs.push(stmt.getAsObject() as unknown as QueryLog);
  }
  stmt.free();
  return logs;
}

export function exportCurrentDatabaseSql(): string {
  if (!dbInstance) return '';
  try {
    const tablesRes = dbInstance.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    if (!tablesRes || tablesRes.length === 0) return '';

    let dump = `-- EXPORTED SQL DATABASE DUMP\n-- Date: ${new Date().toISOString()}\n\n`;

    for (const row of tablesRes[0].values) {
      const tableName = row[0] as string;
      const schemaRes = dbInstance.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
      if (schemaRes && schemaRes[0]?.values[0]?.[0]) {
        dump += `DROP TABLE IF EXISTS ${tableName};\n`;
        dump += `${schemaRes[0].values[0][0]};\n\n`;

        const dataRes = dbInstance.exec(`SELECT * FROM ${tableName}`);
        if (dataRes && dataRes.length > 0) {
          const cols = dataRes[0].columns;
          for (const valRow of dataRes[0].values) {
            const escapedVals = valRow.map((v) => {
              if (v === null) return 'NULL';
              if (typeof v === 'number') return v;
              return `'${String(v).replace(/'/g, "''")}'`;
            });
            dump += `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${escapedVals.join(', ')});\n`;
          }
          dump += '\n';
        }
      }
    }
    return dump;
  } catch (err) {
    console.error('Error dumping SQL:', err);
    return rawSqlContent;
  }
}

export function getSampleInsertSql(): string {
  return `-- ==========================================================
-- MẪU CÂU LỆNH SQL ĐỂ THÊM THÔNG TIN MỚI VÀO TỆP DATABASE.SQL
-- Bạn chỉ cần copy cấu trúc bên dưới, điền thông tin bài viết của bạn
-- và dán vào tệp database.sql hoặc nạp tệp này lên website.
-- ==========================================================

-- 1. (Tùy chọn) Thêm Chuyên mục mới nếu cần:
-- INSERT INTO categories (id, slug, name, description, icon, sort_order)
-- VALUES (6, 'y-te-so', 'Y Tế & Chăm Sóc Sức Khỏe Số', 'Ứng dụng AI và CSDL trong y khoa', 'HeartPulse', 6);

-- 2. Thêm bài viết mới vào bảng 'articles':
INSERT INTO articles (
  category_id,
  slug,
  title,
  summary,
  content,
  author,
  author_title,
  reading_time,
  tags,
  views,
  is_featured,
  published_at,
  updated_at
) VALUES (
  1, -- category_id: 1=AI, 2=Pháp lý, 3=Quản trị, 4=Bán dẫn, 5=Fintech
  'huong-dan-bo-sung-thong-tin-qua-file-db',
  'Hướng Dẫn Bổ Sung Dữ Liệu Vào Cổng Tra Cứu Qua Tệp Cơ Sở Dữ Liệu SQL',
  'Tài liệu chi tiết giải thích quy trình thêm bài viết và tài liệu vào hệ thống bằng tệp cơ sở dữ liệu database.sql mà không cần form nhập liệu.',
  '# 1. Nguyên Tắc Hoạt Động Của Hệ Thống

Website hoạt động hoàn toàn ở chế độ **Chỉ đọc (Read-Only)** để đảm bảo tính toàn vẹn và chuẩn hóa dữ liệu. Mọi thông tin, mục lục phân cấp và bài viết đều được đồng bộ trực tiếp từ tệp cơ sở dữ liệu SQLite/SQL.

# 2. Quy Trình Bổ Sung Bài Viết

Để thêm bài viết mới, bạn có thể thực hiện theo các bước sau:
- Bước 1: Mở tệp \`public/database.sql\` bằng bất kỳ trình soạn thảo mã nào (VS Code, Notepad++, Sublime Text).
- Bước 2: Thêm câu lệnh INSERT INTO articles với đầy đủ các trường thông tin.
- Bước 3: Thêm các mục lục cấp 1, cấp 2 tương ứng vào bảng \`article_sections\`.
- Bước 4: Lưu tệp và làm mới trang web hoặc sử dụng tính năng "Nạp tệp Database" trên thanh điều hướng.

# 3. Phân Cấp Mục Lục Tự Động

Các tiêu đề bắt đầu bằng ký tự # hoặc ## trong nội dung Markdown sẽ được hệ thống tự động bóc tách thành mục lục phân cấp, giúp người đọc dễ dàng theo dõi và điều hướng.',
  'Ban Biên Tập Tri Thức',
  'Hệ Thống Cơ Sở Dữ Liệu',
  4,
  'Database, SQL, Read-Only, Documentation',
  120,
  0,
  '2026-09-17 08:00:00',
  '2026-09-17 08:00:00'
);

-- 3. Thêm các đề mục phân cấp tương ứng vào bảng 'article_sections'
-- (Giúp hiển thị Mục lục bài viết và cuộn nhanh):
INSERT INTO article_sections (article_id, section_anchor, section_title, section_level, sort_order)
VALUES 
  (last_insert_rowid(), '1-nguyen-tac-hoat-dong-cua-he-thong', '1. Nguyên Tắc Hoạt Động Của Hệ Thống', 1, 1),
  (last_insert_rowid(), '2-quy-trinh-bo-sung-bai-viet', '2. Quy Trình Bổ Sung Bài Viết', 1, 2),
  (last_insert_rowid(), '3-phan-cap-muc-luc-tu-dong', '3. Phân Cấp Mục Lục Tự Động', 1, 3);
`;
}
