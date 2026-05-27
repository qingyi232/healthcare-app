const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // 获取患者的提醒列表
  router.get('/:patientId', authMiddleware, (req, res) => {
    const reminders = db.prepare(`
      SELECT * FROM reminders
      WHERE patient_id = ?
      ORDER BY remind_time ASC
    `).all(req.params.patientId);
    res.json({ code: 200, data: reminders });
  });

  // 更新提醒状态
  router.put('/:id/status', authMiddleware, (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE reminders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ code: 200, message: '状态更新成功' });
  });

  // 创建提醒
  router.post('/', authMiddleware, (req, res) => {
    const { patient_id, content, remind_time, type } = req.body;
    const pid = patient_id || req.user.id;
    const result = db.prepare(`
      INSERT INTO reminders (patient_id, content, remind_time, type)
      VALUES (?, ?, ?, ?)
    `).run(pid, content, remind_time, type || 'medication');
    const newReminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(result.lastInsertRowid);
    res.json({ code: 200, message: '提醒创建成功', data: newReminder });
  });

  return router;
};
