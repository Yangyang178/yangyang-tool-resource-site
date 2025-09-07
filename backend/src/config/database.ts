import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// SQLite 数据库路径
const dbPath = path.join(__dirname, '../../database.sqlite');

// 数据库连接
let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

// 查询缓存
const queryCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

// 初始化数据库连接
const initDB = async () => {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // 性能优化设置
    await db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA cache_size = 10000;
      PRAGMA temp_store = MEMORY;
      PRAGMA mmap_size = 268435456;
    `);
    
    console.log('✅ SQLite 数据库连接成功，性能优化已启用');
  }
  return db;
};

// 测试数据库连接
export const testConnection = async () => {
  try {
    await initDB();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
};

// 生成缓存键
const getCacheKey = (sql: string, params?: any[]) => {
  return `${sql}:${JSON.stringify(params || [])}`;
};

// 清理过期缓存
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      queryCache.delete(key);
    }
  }
};

// 执行查询（带缓存）
export const query = async (sql: string, params?: any[]) => {
  try {
    const database = await initDB();
    
    // 对于SELECT查询，检查缓存
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const cacheKey = getCacheKey(sql, params);
      const cached = queryCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      
      const result = await database.all(sql, params);
      
      // 缓存结果
      queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      // 定期清理过期缓存
      if (queryCache.size > 100) {
        cleanExpiredCache();
      }
      
      return result;
    } else {
      // 非SELECT查询，清除相关缓存
      const tableName = extractTableName(sql);
      if (tableName) {
        clearCacheByTable(tableName);
      }
      
      return await database.run(sql, params);
    }
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
};

// 提取表名
const extractTableName = (sql: string): string | null => {
  const match = sql.match(/(?:FROM|INTO|UPDATE)\s+([\w_]+)/i);
  return match ? match[1] : null;
};

// 根据表名清除缓存
const clearCacheByTable = (tableName: string) => {
  for (const [key] of queryCache.entries()) {
    if (key.includes(tableName)) {
      queryCache.delete(key);
    }
  }
};

// 清除所有缓存
export const clearCache = () => {
  queryCache.clear();
};

// 执行事务
export const transaction = async (callback: (db: Database<sqlite3.Database, sqlite3.Statement>) => Promise<any>) => {
  const database = await initDB();
  try {
    await database.exec('BEGIN TRANSACTION');
    const result = await callback(database);
    await database.exec('COMMIT');
    return result;
  } catch (error) {
    await database.exec('ROLLBACK');
    throw error;
  }
};

export default { initDB, query, testConnection, transaction };