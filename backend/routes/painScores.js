const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // 获取患者的疼痛评分记录
  router.get('/:patientId', authMiddleware, (req, res) => {
    const scores = db.prepare(`
      SELECT ps.*, u.name as patient_name
      FROM pain_scores ps
      JOIN users u ON ps.patient_id = u.id
      WHERE ps.patient_id = ?
      ORDER BY ps.recorded_at DESC
    `).all(req.params.patientId);
    res.json({ code: 200, data: scores });
  });

  // 获取患者最新疼痛评分
  router.get('/:patientId/latest', authMiddleware, (req, res) => {
    const score = db.prepare(`
      SELECT ps.*, u.name as patient_name
      FROM pain_scores ps
      JOIN users u ON ps.patient_id = u.id
      WHERE ps.patient_id = ?
      ORDER BY ps.recorded_at DESC
      LIMIT 1
    `).get(req.params.patientId);
    res.json({ code: 200, data: score || null });
  });

  // 提交疼痛评分
  router.post('/', authMiddleware, (req, res) => {
    const { patient_id, score, description, body_part } = req.body;
    const pid = patient_id || req.user.id;
    const result = db.prepare(`
      INSERT INTO pain_scores (patient_id, score, description, body_part)
      VALUES (?, ?, ?, ?)
    `).run(pid, score, description || '', body_part || '');
    const newScore = db.prepare('SELECT * FROM pain_scores WHERE id = ?').get(result.lastInsertRowid);
    res.json({ code: 200, message: '评分提交成功', data: newScore });
  });

  return router;
};
