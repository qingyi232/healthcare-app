const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // 获取单条记录详情 (放在动态路由前面)
  router.get('/detail/:id', authMiddleware, (req, res) => {
    const record = db.prepare(`
      SELECT mr.*, u.name as nurse_name, p.name as patient_name
      FROM medical_records mr
      LEFT JOIN users u ON mr.nurse_id = u.id
      LEFT JOIN users p ON mr.patient_id = p.id
      WHERE mr.id = ?
    `).get(req.params.id);
    res.json({ code: 200, data: record });
  });

  // 获取患者的医疗记录
  router.get('/:patientId', authMiddleware, (req, res) => {
    const records = db.prepare(`
      SELECT mr.*, u.name as nurse_name
      FROM medical_records mr
      LEFT JOIN users u ON mr.nurse_id = u.id
      WHERE mr.patient_id = ?
      ORDER BY mr.created_at DESC
    `).all(req.params.patientId);
    res.json({ code: 200, data: records });
  });

  // 创建医疗记录
  router.post('/', authMiddleware, (req, res) => {
    const { patient_id, title, content, type, diagnosis, treatment } = req.body;
    const result = db.prepare(`
      INSERT INTO medical_records (patient_id, nurse_id, title, content, type, diagnosis, treatment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(patient_id, req.user.id, title, content, type || 'general', diagnosis || '', treatment || '');
    const newRecord = db.prepare('SELECT * FROM medical_records WHERE id = ?').get(result.lastInsertRowid);
    res.json({ code: 200, message: '记录创建成功', data: newRecord });
  });

  return router;
};
