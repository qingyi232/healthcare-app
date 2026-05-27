const express = require('express');
const router = express.Router();

module.exports = function(db) {
  const { authMiddleware } = require('../middleware/auth');

  // ===== PCA泵状态 =====
  router.get('/pca-pump/:patientId', authMiddleware, (req, res) => {
    const row = db.prepare('SELECT * FROM pca_pump_status WHERE patient_id = ? ORDER BY updated_at DESC').get(parseInt(req.params.patientId));
    res.json({ code: 200, data: row || null });
  });

  router.put('/pca-pump/:patientId/press', authMiddleware, (req, res) => {
    const pid = parseInt(req.params.patientId);
    const existing = db.prepare('SELECT * FROM pca_pump_status WHERE patient_id = ?').get(pid);
    if (!existing) return res.json({ code: 404, message: '未找到PCA泵记录' });
    const newCount = existing.press_count + 1;
    const newRemaining = Math.max(0, existing.remaining_ml - parseFloat(existing.bolus_dose));
    db.prepare('UPDATE pca_pump_status SET press_count = ?, remaining_ml = ?, updated_at = CURRENT_TIMESTAMP WHERE patient_id = ?').run(newCount, newRemaining, pid);
    db.save();
    const updated = db.prepare('SELECT * FROM pca_pump_status WHERE patient_id = ?').get(pid);
    res.json({ code: 200, data: updated });
  });

  // ===== 镇痛自评 =====
  router.get('/self-ratings/:patientId', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT * FROM self_ratings WHERE patient_id = ? ORDER BY created_at DESC').all(parseInt(req.params.patientId));
    res.json({ code: 200, data: rows });
  });

  router.post('/self-ratings', authMiddleware, (req, res) => {
    const { patient_id, rating } = req.body;
    const result = db.prepare('INSERT INTO self_ratings (patient_id, rating) VALUES (?, ?)').run(patient_id, rating);
    db.save();
    res.json({ code: 200, data: { id: result.lastInsertRowid, patient_id, rating } });
  });

  // ===== 手术记录 =====
  router.get('/surgery-records/:patientId', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT * FROM surgery_records WHERE patient_id = ? ORDER BY surgery_date DESC').all(parseInt(req.params.patientId));
    res.json({ code: 200, data: rows });
  });

  // ===== 随访记录 =====
  router.get('/follow-ups/:patientId', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT * FROM follow_up_records WHERE patient_id = ? ORDER BY follow_date DESC').all(parseInt(req.params.patientId));
    res.json({ code: 200, data: rows });
  });

  // ===== 医生留言 =====
  router.get('/doctor-notes/:patientId', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT * FROM doctor_notes WHERE patient_id = ? ORDER BY created_at DESC').all(parseInt(req.params.patientId));
    res.json({ code: 200, data: rows });
  });

  // ===== 患者通知(预警+康复推送) =====
  router.get('/notifications/:patientId', authMiddleware, (req, res) => {
    const type = req.query.type; // 'alert' or 'recovery'
    let rows;
    if (type) {
      rows = db.prepare('SELECT * FROM patient_notifications WHERE patient_id = ? AND type = ? ORDER BY created_at DESC').all(parseInt(req.params.patientId), type);
    } else {
      rows = db.prepare('SELECT * FROM patient_notifications WHERE patient_id = ? ORDER BY created_at DESC').all(parseInt(req.params.patientId));
    }
    res.json({ code: 200, data: rows });
  });

  // ===== 镇痛方案 =====
  router.get('/pain-plans', authMiddleware, (req, res) => {
    const rows = db.prepare(`
      SELECT pp.*, u.name as patient_name, hp.bed_number, u.department
      FROM pain_plans pp
      JOIN users u ON pp.patient_id = u.id
      LEFT JOIN health_profiles hp ON pp.patient_id = hp.patient_id
      ORDER BY pp.updated_at DESC
    `).all();
    res.json({ code: 200, data: rows });
  });

  router.put('/pain-plans/:id/confirm', authMiddleware, (req, res) => {
    db.prepare('UPDATE pain_plans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('confirmed', parseInt(req.params.id));
    db.save();
    res.json({ code: 200, message: '方案已确认' });
  });

  router.put('/pain-plans/:id', authMiddleware, (req, res) => {
    const { pca_drug, pca_bg, pca_bolus, pca_lock, oral_drugs, diagnosis } = req.body;
    db.prepare('UPDATE pain_plans SET pca_drug=?, pca_bg=?, pca_bolus=?, pca_lock=?, oral_drugs=?, diagnosis=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(pca_drug, pca_bg, pca_bolus, pca_lock, oral_drugs, diagnosis, parseInt(req.params.id));
    db.save();
    res.json({ code: 200, message: '方案已更新' });
  });

  // ===== 护士设置 =====
  router.get('/nurse-settings/:nurseId', authMiddleware, (req, res) => {
    const row = db.prepare('SELECT * FROM nurse_settings WHERE nurse_id = ?').get(parseInt(req.params.nurseId));
    if (!row) {
      db.prepare('INSERT INTO nurse_settings (nurse_id) VALUES (?)').run(parseInt(req.params.nurseId));
      db.save();
      const newRow = db.prepare('SELECT * FROM nurse_settings WHERE nurse_id = ?').get(parseInt(req.params.nurseId));
      return res.json({ code: 200, data: newRow });
    }
    res.json({ code: 200, data: row });
  });

  router.put('/nurse-settings/:nurseId', authMiddleware, (req, res) => {
    const { pain_alert, no_assess_alert, reaction_alert, auto_remind } = req.body;
    const nid = parseInt(req.params.nurseId);
    const existing = db.prepare('SELECT * FROM nurse_settings WHERE nurse_id = ?').get(nid);
    if (!existing) {
      db.prepare('INSERT INTO nurse_settings (nurse_id, pain_alert, no_assess_alert, reaction_alert, auto_remind) VALUES (?,?,?,?,?)').run(nid, pain_alert?1:0, no_assess_alert?1:0, reaction_alert?1:0, auto_remind?1:0);
    } else {
      db.prepare('UPDATE nurse_settings SET pain_alert=?, no_assess_alert=?, reaction_alert=?, auto_remind=?, updated_at=CURRENT_TIMESTAMP WHERE nurse_id=?')
        .run(pain_alert?1:0, no_assess_alert?1:0, reaction_alert?1:0, auto_remind?1:0, nid);
    }
    db.save();
    const row = db.prepare('SELECT * FROM nurse_settings WHERE nurse_id = ?').get(nid);
    res.json({ code: 200, data: row });
  });

  // ===== 护士预警中心(实时计算) =====
  router.get('/nurse-alerts', authMiddleware, (req, res) => {
    const alerts = [];
    // 1. 疼痛过高预警: 最新评分>=7
    const patients = db.prepare("SELECT id, name, department FROM users WHERE role = 'patient'").all();
    for (const p of patients) {
      const hp = db.prepare('SELECT bed_number, ward FROM health_profiles WHERE patient_id = ?').get(p.id);
      const latest = db.prepare('SELECT * FROM pain_scores WHERE patient_id = ? ORDER BY recorded_at DESC').get(p.id);
      if (latest && latest.score >= 7) {
        alerts.push({ id: `pain_${p.id}`, type: 'pain_high', patient: p.name, patient_id: p.id, bed: hp?.bed_number||'-', department: hp?.ward||p.department, score: latest.score, desc: `疼痛评分${latest.score}分，超过预警阈值(≥7)`, time: latest.recorded_at, level: 'danger' });
      } else if (latest && latest.score >= 4) {
        alerts.push({ id: `pain_${p.id}`, type: 'pain_high', patient: p.name, patient_id: p.id, bed: hp?.bed_number||'-', department: hp?.ward||p.department, score: latest.score, desc: `疼痛评分${latest.score}分，需关注`, time: latest.recorded_at, level: 'caution' });
      }
      // 2. 未评估提醒: 最新评分超过2小时
      if (latest) {
        const recTime = new Date(latest.recorded_at).getTime();
        const diffH = (Date.now() - recTime) / 3600000;
        if (diffH > 2) {
          alerts.push({ id: `noassess_${p.id}`, type: 'no_assessment', patient: p.name, patient_id: p.id, bed: hp?.bed_number||'-', department: hp?.ward||p.department, desc: `超过${Math.floor(diffH)}小时未进行疼痛评估`, time: latest.recorded_at, level: 'warning' });
        }
      }
    }
    // 3. 不良反应预警
    const recentReactions = db.prepare("SELECT ar.*, u.name as patient_name FROM adverse_reactions ar JOIN users u ON ar.patient_id = u.id WHERE ar.status = 'pending' OR ar.created_at > datetime('now', '-24 hours') ORDER BY ar.created_at DESC").all();
    for (const r of recentReactions) {
      const hp = db.prepare('SELECT bed_number, ward FROM health_profiles WHERE patient_id = ?').get(r.patient_id);
      const typeMap = {nausea:'恶心呕吐',dizziness:'头晕',breathing:'呼吸异常',rash:'皮疹',drowsiness:'嗜睡',other:'其他'};
      alerts.push({ id: `reaction_${r.id}`, type: 'adverse', patient: r.patient_name, patient_id: r.patient_id, bed: hp?.bed_number||'-', department: hp?.ward||'-', desc: `上报不良反应：${typeMap[r.type]||r.type}（${r.severity}）`, time: r.created_at, level: r.severity === 'severe' ? 'danger' : 'warning' });
    }
    // 按严重程度排序
    const levelOrder = { danger: 0, warning: 1, caution: 2 };
    alerts.sort((a, b) => (levelOrder[a.level]||9) - (levelOrder[b.level]||9));
    res.json({ code: 200, data: alerts });
  });

  // ===== 统计趋势(真实7天数据) =====
  router.get('/stats/trend', authMiddleware, (req, res) => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const total = db.prepare("SELECT COUNT(*) as cnt FROM pain_scores WHERE date(recorded_at) = ?").get(dateStr);
      const controlled = db.prepare("SELECT COUNT(*) as cnt FROM pain_scores WHERE date(recorded_at) = ? AND score <= 3").get(dateStr);
      const rate = total.cnt > 0 ? Math.round(controlled.cnt / total.cnt * 100) : 0;
      const dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
      const d = new Date(dateStr);
      days.push({ date: dateStr, dayName: dayNames[d.getDay()], controlRate: rate, totalAssessments: total.cnt });
    }
    res.json({ code: 200, data: days });
  });

  // ===== 康复进度 =====
  router.get('/recovery-progress/:patientId', authMiddleware, (req, res) => {
    const pid = parseInt(req.params.patientId);
    const hp = db.prepare('SELECT admission_date FROM health_profiles WHERE patient_id = ?').get(pid);
    const surgery = db.prepare('SELECT surgery_name, surgery_date FROM surgery_records WHERE patient_id = ? ORDER BY surgery_date DESC').get(pid);
    const nextReminder = db.prepare("SELECT content, remind_time FROM reminders WHERE patient_id = ? AND status = 'pending' AND type = 'rehabilitation' ORDER BY remind_time ASC").get(pid);
    const nextTreatment = db.prepare("SELECT content, remind_time FROM reminders WHERE patient_id = ? AND status = 'pending' AND type = 'treatment' ORDER BY remind_time ASC").get(pid);

    let daysSinceSurgery = 0;
    if (surgery?.surgery_date) {
      daysSinceSurgery = Math.floor((Date.now() - new Date(surgery.surgery_date).getTime()) / 86400000);
    }
    res.json({ code: 200, data: {
      daysSinceSurgery,
      estimatedDays: 14,
      surgeryName: surgery?.surgery_name || '',
      nextRehab: nextReminder?.content || '',
      nextRehabTime: nextReminder?.remind_time || '',
      nextTreatment: nextTreatment?.content || '',
      nextTreatmentTime: nextTreatment?.remind_time || '',
    }});
  });

  return router;
};
