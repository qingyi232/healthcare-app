const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'healthcare.db');

async function initDatabase() {
  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 包装兼容层 (模拟 better-sqlite3 接口)
  const wrappedDb = {
    _db: db,
    exec(sql) { db.run(sql); },
    prepare(sql) {
      return {
        run(...params) {
          const stmt = db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          stmt.step();
          stmt.free();
          const lastId = db.exec('SELECT last_insert_rowid() as id');
          return { lastInsertRowid: lastId.length > 0 ? lastId[0].values[0][0] : 0 };
        },
        get(...params) {
          const stmt = db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            stmt.free();
            const row = {};
            cols.forEach((c, i) => row[c] = vals[i]);
            return row;
          }
          stmt.free();
          return undefined;
        },
        all(...params) {
          const stmt = db.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          const rows = [];
          while (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const row = {};
            cols.forEach((c, i) => row[c] = vals[i]);
            rows.push(row);
          }
          stmt.free();
          return rows;
        }
      };
    },
    save() {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    }
  };

  // 每30秒保存一次
  setInterval(() => wrappedDb.save(), 30000);

  // 创建用户表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('patient', 'nurse', 'admin')),
      name TEXT NOT NULL,
      phone TEXT,
      avatar TEXT,
      gender TEXT,
      age INTEGER,
      department TEXT,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 疼痛评分记录表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS pain_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 0 AND score <= 10),
      description TEXT,
      body_part TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 今日提醒表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      remind_time TEXT NOT NULL,
      type TEXT DEFAULT 'medication',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'done', 'missed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 医疗记录表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      nurse_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'general',
      diagnosis TEXT,
      treatment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id),
      FOREIGN KEY (nurse_id) REFERENCES users(id)
    )
  `);

  // 消息表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `);

  // 咨询表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      nurse_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'resolved', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id),
      FOREIGN KEY (nurse_id) REFERENCES users(id)
    )
  `);

  // 健康档案表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS health_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL UNIQUE,
      blood_type TEXT,
      allergies TEXT,
      medical_history TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      height REAL,
      weight REAL,
      bed_number TEXT,
      ward TEXT,
      admission_date TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 护理任务表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS nursing_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nurse_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('urgent', 'high', 'normal', 'low')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      scheduled_time TEXT,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (nurse_id) REFERENCES users(id),
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 不良反应表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS adverse_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      severity TEXT DEFAULT 'mild',
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 用药记录表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS medication_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      medication_name TEXT NOT NULL,
      dosage TEXT,
      frequency TEXT,
      route TEXT DEFAULT 'oral',
      start_date TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // PCA泵状态表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS pca_pump_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      drug_name TEXT NOT NULL,
      background_dose TEXT,
      bolus_dose TEXT,
      lock_time TEXT,
      press_count INTEGER DEFAULT 0,
      remaining_ml REAL DEFAULT 100,
      status TEXT DEFAULT 'running',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 镇痛自评表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS self_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 0 AND rating <= 3),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 手术记录表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS surgery_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      surgery_name TEXT NOT NULL,
      surgery_date TEXT,
      surgeon TEXT,
      operating_room TEXT,
      anesthesia_type TEXT,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 随访记录表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS follow_up_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_name TEXT,
      content TEXT NOT NULL,
      follow_date TEXT NOT NULL,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 医生留言表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS doctor_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 患者通知表(预警提醒+康复推送)
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS patient_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('alert', 'recovery')),
      sub_type TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 镇痛方案表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS pain_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      diagnosis TEXT,
      pca_drug TEXT DEFAULT '无',
      pca_bg TEXT DEFAULT '-',
      pca_bolus TEXT DEFAULT '-',
      pca_lock TEXT DEFAULT '-',
      oral_drugs TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed')),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `);

  // 护士设置表
  wrappedDb.exec(`
    CREATE TABLE IF NOT EXISTS nurse_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nurse_id INTEGER NOT NULL UNIQUE,
      pain_alert INTEGER DEFAULT 1,
      no_assess_alert INTEGER DEFAULT 1,
      reaction_alert INTEGER DEFAULT 1,
      auto_remind INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (nurse_id) REFERENCES users(id)
    )
  `);

  // 插入示例数据
  const existingUser = wrappedDb.prepare('SELECT id FROM users WHERE username = ?').get('patient1');
  if (!existingUser) {
    seedData(wrappedDb);
  }

  wrappedDb.save();
  return wrappedDb;
}

