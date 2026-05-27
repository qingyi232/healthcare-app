const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // 登录
  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, message: '请输入用户名和密码' });
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.json({ code: 400, message: '用户不存在' });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({ code: 400, message: '密码错误' });
    }
    const token = generateToken(user);
    const { password: _, ...userInfo } = user;
    res.json({ code: 200, message: '登录成功', data: { token, user: userInfo } });
  });

  // 获取当前用户信息
  router.get('/me', authMiddleware, (req, res) => {
    const user = db.prepare('SELECT id, username, role, name, phone, avatar, gender, age, department, title, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 200, data: user });
  });

  // 获取所有医护人员列表
  router.get('/staff', authMiddleware, (req, res) => {
    const staff = db.prepare('SELECT id, name, phone, avatar, gender, age, department, title FROM users WHERE role = ?').all('nurse');
    res.json({ code: 200, data: staff });
  });

  // 获取所有患者列表
  router.get('/patients', authMiddleware, (req, res) => {
    const patients = db.prepare(`
      SELECT u.id, u.name, u.phone, u.gender, u.age, u.department,
             hp.bed_number, hp.ward, hp.admission_date
      FROM users u
      LEFT JOIN health_profiles hp ON u.id = hp.patient_id
      WHERE u.role = 'patient'
    `).all();
    res.json({ code: 200, data: patients });
  });

  return router;
};
