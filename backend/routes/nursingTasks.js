const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // 获取护理任务（医护端）
  router.get('/nurse/:nurseId', authMiddleware, (req, res) => {
    const tasks = db.prepare(`
      SELECT nt.*, u.name as patient_name, u.age as patient_age, u.gender as patient_gender,
             hp.bed_number, hp.ward
      FROM nursing_tasks nt
      JOIN users u ON nt.patient_id = u.id
      LEFT JOIN health_profiles hp ON nt.patient_id = hp.patient_id
      WHERE nt.nurse_id = ?
      ORDER BY 
        CASE nt.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END,
        nt.scheduled_time ASC
    `).all(req.params.nurseId);
    res.json({ code: 200, data: tasks });
  });

  // 获取患者相关的护理任务
  router.get('/patient/:patientId', authMiddleware, (req, res) => {
    const tasks = db.prepare(`
      SELECT nt.*, u.name as nurse_name, u.title as nurse_title
      FROM nursing_tasks nt
      JOIN users u ON nt.nurse_id = u.id
      WHERE nt.patient_id = ?
      ORDER BY nt.scheduled_time ASC
    `).all(req.params.patientId);
    res.json({ code: 200, data: tasks });
  });

  // 更新任务状态
  router.put('/:id/status', authMiddleware, (req, res) => {
    const { status } = req.body;
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    db.prepare('UPDATE nursing_tasks SET status = ?, completed_at = ? WHERE id = ?').run(status, completedAt, req.params.id);
    res.json({ code: 200, message: '任务状态更新成功' });
  });

  // 创建护理任务
  router.post('/', authMiddleware, (req, res) => {
    const { patient_id, title, content, priority, scheduled_time } = req.body;
    const result = db.prepare(`
      INSERT INTO nursing_tasks (nurse_id, patient_id, title, content, priority, scheduled_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, patient_id, title, content || '', priority || 'normal', scheduled_time || '');
    const task = db.prepare('SELECT * FROM nursing_tasks WHERE id = ?').get(result.lastInsertRowid);
    res.json({ code: 200, message: '任务创建成功', data: task });
  });

  // 获取任务统计
  router.get('/stats/:nurseId', authMiddleware, (req, res) => {
    const nid = req.params.nurseId;
    const getCount = (sql, ...params) => { const r = db.prepare(sql).get(...params); return r ? r.count : 0; };
    const stats = {
      total: getCount('SELECT COUNT(*) as count FROM nursing_tasks WHERE nurse_id = ?', nid),
      pending: getCount("SELECT COUNT(*) as count FROM nursing_tasks WHERE nurse_id = ? AND status = 'pending'", nid),
      in_progress: getCount("SELECT COUNT(*) as count FROM nursing_tasks WHERE nurse_id = ? AND status = 'in_progress'", nid),
      completed: getCount("SELECT COUNT(*) as count FROM nursing_tasks WHERE nurse_id = ? AND status = 'completed'", nid),
    };
    res.json({ code: 200, data: stats });
  });

  return router;
};
