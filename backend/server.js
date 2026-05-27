const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/init');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

async function start() {
  const db = await initDatabase();

  // 所有写操作后自动持久化到磁盘
  app.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        try { db.save(); } catch(e) { console.error('db save error:', e); }
      }
      return originalJson(data);
    };
    next();
  });

  app.use('/api/auth', require('./routes/auth')(db));
  app.use('/api/pain-scores', require('./routes/painScores')(db));
  app.use('/api/reminders', require('./routes/reminders')(db));
  app.use('/api/records', require('./routes/records')(db));
  app.use('/api/messages', require('./routes/messages')(db));
  app.use('/api/consultations', require('./routes/consultations')(db));
  app.use('/api/health-profiles', require('./routes/healthProfiles')(db));
  app.use('/api/nursing-tasks', require('./routes/nursingTasks')(db));
  app.use('/api/adverse-reactions', require('./routes/adverseReactions')(db));
  app.use('/api/medications', require('./routes/medications')(db));
  app.use('/api', require('./routes/patientData')(db));

  app.get('/api/health', (req, res) => {
    res.json({ code: 200, message: '服务运行正常', time: new Date().toISOString() });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`医护APP后端服务运行在 http://0.0.0.0:${PORT}`);
    console.log(`模拟器访问: http://10.0.2.2:${PORT}`);
  });
}

start().catch(console.error);
