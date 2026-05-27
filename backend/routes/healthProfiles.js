const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // 获取健康档案
  router.get('/:patientId', authMiddleware, (req, res) => {
    const profile = db.prepare(`
      SELECT hp.*, u.name, u.gender, u.age, u.phone, u.department
      FROM health_profiles hp
      JOIN users u ON hp.patient_id = u.id
      WHERE hp.patient_id = ?
    `).get(req.params.patientId);
    res.json({ code: 200, data: profile || null });
  });

  // 更新健康档案
  router.put('/:patientId', authMiddleware, (req, res) => {
    const { blood_type, allergies, medical_history, emergency_contact, emergency_phone, height, weight, bed_number, ward } = req.body;
    db.prepare(`
      UPDATE health_profiles SET
        blood_type = COALESCE(?, blood_type),
        allergies = COALESCE(?, allergies),
        medical_history = COALESCE(?, medical_history),
        emergency_contact = COALESCE(?, emergency_contact),
        emergency_phone = COALESCE(?, emergency_phone),
        height = COALESCE(?, height),
        weight = COALESCE(?, weight),
        bed_number = COALESCE(?, bed_number),
        ward = COALESCE(?, ward),
        updated_at = CURRENT_TIMESTAMP
      WHERE patient_id = ?
    `).run(blood_type, allergies, medical_history, emergency_contact, emergency_phone, height, weight, bed_number, ward, req.params.patientId);
    res.json({ code: 200, message: '档案更新成功' });
  });

  return router;
};
