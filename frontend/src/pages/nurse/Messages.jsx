import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { messageAPI, consultAPI } from '../../api'
import BottomNav from '../../components/BottomNav'
import { Home, Users, MessageCircle, User, Clock, CheckCircle, Circle, AlertCircle, AlertTriangle } from 'lucide-react'

const navItems = [
  { path: '/nurse', label: '首页', icon: <Home size={22} /> },
  { path: '/nurse/patients', label: '患者', icon: <Users size={22} /> },
  { path: '/nurse/alerts', label: '预警', icon: <AlertTriangle size={22} /> },
  { path: '/nurse/messages', label: '消息', icon: <MessageCircle size={22} /> },
  { path: '/nurse/profile', label: '我的', icon: <User size={22} /> },
]

export default function NurseMessages() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('messages')
  const [conversations, setConversations] = useState([])
  const [consultations, setConsultations] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [convRes, consultRes] = await Promise.all([
        messageAPI.getConversations(),
        consultAPI.getList(),
      ])
      if (convRes.code === 200) setConversations(convRes.data)
      if (consultRes.code === 200) setConsultations(consultRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const updateConsultStatus = async (id, status) => {
    try {
      await consultAPI.updateStatus(id, status)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { label: '待处理', color: 'text-amber-500 bg-amber-50', icon: <Clock size={12} /> }
      case 'in_progress': return { label: '进行中', color: 'text-blue-500 bg-blue-50', icon: <Circle size={12} /> }
      case 'resolved': return { label: '已解决', color: 'text-green-500 bg-green-50', icon: <CheckCircle size={12} /> }
      default: return { label: '已关闭', color: 'text-gray-400 bg-gray-50', icon: <AlertCircle size={12} /> }
    }
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now - d
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}分钟前`
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}小时前`
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <div className="page-container bg-gray-50/50">
      <div className="bg-white px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-gray-800">消息中心</h1>
        <p className="text-xs text-gray-400 mt-0.5">与患者在线沟通</p>

        <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'messages' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            聊天消息
          </button>
          <button
            onClick={() => setActiveTab('consult')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'consult' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            咨询工单
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 fade-in">
        {activeTab === 'messages' && (
          conversations.length > 0 ? conversations.map((c) => (
            <div
              key={c.other_id}
              onClick={() => navigate(`/nurse/chat/${c.other_id}`)}
              className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-full bg-fresh-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-green-600">{c.other_name?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-medium text-gray-800">{c.other_name}</h4>
                    <span className="text-[10px] text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded">
                      {c.other_role === 'patient' ? '患者' : '同事'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{formatTime(c.last_time)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400 truncate flex-1">{c.last_message}</p>
                  {c.unread_count > 0 && (
                    <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center ml-2">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-16">
              <MessageCircle size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">暂无消息</p>
            </div>
          )
        )}

        {activeTab === 'consult' && (
          consultations.length > 0 ? consultations.map((c) => {
            const status = getStatusInfo(c.status)
            return (
              <div key={c.id} className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-800">{c.title}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
                    {status.icon} {status.label}
                  </span>
                </div>
                {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded">
                    {c.patient_name} {c.patient_gender} {c.patient_age}岁
                  </span>
                  <span className="text-[10px] text-gray-300">{formatTime(c.created_at)}</span>
                </div>
                {c.status !== 'resolved' && c.status !== 'closed' && (
                  <div className="flex gap-2 mt-3">
                    {c.status === 'pending' && (
                      <button
                        onClick={() => updateConsultStatus(c.id, 'in_progress')}
                        className="px-3 py-1.5 bg-blue-50 text-blue-500 rounded-lg text-[10px] font-medium"
                      >
                        开始处理
                      </button>
                    )}
                    <button
                      onClick={() => updateConsultStatus(c.id, 'resolved')}
                      className="px-3 py-1.5 bg-green-50 text-green-500 rounded-lg text-[10px] font-medium"
                    >
                      标记解决
                    </button>
                  </div>
                )}
              </div>
            )
          }) : (
            <div className="text-center py-16">
              <AlertCircle size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">暂无咨询工单</p>
            </div>
          )
        )}
      </div>

      <BottomNav items={navItems} />
    </div>
  )
}