function seedData(db) {
  const hashedPwd = bcrypt.hashSync('123456', 10);

  // 插入患者
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, name, phone, avatar, gender, age, department, title)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('patient1', hashedPwd, 'patient', '张伟', '13800138001', '', '男', 45, '骨科', '');
  insertUser.run('patient2', hashedPwd, 'patient', '李芳', '13800138002', '', '女', 32, '内科', '');
  insertUser.run('patient3', hashedPwd, 'patient', '王强', '13800138003', '', '男', 58, '心内科', '');
  insertUser.run('patient4', hashedPwd, 'patient', '陈丽', '13800138004', '', '女', 28, '妇产科', '');
  insertUser.run('patient5', hashedPwd, 'patient', '刘洋', '13800138005', '', '男', 67, '呼吸科', '');

  // 插入医护人员
  insertUser.run('nurse1', hashedPwd, 'nurse', '赵雪梅', '13900139001', '', '女', 35, '骨科', '主管护师');
  insertUser.run('nurse2', hashedPwd, 'nurse', '孙丽华', '13900139002', '', '女', 29, '内科', '护师');
  insertUser.run('nurse3', hashedPwd, 'nurse', '周明', '13900139003', '', '男', 42, '心内科', '副主任护师');
  insertUser.run('doctor1', hashedPwd, 'nurse', '吴建国', '13900139004', '', '男', 48, '骨科', '主任医师');
  insertUser.run('doctor2', hashedPwd, 'nurse', '郑美玲', '13900139005', '', '女', 38, '内科', '副主任医师');

  // 插入管理员
  insertUser.run('admin', hashedPwd, 'admin', '系统管理员', '13700137001', '', '男', 40, '信息科', '管理员');

  // 疼痛评分 - 患者1 (id=1)
  const insertPain = db.prepare(`
    INSERT INTO pain_scores (patient_id, score, description, body_part, recorded_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertPain.run(1, 6, '术后伤口疼痛，活动时加重', '左膝关节', '2026-04-09 08:00:00');
  insertPain.run(1, 5, '疼痛略有缓解', '左膝关节', '2026-04-08 14:00:00');
  insertPain.run(1, 7, '术后第一天疼痛明显', '左膝关节', '2026-04-07 09:00:00');
  insertPain.run(2, 3, '头部隐痛', '头部', '2026-04-09 07:30:00');
  insertPain.run(3, 4, '胸闷伴轻微疼痛', '胸部', '2026-04-09 06:00:00');
  insertPain.run(5, 5, '咳嗽时胸痛', '胸部', '2026-04-09 07:00:00');

  // 今日提醒 - 患者1
  const insertReminder = db.prepare(`
    INSERT INTO reminders (patient_id, content, remind_time, type, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertReminder.run(1, '服用止痛药（布洛芬缓释胶囊）', '10:00', 'medication', 'pending');
  insertReminder.run(1, '伤口换药', '14:00', 'treatment', 'pending');
  insertReminder.run(1, '康复训练 - 膝关节屈伸练习', '16:00', 'rehabilitation', 'pending');
  insertReminder.run(1, '测量血压', '08:00', 'vital_signs', 'done');
  insertReminder.run(2, '服用降压药（氨氯地平）', '09:00', 'medication', 'done');
  insertReminder.run(2, '抽血化验', '07:30', 'examination', 'done');
  insertReminder.run(2, '口服补铁剂', '12:00', 'medication', 'pending');
  insertReminder.run(3, '服用阿司匹林', '08:00', 'medication', 'done');
  insertReminder.run(3, '心电监测', '10:00', 'examination', 'pending');
  insertReminder.run(3, '低盐饮食提醒', '11:30', 'diet', 'pending');
  insertReminder.run(5, '雾化吸入治疗', '09:00', 'treatment', 'done');
  insertReminder.run(5, '服用抗生素', '12:00', 'medication', 'pending');

  // 医疗记录
  const insertRecord = db.prepare(`
    INSERT INTO medical_records (patient_id, nurse_id, title, content, type, diagnosis, treatment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRecord.run(1, 6, '入院记录', '患者因左膝关节疼痛入院，拟行关节镜手术。', 'admission', '左膝半月板损伤', '关节镜手术', '2026-04-05 10:00:00');
  insertRecord.run(1, 6, '手术记录', '在全麻下行左膝关节镜下半月板修复术，手术顺利。', 'surgery', '左膝半月板损伤', '关节镜下半月板修复术', '2026-04-06 14:00:00');
  insertRecord.run(1, 6, '术后护理记录', '术后生命体征平稳，伤口敷料干燥无渗出，疼痛评分6分。', 'nursing', '', '冰敷、止痛药物治疗', '2026-04-07 08:00:00');
  insertRecord.run(2, 7, '入院记录', '患者因反复头晕、乏力入院检查。', 'admission', '缺铁性贫血', '补铁治疗+饮食调节', '2026-04-03 09:00:00');
  insertRecord.run(2, 7, '检查报告', '血常规：血红蛋白 85g/L，红细胞计数偏低。', 'examination', '缺铁性贫血', '继续补铁治疗', '2026-04-04 11:00:00');
  insertRecord.run(3, 8, '入院记录', '患者因胸闷、心悸反复发作入院。', 'admission', '冠心病', '药物保守治疗', '2026-04-01 08:00:00');
  insertRecord.run(3, 8, '心电图报告', '窦性心律，ST段轻度压低。', 'examination', 'ST段改变', '加用硝酸甘油', '2026-04-02 10:00:00');
  insertRecord.run(5, 7, '入院记录', '患者因咳嗽、咳痰2周入院。', 'admission', '肺部感染', '抗感染+雾化治疗', '2026-04-06 15:00:00');

  // 消息
  const insertMsg = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, content, type, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertMsg.run(6, 1, '张伟您好，今天术后恢复情况如何？疼痛有没有缓解？', 'text', 1, '2026-04-09 08:30:00');
  insertMsg.run(1, 6, '赵护士好，今天感觉比昨天好一些，但活动的时候还是比较痛。', 'text', 1, '2026-04-09 08:35:00');
  insertMsg.run(6, 1, '这是正常的恢复过程，术后3-5天疼痛会逐渐减轻。记得按时服药和做康复训练。', 'text', 0, '2026-04-09 08:40:00');
  insertMsg.run(9, 1, '张伟你好，我是吴医生。看了你今天的恢复情况，整体不错，继续保持。', 'text', 0, '2026-04-09 09:00:00');
  insertMsg.run(7, 2, '李芳您好，今天的血常规结果出来了，血红蛋白有所上升，继续加油。', 'text', 0, '2026-04-09 09:30:00');
  insertMsg.run(8, 3, '王叔叔，今天记得按时服药，有不舒服随时按呼叫器。', 'text', 1, '2026-04-09 07:00:00');

  // 咨询
  const insertConsult = db.prepare(`
    INSERT INTO consultations (patient_id, nurse_id, title, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertConsult.run(1, 6, '术后饮食咨询', '想了解术后恢复期间的饮食注意事项', 'resolved', '2026-04-07 10:00:00');
  insertConsult.run(1, 9, '康复训练计划', '想了解具体的康复训练计划和注意事项', 'in_progress', '2026-04-08 14:00:00');
  insertConsult.run(2, 7, '贫血饮食建议', '希望了解补铁的食物有哪些', 'resolved', '2026-04-04 15:00:00');
  insertConsult.run(3, 8, '用药疑问', '阿司匹林和硝酸甘油可以同时服用吗', 'in_progress', '2026-04-08 09:00:00');
  insertConsult.run(5, 7, '雾化治疗频次', '每天需要做几次雾化？', 'pending', '2026-04-09 08:00:00');

  // 健康档案
  const insertProfile = db.prepare(`
    INSERT INTO health_profiles (patient_id, blood_type, allergies, medical_history, emergency_contact, emergency_phone, height, weight, bed_number, ward, admission_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProfile.run(1, 'A型', '青霉素过敏', '2020年阑尾炎手术', '张红（妻子）', '13800138099', 175, 72, '305-1', '骨科三病区', '2026-04-05');
  insertProfile.run(2, 'O型', '无', '高血压病史3年', '李建（丈夫）', '13800138098', 162, 55, '201-2', '内科一病区', '2026-04-03');
  insertProfile.run(3, 'B型', '磺胺类药物过敏', '糖尿病10年，高血压8年', '王丽（女儿）', '13800138097', 170, 78, '102-1', '心内科二病区', '2026-04-01');
  insertProfile.run(4, 'AB型', '无', '无特殊病史', '陈军（丈夫）', '13800138096', 165, 60, '401-3', '妇产科一病区', '2026-04-08');
  insertProfile.run(5, 'A型', '头孢类过敏', '慢性支气管炎20年，COPD', '刘英（妻子）', '13800138095', 168, 65, '503-2', '呼吸科一病区', '2026-04-06');

  // 护理任务
  const insertTask = db.prepare(`
    INSERT INTO nursing_tasks (nurse_id, patient_id, title, content, priority, status, scheduled_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertTask.run(6, 1, '术后伤口换药', '左膝关节术后伤口消毒换药', 'high', 'pending', '14:00');
  insertTask.run(6, 1, '生命体征监测', '监测体温、血压、心率', 'normal', 'completed', '08:00');
  insertTask.run(6, 1, '协助康复训练', '协助患者进行膝关节屈伸练习', 'normal', 'pending', '16:00');
  insertTask.run(7, 2, '输液治疗', '补铁针剂静脉滴注', 'high', 'pending', '10:00');
  insertTask.run(7, 2, '饮食指导', '指导患者选择富含铁质的食物', 'low', 'completed', '09:00');
  insertTask.run(8, 3, '心电监测', '12导联心电图检查', 'high', 'pending', '10:00');
  insertTask.run(8, 3, '用药提醒', '监督患者按时服用心血管药物', 'normal', 'completed', '08:00');
  insertTask.run(7, 5, '雾化吸入', '布地奈德+特布他林雾化吸入', 'high', 'in_progress', '09:00');
  insertTask.run(6, 4, '产前检查', '常规产前检查+胎心监测', 'normal', 'pending', '11:00');

  // 不良反应
  const insertReaction = db.prepare(`INSERT INTO adverse_reactions (patient_id, type, severity, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
  insertReaction.run(1, 'nausea', 'mild', '服用止痛药后轻微恶心', 'handled', '2026-04-07 15:00:00');
  insertReaction.run(1, 'dizziness', 'mild', '起身时头晕', 'handled', '2026-04-08 10:00:00');
  insertReaction.run(3, 'breathing', 'moderate', '活动后呼吸急促', 'handled', '2026-04-02 14:00:00');
  insertReaction.run(5, 'nausea', 'moderate', '雾化后恶心呕吐', 'handled', '2026-04-07 10:00:00');

  // 用药记录
  const insertMed = db.prepare(`INSERT INTO medication_records (patient_id, medication_name, dosage, frequency, route, start_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertMed.run(1, '布洛芬缓释胶囊', '300mg', '每日2次', 'oral', '2026-04-07', 'active');
  insertMed.run(1, '头孢呋辛酯片', '250mg', '每日2次', 'oral', '2026-04-06', 'active');
  insertMed.run(1, '低分子肝素钠注射液', '4000IU', '每日1次', 'injection', '2026-04-06', 'active');
  insertMed.run(2, '琥珀酸亚铁片', '100mg', '每日3次', 'oral', '2026-04-03', 'active');
  insertMed.run(2, '维生素C片', '100mg', '每日3次', 'oral', '2026-04-03', 'active');
  insertMed.run(3, '阿司匹林肠溶片', '100mg', '每日1次', 'oral', '2026-04-01', 'active');
  insertMed.run(3, '硝酸甘油片', '0.5mg', '必要时舌下含服', 'sublingual', '2026-04-01', 'active');
  insertMed.run(3, '氨氯地平片', '5mg', '每日1次', 'oral', '2026-04-01', 'active');
  insertMed.run(5, '左氧氟沙星注射液', '500mg', '每日1次', 'injection', '2026-04-06', 'active');
  insertMed.run(5, '布地奈德混悬液', '2mg', '每日2次', 'inhalation', '2026-04-06', 'active');

  // PCA泵状态
  const insertPca = db.prepare(`INSERT INTO pca_pump_status (patient_id, drug_name, background_dose, bolus_dose, lock_time, press_count, remaining_ml, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  insertPca.run(1, '舒芬太尼', '2ml/h', '0.5ml', '15分钟', 3, 85, 'running');
  insertPca.run(3, '吗啡', '1ml/h', '0.5ml', '20分钟', 1, 92, 'running');

  // 镇痛自评
  const insertRating = db.prepare(`INSERT INTO self_ratings (patient_id, rating, created_at) VALUES (?, ?, ?)`);
  insertRating.run(1, 1, '2026-04-09 10:00:00');
  insertRating.run(1, 2, '2026-04-08 15:00:00');
  insertRating.run(3, 2, '2026-04-09 08:00:00');

  // 手术记录
  const insertSurgery = db.prepare(`INSERT INTO surgery_records (patient_id, surgery_name, surgery_date, surgeon, operating_room, anesthesia_type, result) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertSurgery.run(1, '左膝关节镜下半月板修复术', '2026-04-06', '吴建国 主任医师', '3号手术室', '全身麻醉', '手术顺利，术后恢复中');
  insertSurgery.run(3, '冠状动脉造影术', '2026-04-02', '周明 副主任护师', '1号介入室', '局部麻醉', '造影显示左前降支狭窄40%，保守治疗');
  insertSurgery.run(4, '剖宫产手术', '2026-04-08', '郑美玲 副主任医师', '2号手术室', '腰硬联合麻醉', '母子平安');

  // 随访记录
  const insertFollowup = db.prepare(`INSERT INTO follow_up_records (patient_id, doctor_name, content, follow_date, status) VALUES (?, ?, ?, ?, ?)`);
  insertFollowup.run(1, '赵雪梅', '术后第3天，伤口恢复良好，疼痛评分6分，继续现有镇痛方案。', '2026-04-09', 'completed');
  insertFollowup.run(1, '吴建国', '术后第1天查房，生命体征平稳，伤口无渗出，可开始康复训练。', '2026-04-07', 'completed');
  insertFollowup.run(1, '吴建国', '计划术后1周复查，评估恢复情况。', '2026-04-12', 'pending');
  insertFollowup.run(2, '孙丽华', '血红蛋白上升至95g/L，继续口服补铁。', '2026-04-08', 'completed');
  insertFollowup.run(3, '周明', '心电图复查，ST段无进一步改变。', '2026-04-05', 'completed');
  insertFollowup.run(3, '周明', '出院前复查心脏彩超。', '2026-04-13', 'pending');

  // 医生留言
  const insertNote = db.prepare(`INSERT INTO doctor_notes (patient_id, doctor_name, content, created_at) VALUES (?, ?, ?, ?)`);
  insertNote.run(1, '吴建国 主任医师', '张伟你好，看了你今天的恢复情况，整体不错。注意按时服药和做康复训练，有问题随时联系。', '2026-04-09 09:00:00');
  insertNote.run(1, '赵雪梅 主管护师', '今天术后恢复情况良好，疼痛如果加重可以按压PCA泵。记得多喝水，按时做呼吸训练。', '2026-04-08 15:00:00');
  insertNote.run(1, '吴建国 主任医师', '手术很成功，预计恢复期2-3周。术后注意抬高患肢，有助于消肿。', '2026-04-06 18:00:00');
  insertNote.run(2, '孙丽华 护师', '李芳你好，今日血常规结果有改善，继续保持饮食调节。', '2026-04-08 11:00:00');
  insertNote.run(3, '周明 副主任护师', '王叔叔，心电图结果稳定，注意低盐低脂饮食。', '2026-04-06 10:00:00');

  // 患者通知 - 预警提醒
  const insertNotif = db.prepare(`INSERT INTO patient_notifications (patient_id, title, content, type, sub_type, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
  insertNotif.run(1, '疼痛评分提醒', '您今日尚未进行疼痛评分，请及时记录当前疼痛状况', 'alert', 'assessment', '2026-04-10 09:00:00');
  insertNotif.run(1, '用药提醒', '布洛芬缓释胶囊 300mg，请按时服用', 'alert', 'medication', '2026-04-10 10:00:00');
  insertNotif.run(1, '康复训练提醒', '膝关节屈伸练习时间到了，请按计划进行', 'alert', 'rehab', '2026-04-10 16:00:00');
  insertNotif.run(1, '疼痛预警', '您昨日疼痛评分较高(6分)，请注意休息并及时联系医护', 'alert', 'pain', '2026-04-09 20:00:00');
  insertNotif.run(2, '用药提醒', '琥珀酸亚铁片 100mg，请随餐服用', 'alert', 'medication', '2026-04-10 12:00:00');
  insertNotif.run(3, '心电监测提醒', '今日10:00进行心电监测，请做好准备', 'alert', 'examination', '2026-04-10 09:30:00');
  // 康复推送
  insertNotif.run(1, '术后饮食建议', '今日可进食半流质饮食，建议选择稀饭、面条等易消化食物，避免油腻辛辣', 'recovery', 'diet', '2026-04-10 08:00:00');
  insertNotif.run(1, '运动指导', '今日可尝试在护士协助下床边站立5分钟，注意防跌倒', 'recovery', 'activity', '2026-04-10 09:00:00');
  insertNotif.run(1, '呼吸训练提示', '建议进行腹式呼吸训练，每次10分钟，有助于肺功能恢复', 'recovery', 'breathing', '2026-04-09 14:00:00');
  insertNotif.run(1, '伤口护理提醒', '明日上午进行伤口换药，请保持伤口清洁干燥', 'recovery', 'wound', '2026-04-09 10:00:00');
  insertNotif.run(1, '睡眠质量关注', '昨晚睡眠时长不足6小时，建议今晚提前休息，避免使用手机', 'recovery', 'sleep', '2026-04-09 22:00:00');
  insertNotif.run(2, '补铁饮食指导', '多食用猪肝、菠菜、红枣等含铁丰富的食物', 'recovery', 'diet', '2026-04-10 08:00:00');

  // 镇痛方案
  const insertPlan = db.prepare(`INSERT INTO pain_plans (patient_id, diagnosis, pca_drug, pca_bg, pca_bolus, pca_lock, oral_drugs, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertPlan.run(1, '左膝半月板损伤术后', '舒芬太尼', '2ml/h', '0.5ml', '15min', '布洛芬缓释胶囊 300mg bid|头孢呋辛酯片 250mg bid', 'confirmed', '2026-04-07');
  insertPlan.run(2, '缺铁性贫血头痛', '无', '-', '-', '-', '对乙酰氨基酚 500mg prn', 'pending', '2026-04-08');
  insertPlan.run(3, '冠心病胸痛', '无', '-', '-', '-', '阿司匹林 100mg qd|硝酸甘油 0.5mg prn', 'confirmed', '2026-04-02');
  insertPlan.run(5, '肺部感染胸痛', '无', '-', '-', '-', '布洛芬 200mg prn|左氧氟沙星 500mg qd', 'pending', '2026-04-09');

  // 护士设置
  const insertSetting = db.prepare(`INSERT INTO nurse_settings (nurse_id, pain_alert, no_assess_alert, reaction_alert, auto_remind) VALUES (?, ?, ?, ?, ?)`);
  insertSetting.run(6, 1, 1, 1, 1);
  insertSetting.run(7, 1, 1, 0, 1);
  insertSetting.run(8, 1, 0, 1, 1);

  console.log('示例数据已插入成功！');
}

module.exports = { initDatabase };
