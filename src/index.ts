import express, { Request, Response } from 'express';
import { JSONFilePreset } from 'node_modules/lowdb/lib/presets/node.js';

// 设置数据存储文件和数据库类型
interface UserData {
  id: string;
  name: string;
  level: number;
  score: number;
}

interface Database {
  users: UserData[];
}

// 初始化数据库
const defaultData: Database = { users: [] };
const db = await JSONFilePreset('data.json', defaultData);

// 初始化express
const app = express();
const port = 3000;

app.use(express.json());

// 加载数据库
db.read().then(() => {
  // 如果数据库为空，初始化数据
  if (!db.data) {
    db.data = { users: [] };
    db.write();
  }
});

// 获取所有用户数据
app.get('/users', (req: Request, res: Response) => {
  res.json(db.data?.users || []);
});

// 获取单个用户数据
app.get('/users/:id', (req: Request, res: Response) => {
  const userId = req.params.id;
  const user = db.data?.users.find(u => u.id === userId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).send('User not found');
  }
});

// 创建新用户
app.post('/users', (req: Request, res: Response) => {
  const newUser: UserData = req.body;
  db.data?.users.push(newUser);
  db.write()
    .then(() => res.status(201).json(newUser))
    .catch((error) => res.status(500).send('Error saving user: ' + error));
});

// 更新用户数据
app.put('/users/:id', (req: Request, res: Response) => {
  const userId = req.params.id;
  const updatedData: UserData = req.body;
  const userIndex = db.data?.users.findIndex(u => u.id === userId);

  if (userIndex !== undefined && userIndex >= 0) {
    db.data!.users[userIndex] = { ...db.data!.users[userIndex], ...updatedData };
    db.write()
      .then(() => res.json(db.data!.users[userIndex]))
      .catch((error) => res.status(500).send('Error updating user: ' + error));
  } else {
    res.status(404).send('User not found');
  }
});

// 删除用户
app.delete('/users/:id', (req: Request, res: Response) => {
  const userId = req.params.id;
  const userIndex = db.data?.users.findIndex(u => u.id === userId);

  if (userIndex !== undefined && userIndex >= 0) {
    db.data!.users.splice(userIndex, 1);
    db.write()
      .then(() => res.status(204).send())
      .catch((error) => res.status(500).send('Error deleting user: ' + error));
  } else {
    res.status(404).send('User not found');
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

