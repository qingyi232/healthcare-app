const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // 获取用户的消息列表（聊天列表）
  router.get('/conversations', authMiddleware, (req, res) => {
    const userId = req.user.id;
    // 先取所有相关消息，按时间倒序
    const allMsgs = db.prepare(`
      SELECT m.*, 
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_id
      FROM messages m
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at DESC
    `).all(userId, userId, userId);

    // JS端去重，保留每个会话最新一条
    const convMap = new Map();
    for (const msg of allMsgs) {
      if (!convMap.has(msg.other_id)) {
        convMap.set(msg.other_id, msg);
      }
    }

    // 补充用户信息和未读数
    const conversations = [];
    for (const [otherId, msg] of convMap) {
      const otherUser = db.prepare('SELECT id, name, avatar, role, department, title FROM users WHERE id = ?').get(otherId);
      const unreadRow = db.prepare('SELECT COUNT(*) as count FROM messages WHERE sender_id = ? AND receiver_id = ? AND is_read = 0').get(otherId, userId);
      if (otherUser) {
        conversations.push({
          other_id: otherId,
          other_name: otherUser.name,
          other_avatar: otherUser.avatar,
          other_role: otherUser.role,
          other_department: otherUser.department,
          other_title: otherUser.title,
          last_message: msg.content,
          last_time: msg.created_at,
          unread_count: unreadRow ? unreadRow.count : 0,
        });
      }
    }
    
    res.json({ code: 200, data: conversations });
  });

  // 获取与某人的聊天记录
  router.get('/chat/:otherId', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const otherId = req.params.otherId;
    const messages = db.prepare(`
      SELECT m.*, 
             s.name as sender_name, s.avatar as sender_avatar,
             r.name as receiver_name
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `).all(userId, otherId, otherId, userId);
    
    // 标记为已读
    db.prepare(`
      UPDATE messages SET is_read = 1 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(otherId, userId);
    
    res.json({ code: 200, data: messages });
  });

  // 发送消息
  router.post('/send', authMiddleware, (req, res) => {
    const { receiver_id, content, type } = req.body;
    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, type)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, receiver_id, content, type || 'text');
    const msg = db.prepare(`
      SELECT m.*, s.name as sender_name FROM messages m
      JOIN users s ON m.sender_id = s.id WHERE m.id = ?
    `).get(result.lastInsertRowid);
    res.json({ code: 200, message: '发送成功', data: msg });
  });

  // 未读消息数量
  router.get('/unread-count', authMiddleware, (req, res) => {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM messages 
      WHERE receiver_id = ? AND is_read = 0
    `).get(req.user.id);
    res.json({ code: 200, data: result ? result.count : 0 });
  });

  return router;
};
