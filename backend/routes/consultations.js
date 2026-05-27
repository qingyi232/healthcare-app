const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // 获取咨询列表（患者看自己的，医护看分配给自己的）
  router.get('/', authMiddleware, (req, res) => {
    let consultations;
    if (req.user.role === 'patient') {
      consultations = db.prepare(`
        SELECT c.*, u.name as nurse_name, u.title as nurse_title, u.department as nurse_department
        FROM consultations c
        LEFT JOIN users u ON c.nurse_id = u.id
        WHERE c.patient_id = ?
        ORDER BY c.created_at DESC
      `).all(req.user.id);
    } else {
      consultations = db.prepare(`
        SELECT c.*, p.name as patient_name, p.age as patient_age, p.gender as patient_gender
        FROM consultations c
        JOIN users p ON c.patient_id = p.id
        WHERE c.nurse_id = ? OR c.nurse_id IS NULL
        ORDER BY c.created_at DESC
      `).all(req.user.id);
    }
    res.json({ code: 200, data: consultations });
  });

  // 创建咨询
  router.post('/', authMiddleware, (req, res) => {
    const { nurse_id, title, description } = req.body;
    const result = db.prepare(`
      INSERT INTO consultations (patient_id, nurse_id, title, description)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, nurse_id || null, title, description || '');
    const consult = db.prepare('SELECT * FROM consultations WHERE id = ?').get(result.lastInsertRowid);
    res.json({ code: 200, message: '咨询创建成功', data: consult });
  });

  // 更新咨询状态
  router.put('/:id/status', authMiddleware, (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE consultations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
    res.json({ code: 200, message: '状态更新成功' });
  });

  return router;
};
