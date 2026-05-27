import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { messageAPI, consultAPI, authAPI, notificationAPI } from '../../api'
import BottomNav from '../../components/BottomNav'
import { Home, ClipboardList, MessageCircle, User, Search, ChevronRight, Phone, Clock, CheckCircle, Circle, AlertCircle, Plus, X, Activity, Heart, Bell, Megaphone } from 'lucide-react'

const navItems = [
  { path: '/patient', label: '首页', icon: <Home size={22} /> },
  { path: '/patient/records', label: '镇痛', icon: <Activity size={22} /> },
  { path: '/patient/recovery', label: '康复', icon: <Heart size={22} /> },
  { path: '/patient/consultation', label: '消息', icon: <MessageCircle size={22} /> },
  { path: '/patient/profile', label: '我的', icon: <User size={22} /> },
]

export default function PatientConsultation() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('messages')
  const [conversations, setConversations] = useState([])
  const [consultations, setConsultations] = useState([])
  const [staffList, setStaffList] = useState([])
  const [alerts, setAlerts] = useState([])
  const [recoveryPush, setRecoveryPush] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ nurse_id: '', title: '', description: '' })

  useEffect(() => {
    loadData()
  }, [])

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const loadData = async () => {
    try {
      const [convRes, consultRes, staffRes, alertRes, recoveryRes] = await Promise.all([
        messageAPI.getConversations(),
        consultAPI.getList(),
        authAPI.getStaff(),
        notificationAPI.getAlerts(user.id),
        notificationAPI.getRecovery(user.id),
      ])
      if (convRes.code === 200) setConversations(convRes.data)
      if (consultRes.code === 200) setConsultations(consultRes.data)
      if (staffRes.code === 200) setStaffList(staffRes.data)
      if (alertRes.code === 200) setAlerts(alertRes.data)
      if (recoveryRes.code === 200) setRecoveryPush(recoveryRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const submitConsultation = async () => {
    if (!formData.title.trim()) return
    try {
      const res = await consultAPI.create(formData)
      if (res.code === 200) {
        setShowForm(false)
        setFormData({ nurse_id: '', title: '', description: '' })
        loadData()
        setActiveTab('consult')
      }
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
        <p className="text-xs text-gray-400 mt-0.5">医护通知、预警与康复推送</p>

        <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
          {['messages','alerts','recovery','consult','staff'].map(tab=>(
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {{messages:'通知',alerts:'预警',recovery:'康复',consult:'咨询',staff:'团队'}[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 fade-in">
        {/* 预警提醒 tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {alerts.length > 0 ? alerts.map((a)=>{
              const iconMap = {assessment:<AlertCircle size={18} className="text-amber-500"/>,medication:<Clock size={18} className="text-blue-500"/>,rehab:<Bell size={18} className="text-green-500"/>,pain:<AlertCircle size={18} className="text-red-500"/>,examination:<Clock size={18} className="text-purple-500"/>};
              return (
              <div key={a.id} className="bg-white rounded-2xl p-4 card-shadow flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">{iconMap[a.sub_type]||<AlertCircle size={18} className="text-gray-400"/>}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800">{a.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{a.content}</p>
                  <span className="text-[10px] text-gray-400 mt-1 inline-block">{a.created_at}</span>
                </div>
              </div>
            )}) : <div className="text-center py-16"><AlertCircle size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">暂无预警提醒</p></div>}
          </div>
        )}

        {/* 康复推送 tab */}
        {activeTab === 'recovery' && (
          <div className="space-y-3">
            {recoveryPush.length > 0 ? recoveryPush.map((a)=>{
              const colorMap = {diet:'text-orange-500',activity:'text-blue-500',breathing:'text-teal-500',wound:'text-red-400',sleep:'text-indigo-500'};
              return (
              <div key={a.id} className="bg-white rounded-2xl p-4 card-shadow flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0"><Megaphone size={18} className={colorMap[a.sub_type]||'text-gray-400'}/></div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800">{a.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{a.content}</p>
                  <span className="text-[10px] text-gray-400 mt-1 inline-block">{a.created_at}</span>
                </div>
              </div>
            )}) : <div className="text-center py-16"><Megaphone size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">暂无康复推送</p></div>}
          </div>
        )}

        {activeTab === 'messages' && (
          conversations.length > 0 ? conversations.map((c) => (
            <div
              key={c.other_id}
              onClick={() => navigate(`/patient/chat/${c.other_id}`)}
              className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary-600">{c.other_name?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-medium text-gray-800">{c.other_name}</h4>
                    {c.other_title && <span className="text-[10px] text-gray-400">{c.other_title}</span>}
                  </div>
                  <span className="text-[10px] text-gray-400">{formatTime(c.last_time)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400 truncate flex-1">{c.last_message}</p>
                  {c.unread_count > 0 && (
                    <span className="w-4.5 h-4.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center min-w-[18px] h-[18px] ml-2">
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
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-medium text-gray-800">{c.title}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
                    {status.icon} {status.label}
                  </span>
                </div>
                {c.description && <p className="text-xs text-gray-500 mt-2">{c.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  {c.nurse_name && <span className="text-[10px] text-gray-400">{c.nurse_name} · {c.nurse_title}</span>}
                  <span className="text-[10px] text-gray-300">{formatTime(c.created_at)}</span>
                </div>
              </div>
            )
          }) : (
            <div className="text-center py-16">
              <ClipboardList size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">暂无咨询记录</p>
            </div>
          )
        )}

        {activeTab === 'staff' && (
          staffList.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/patient/chat/${s.id}`)}
              className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/personas/svg?seed=${s.name}`}
                  alt={s.name}
                  className="w-full h-full object-cover bg-primary-50"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-800">{s.name}</h4>
                  <span className="text-[10px] text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded">{s.title}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{s.department}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                  <MessageCircle size={14} className="text-primary-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新建咨询浮动按钮 */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-primary-200 z-40"
      >
        <Plus size={22} />
      </button>

      {/* 新建咨询弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-5 slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">新建咨询</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">选择医护人员</p>
                <select
                  value={formData.nurse_id}
                  onChange={(e) => setFormData(p => ({ ...p, nurse_id: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700"
                >
                  <option value="">不指定（自动分配）</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.title} ({s.department})</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">咨询标题</p>
                <input
                  type="text"
                  placeholder="请输入咨询标题"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">详细描述</p>
                <textarea
                  placeholder="请描述您的问题..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 resize-none"
                />
              </div>
              <button
                onClick={submitConsultation}
                disabled={!formData.title.trim()}
                className="w-full py-3 bg-primary-500 text-white rounded-xl text-sm font-medium disabled:opacity-40"
              >
                提交咨询
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav items={navItems} />
    </div>
  )
}
