const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  router.get('/:patientId', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT * FROM adverse_reactions WHERE patient_id = ? ORDER BY created_at DESC').all(req.params.patientId);
    res.json({ code: 200, data: rows });
  });

  router.post('/', authMiddleware, (req, res) => {
    const { type, severity, description } = req.body;
    const pid = req.user.role === 'patient' ? req.user.id : req.body.patient_id;
    const result = db.prepare('INSERT INTO adverse_reactions (patient_id, type, severity, description) VALUES (?, ?, ?, ?)').run(pid, type, severity || 'mild', description || '');
    const row = db.prepare('SELECT * FROM adverse_reactions WHERE id = ?').get(result.lastInsertRowid);
    res.json({ code: 200, data: row });
  });

  router.put('/:id/status', authMiddleware, (req, res) => {
    db.prepare('UPDATE adverse_reactions SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
    res.json({ code: 200, message: '更新成功' });
  });

  return router;
};
