import axios from 'axios';

// Android模拟器用10.0.2.2访问宿主机, 真机用电脑局域网IP
// 开发时web端用相对路径/api走vite代理
function getBaseURL() {
  if (typeof window !== 'undefined' && window._ANDROID_ENV) {
    return window._API_BASE || 'http://10.0.2.2:3001/api';
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return 'http://10.0.2.2:3001/api';
  }
  return '/api';
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

// 认证
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getStaff: () => api.get('/auth/staff'),
  getPatients: () => api.get('/auth/patients'),
};

// 疼痛评分
export const painAPI = {
  getScores: (patientId) => api.get(`/pain-scores/${patientId}`),
  getLatest: (patientId) => api.get(`/pain-scores/${patientId}/latest`),
  submit: (data) => api.post('/pain-scores', data),
};

// 提醒
export const reminderAPI = {
  getList: (patientId) => api.get(`/reminders/${patientId}`),
  updateStatus: (id, status) => api.put(`/reminders/${id}/status`, { status }),
  create: (data) => api.post('/reminders', data),
};

// 医疗记录
export const recordAPI = {
  getList: (patientId) => api.get(`/records/${patientId}`),
  getDetail: (id) => api.get(`/records/detail/${id}`),
  create: (data) => api.post('/records', data),
};

// 消息
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getChat: (otherId) => api.get(`/messages/chat/${otherId}`),
  send: (data) => api.post('/messages/send', data),
  getUnreadCount: () => api.get('/messages/unread-count'),
};

// 咨询
export const consultAPI = {
  getList: () => api.get('/consultations'),
  create: (data) => api.post('/consultations', data),
  updateStatus: (id, status) => api.put(`/consultations/${id}/status`, { status }),
};

// 健康档案
export const profileAPI = {
  get: (patientId) => api.get(`/health-profiles/${patientId}`),
  update: (patientId, data) => api.put(`/health-profiles/${patientId}`, data),
};

// 护理任务
export const taskAPI = {
  getNurseTasks: (nurseId) => api.get(`/nursing-tasks/nurse/${nurseId}`),
  getPatientTasks: (patientId) => api.get(`/nursing-tasks/patient/${patientId}`),
  updateStatus: (id, status) => api.put(`/nursing-tasks/${id}/status`, { status }),
  create: (data) => api.post('/nursing-tasks', data),
  getStats: (nurseId) => api.get(`/nursing-tasks/stats/${nurseId}`),
};

// 不良反应
export const reactionAPI = {
  getList: (patientId) => api.get(`/adverse-reactions/${patientId}`),
  create: (data) => api.post('/adverse-reactions', data),
  updateStatus: (id, status) => api.put(`/adverse-reactions/${id}/status`, { status }),
};

// 用药记录
export const medicationAPI = {
  getList: (patientId) => api.get(`/medications/${patientId}`),
};

// 统计
export const statsAPI = {
  getAll: () => api.get('/medications/stats/all'),
  getTrend: () => api.get('/stats/trend'),
};

// PCA泵
export const pcaAPI = {
  getStatus: (patientId) => api.get(`/pca-pump/${patientId}`),
  press: (patientId) => api.put(`/pca-pump/${patientId}/press`),
};

// 镇痛自评
export const selfRatingAPI = {
  getList: (patientId) => api.get(`/self-ratings/${patientId}`),
  submit: (data) => api.post('/self-ratings', data),
};

// 手术记录
export const surgeryAPI = {
  getList: (patientId) => api.get(`/surgery-records/${patientId}`),
};

// 随访记录
export const followUpAPI = {
  getList: (patientId) => api.get(`/follow-ups/${patientId}`),
};

// 医生留言
export const doctorNoteAPI = {
  getList: (patientId) => api.get(`/doctor-notes/${patientId}`),
};

// 患者通知
export const notificationAPI = {
  getAlerts: (patientId) => api.get(`/notifications/${patientId}?type=alert`),
  getRecovery: (patientId) => api.get(`/notifications/${patientId}?type=recovery`),
};

// 镇痛方案
export const painPlanAPI = {
  getAll: () => api.get('/pain-plans'),
  confirm: (id) => api.put(`/pain-plans/${id}/confirm`),
  update: (id, data) => api.put(`/pain-plans/${id}`, data),
};

// 护士设置
export const nurseSettingAPI = {
  get: (nurseId) => api.get(`/nurse-settings/${nurseId}`),
  update: (nurseId, data) => api.put(`/nurse-settings/${nurseId}`, data),
};

// 护士预警
export const nurseAlertAPI = {
  getAll: () => api.get('/nurse-alerts'),
};

// 康复进度
export const recoveryAPI = {
  getProgress: (patientId) => api.get(`/recovery-progress/${patientId}`),
};

export default api;
