// server.js
const express = require("express");
const cors = require("cors");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const app = express();
const port = 3000;

// 默认数据结构
const defaultData = {
  id: 0,
  name: "游客",
  gold: 100, //金币数量
  level: 1, //默认初始关卡
  createDate: Date.now(), //记录创建时间
  buyTimes: 0, //购买次数
  buyCellTimes: 0, //购买格子的次数
  unlock: [''], //已解锁士兵
  onlineReward: 0, //在线奖励的数值
  finishGuides: [], //完成的引导步骤
  hasUsedFireBall: false, //是否使用过火球技能
};

// 设置数据存储文件和数据库类型
// 初始化数据库
const db = new Low(new JSONFile("db.json"), {
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
function sendResponse(res, data, statusCode = 200) {
  const serverTime = Date.now();  // 获取当前服务器时间戳（毫秒）
  res.status(statusCode).json({ data, serverTime, statusCode });
}

// 获取所有用户数据
app.get("/users", (req, res) => {
  sendResponse(res, db.data?.users || []);
});

// 获取单个用户数据
app.get("/users/:id", (req, res) => {
  console.log(`Received request for user with id: ${req.params.id}`);
  const userId = Number(req.params.id);
  const user = db.data?.users.find((u) => u.id === userId);

  if (user) {
    sendResponse(res, user);
  } else {
    sendResponse(res, { error: "User not found" }, 404);
  }
});

// 创建新用户
app.post("/users", (req, res) => {
  const newUser = req.body;
  db.data?.users.push(newUser);
  db.write()
    .then(() => {
      sendResponse(res, newUser, 201);
    })
    .catch((error) =>
      sendResponse(res, { error: "Error saving user: " + error }, 500)
    );
});

// 更新用户数据
app.put("/users/:id", (req, res) => {
  const userId = Number(req.params.id);
  const updatedData = req.body;
  const userIndex = db.data?.users.findIndex((u) => u.id === userId);

  if (userIndex !== undefined && userIndex >= 0) {
    db.data.users[userIndex] = { ...db.data.users[userIndex], ...updatedData };
    db.write()
      .then(() => sendResponse(res, db.data.users[userIndex]))
      .catch((error) =>
        sendResponse(res, { error: "Error updating user: " + error }, 500)
      );
  } else {
    sendResponse(res, { error: "User not found" }, 404);
  }
});

// 删除用户
app.delete("/users/:id", (req, res) => {
  const userId = Number(req.params.id);
  const userIndex = db.data?.users.findIndex((u) => u.id === userId);

  if (userIndex !== undefined && userIndex >= 0) {
    db.data.users.splice(userIndex, 1);
    db.write()
      .then(() => sendResponse(res, null, 204))
      .catch((error) =>
        sendResponse(res, { error: "Error deleting user: " + error }, 500)
      );
  } else {
    sendResponse(res, { error: "User not found" }, 404);
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
