//server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { json } = require("express");

// 创建Express应用和HTTP服务器
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); // WebSocket服务器

// 确保data目录存在,避免node.js读写权限问题
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

// 初始化数据库（SQLite）
const db = new sqlite3.Database('./data/equipment.db');
db.serialize(() => {
  // 1. 仅当表不存在时创建
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY,
      name TEXT,
      lat REAL,
      lng REAL,
      status TEXT,
      detail TEXT
    )
  `);
  // 2. 检查表中是否有数据
  db.get('SELECT COUNT(*) AS count FROM equipment', (err, row) => {
    if (err) throw err;
    if (row.count === 0) {
      // 插入初始测试数据
      db.run(
        'INSERT INTO equipment (name, lat, lng, status, detail) VALUES (?, ?, ?, ?, ?)',
        ['消防车A', 39.9042, 116.4574, '空闲', '14T主战']
      );
      db.run(
        'INSERT INTO equipment (name, lat, lng, status, detail) VALUES (?, ?, ?, ?, ?)',
        ['消防车B', 39.9142, 116.4174, '使用中', '60M云梯']
      );
      db.run(
        'INSERT INTO equipment (name, lat, lng, status, detail) VALUES (?, ?, ?, ?, ?)',
        ['消防车C', 39.9231, 116.4245, '使用中', '30M云梯']
      );
      db.run(
        'INSERT INTO equipment (name, lat, lng, status, detail) VALUES (?, ?, ?, ?, ?)',
        ['消防车D', 39.9245, 116.4765, '使用中', '抢险救援车']
      );
      db.run(
        'INSERT INTO equipment (name, lat, lng, status, detail) VALUES (?, ?, ?, ?, ?)',
        ['消防车E', 39.9265, 116.4905, '使用中', '抢险救援车']
      );
      db.run(
        'INSERT INTO equipment (name, lat, lng, status, detail) VALUES (?, ?, ?, ?, ?)',
        ['消防车F', 39.9495, 116.4205, '使用中', '抢险救援车']
      );
      db.run(
        'INSERT INTO equipment (name, lat, lng, status, detail) VALUES (?, ?, ?, ?, ?)',
        ['消防车G', 39.9995, 116.4665, '使用中', '抢险救援车']
      );
      console.log('初始数据插入完成');
    }
  });
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 模拟实时状态更新（每隔5秒更新一次）
setInterval(() => {
  const newID = getRandomInt(1, 7);
  db.get('SELECT * FROM equipment WHERE id = ?', [newID], (err, oldRow) => {
    if (err) {
      console.error('查询旧值失败', err);
      return;
    }
    db.get('SELECT status FROM equipment WHERE id = ?', [newID], (err, row) => {
      if (err) {
        console.error('查询状态失败', err);
        return;
      }
      if (row) {
        const newStatus = () => {
          const statusID = getRandomInt(1, 7);
          switch (statusID) {
            case 1:
              return '空闲';
            case 2:
              return '使用中';
            case 3:
              return '损坏';
            case 4:
              return '库存';
            case 5:
              return '移动中';
            case 6:
              return '维护中';
            default:
              return '失去联系';
          }
        };
        db.run('UPDATE equipment SET status = ? WHERE id = ?',
          [newStatus(), newID],
          (err) => {
            if (err) {
              console.error('更新装备状态失败', err);
              return;
            }
            // 查询装备名称
            db.get('SELECT name FROM equipment WHERE id = ?', [newID], (err, row) => {
              if (err) {
                console.error('查询装备名称失败', err);
                return;
              }
              if (row) {
                const updateEQPname = row.name;
                // 广播状态更新
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ id: newID, status: newStatus(), mode: 'random', name: updateEQPname }));
                  }
                })
                console.log('装备ID：', newID, '状态：', newStatus(), '名称：', updateEQPname);
              } else {
                console.log(`未找到 ID 为 ${newID} 的装备`);
              }
            });
          }
        );
      }
    })
  })
}, 5000);

app.use(express.json()); // 解析application/json
app.use(express.urlencoded({ extended: true })); // 解析表单数据
app.use('/api', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// 定义REST API：获取所有装备
app.get('/api/inventory', (req, res) => {
  db.all('SELECT * FROM equipment', (err, rows) => {
    if (err) {
      res.status(500).json({ error: '数据库查询失败' });
    } else {
      res.json(rows);
    }
  });
});
// 定义REST API：添加装备
app.post('/api/inventory', (req, res) => {
  const { name, lat, lng, status, detail } = req.body;
  console.log("收到post请求" + JSON.stringify(req.body));
  db.run(
    'INSERT INTO equipment (name, lat, lng, status, detail) VALUES (?, ?, ?, ?, ?)',
    [name, lat, lng, status, detail],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.json({ id: this.lastID });
    }
  );
});

// 定义REST API：获取单个装备
app.get('/api/inventory/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM equipment WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: '数据库查询失败' });
    } else if (!row) {
      res.status(404).json({ error: '设备不存在' });
    } else {
      res.json(row);
    }
  });
});

// 定义REST API：删除装备
app.delete('/api/inventory/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM equipment WHERE id=?', [id], function (err) {
    if (err) return res.status(500).send(err.message);
    res.json({ deleted: this.lastID });
  });
});

// 定义REST API：更新装备
app.put('/api/inventory/:id', (req, res) => {
  console.log('收到PUT请求：', req.body);
  const id = req.params.id;
  const { name, lat, lng, status, detail, method } = req.body;
  switch (method) {
    case 'drag':
      db.run(
        'UPDATE equipment SET lat=?, lng=? WHERE id=?',
        [lat, lng, id],
        function (err) {
          if (err) return res.status(500).send(err.message);
          res.json({ updated: this.lastID });
        }
      );
      break;
    case 'edit':
      db.run(
        'UPDATE equipment SET name=?, lat=?, lng=?, status=?, detail=?WHERE id=?',
        [name, lat, lng, status, detail, id],
        function (err) {
          if (err) return res.status(500).send(err.message);
          res.json({ updated: this.lastID });
        }
      );
      break;
  }
});

// WebSocket连接处理
wss.on('connection', () => {
  console.log('客户端已连接');
});
wss.on('close', () => {
  console.log('客户端已断开连接');
});
wss.on('error', (error) => {
  console.error('WebSocket 服务器发生错误:', error);
});

// 启动服务器
server.listen(1000, () => {
  console.log('后端服务已启动：http://localhost:1000');
}).on('error', (error) => {
  console.error('服务器启动时发生错误:', error);
});