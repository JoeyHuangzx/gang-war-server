// server.js
const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// 默认数据结构
const defaultData = {
  id: 0,
  name: '游客',
  gold: 100, //金币数量
  currentLevel: 1, //默认初始关卡
  createDate: Date.now(), //记录创建时间
  buyTimes: 0, //购买次数
  buyCellTimes: 0, //购买格子的次数
  unlockFighters: [101],
  onlineReward: 0,
  finishGuides: [],
  hasUsedFireBall: false,
  formation: [
    {
      id: 1,
      fighterId: 101,
    },
    {
      id: 2,
      fighterId: 101,
    },
    {
      id: 3,
      fighterId: 101,
    },
  ],
};

// 设置数据存储文件和数据库类型
// 初始化数据库
const db = new Low(new JSONFile('db.json'), {
  users: [],
});

app.use(cors());
app.use(express.json());

// 加载数据库
(async () => {
  await db.read();
  if (db.data.users.length === 0) {
    db.data.users.push(defaultData);
  }
  await db.write();
})();

// 统一响应格式函数
function sendResponse(res, data, statusCode = 200, message = 'success') {
  const serverTime = Date.now(); // 获取当前服务器时间戳（毫秒）
  res.status(statusCode).json({ data, serverTime, statusCode, message: message });
}

// 获取所有用户数据
app.get('/users', (req, res) => {
  sendResponse(res, db.data?.users || []);
});

// 获取单个用户数据
app.get('/login', (req, res) => {
  const { name } = req.query;
  console.log(`登录数据 user with name: ${name}`);

  if (!name) {
    return sendResponse(res, { error: 'Name is required' }, 400);
  }
  const user = db.data?.users.find(u => u.name === name);

  if (user) {
    sendResponse(res, user);
  } else {
    sendResponse(res, null, 201, 'User not found');
  }
});

// 生成唯一 ID，确保不会与数据库已有的 ID 重复
function generateUniqueId() {
  let newId;
  do {
    newId = uuidv4();
  } while (db.data.users.some(user => user.id === newId)); // 检查是否已存在
  return newId;
}

// 创建新用户
// 客户端只传入name，id随机生成，其他字段使用默认值，
app.post('/users', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return sendResponse(res, { error: 'Name is required' }, 400);
  }

  const newUser = {
    id: generateUniqueId(), // 生成不重复的 ID
    name,
    gold: 1000,
    currentLevel: 1,
    createDate: Date.now(),
    buyTimes: 0,
    buyCellTimes: 0,
    unlockFighters: [101],
    onlineReward: 0,
    finishGuides: [],
    hasUsedFireBall: false,
    formation: [
      {
        id: 1,
        fighterId: 101,
      },
      {
        id: 2,
        fighterId: 101,
      },
      {
        id: 3,
        fighterId: 101,
      },
    ],
  };
  db.data?.users.push(newUser);
  db.write()
    .then(() => {
      sendResponse(res, newUser, 200);
      console.log(`Created user with ID: ${newUser.id}`);
    })
    .catch(error => sendResponse(res, null, 500, 'Error creating user: ' + error));
});

// 更新用户数据
app.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  console.log(`更新数据 user with ID: ${userId}`);
  const updatedData = req.body;
  const userIndex = db.data?.users.findIndex(u => u.id === userId);

  if (userIndex !== undefined && userIndex >= 0) {
    db.data.users[userIndex] = { ...db.data.users[userIndex], ...updatedData };
    db.write()
      .then(() => sendResponse(res, db.data.users[userIndex]))
      .catch(error => sendResponse(res, null, 500, 'Error updating user: ' + error));
  } else {
    sendResponse(res, { error: 'User not found' }, 404);
  }
});

// 删除用户
app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  const userIndex = db.data?.users.findIndex(u => u.id === userId);

  if (userIndex !== undefined && userIndex >= 0) {
    db.data.users.splice(userIndex, 1);
    db.write()
      .then(() => sendResponse(res, null, 200))
      .catch(error => sendResponse(res, null, 500, 'Error deleting user: ' + error));
  } else {
    sendResponse(res, null, 201, 'User not found');
  }
});

// 重置用户数据
app.put('/users/:id/reset', (req, res) => {
  const userId = req.params.id;
  console.log(`重置用户数据 user with ID: ${userId}`);
  const userIndex = db.data?.users.findIndex(u => u.id === userId);

  if (userIndex !== undefined && userIndex >= 0) {
    db.data.users[userIndex] = { ...defaultData, id: db.data.users[userIndex].id, name: db.data.users[userIndex].name };
    db.write()
      .then(() => sendResponse(res, db.data.users[userIndex]))
      .catch(error => sendResponse(res, null, 500, 'Error resetting user: ' + error));
  } else {
    sendResponse(res, { error: 'User not found' }, 404);
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
