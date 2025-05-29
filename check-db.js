const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'lottery-backend/database.sqlite');
console.log('尝试连接数据库:', dbPath);

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  }
  console.log('成功连接到数据库');
});

// 查询数据库表
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('查询表失败:', err.message);
    closeDb();
    return;
  }
  
  console.log('数据库中的表:', tables.map(t => t.name));
  
  // 检查Awards表是否存在
  const awardsTable = tables.find(t => t.name.toLowerCase() === 'awards');
  if (!awardsTable) {
    console.log('Awards表不存在');
    
    // 如果不存在，检查其他可能名称
    const possibleTables = tables.filter(t => t.name.toLowerCase().includes('award'));
    if (possibleTables.length > 0) {
      console.log('发现可能相关的表:', possibleTables);
      checkTableData(possibleTables[0].name);
    } else {
      closeDb();
    }
  } else {
    // 查询Awards表数据
    checkTableData(awardsTable.name);
  }
});

// 查询指定表的数据
function checkTableData(tableName) {
  console.log(`查询${tableName}表的数据...`);
  
  // 先查询表结构
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.error(`查询${tableName}表结构失败:`, err.message);
      closeDb();
      return;
    }
    
    console.log(`${tableName}表的列:`, columns.map(c => `${c.name}(${c.type})`));
    
    // 再查询数据
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) {
        console.error(`查询${tableName}数据失败:`, err.message);
        closeDb();
        return;
      }
      
      console.log(`${tableName}表中的数据(${rows.length}条):`);
      if (rows.length > 0) {
        console.log(JSON.stringify(rows, null, 2));
      } else {
        console.log('表中没有数据');
      }
      
      closeDb();
    });
  });
}

// 关闭数据库连接
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库失败:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
  });
} 