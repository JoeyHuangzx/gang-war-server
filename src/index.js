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
  gold: 0,
  currentLevel: 1,
  purchasedGrids: 3,
  characters: [],
  unlockedCharacters: ["近战基础兵"],
  formation: []
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
  if(db.data.users.length === 0) {
    db.data.users.push(defaultData);
  }
  await db.write();
})();

// 获取所有用户数据
app.get("/users", (req, res) => {
  res.json(db.data?.users || []);
});

// 获取单个用户数据
app.get("/users/:id", (req, res) => {
  console.log(`Received request for user with id: ${req.params.id}`);  // 打印收到的 id
  const userId = Number(req.params.id);
  const user = db.data?.users.find((u) => u.id === userId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).send("User not found");
  }
});

// 创建新用户
app.post("/users", (req, res) => {
  const newUser = req.body;
  db.data?.users.push(newUser);
  db.write()
    .then(() => res.status(201).json(newUser))
    .catch((error) => res.status(500).send("Error saving user: " + error));
});

// 更新用户数据
app.put("/users/:id", (req, res) => {
  
  const userId = Number(req.params.id);
  const updatedData = req.body;
  const userIndex = db.data?.users.findIndex((u) => u.id === userId);

  if (userIndex !== undefined && userIndex >= 0) {
    db.data.users[userIndex] = { ...db.data.users[userIndex], ...updatedData };
    db.write()
      .then(() => res.json(db.data.users[userIndex]))
      .catch((error) => res.status(500).send("Error updating user: " + error));
  } else {
    res.status(404).send("User not found");
  }
});

// 删除用户
app.delete("/users/:id", (req, res) => {
  const userId = Number(req.params.id);
  const userIndex = db.data?.users.findIndex((u) => u.id === userId);

  if (userIndex !== undefined && userIndex >= 0) {
    db.data.users.splice(userIndex, 1);
    db.write()
      .then(() => res.status(204).send())
      .catch((error) => res.status(500).send("Error deleting user: " + error));
  } else {
    res.status(404).send("User not found");
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
