import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskAPI, authAPI, messageAPI } from '../../api'
import BottomNav from '../../components/BottomNav'
import { Home, Users, MessageCircle, User, Bell, CheckCircle2, Clock, AlertCircle, ChevronRight, Activity, ClipboardList, Stethoscope, FileText, AlertTriangle, BarChart3, Pill, Settings } from 'lucide-react'

const navItems = [
  { path: '/nurse', label: '首页', icon: <Home size={22} /> },
  { path: '/nurse/patients', label: '患者', icon: <Users size={22} /> },
  { path: '/nurse/alerts', label: '预警', icon: <AlertTriangle size={22} /> },
  { path: '/nurse/messages', label: '消息', icon: <MessageCircle size={22} /> },
  { path: '/nurse/profile', label: '我的', icon: <User size={22} /> },
]

export default function NurseHome() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [taskRes, statsRes, unreadRes] = await Promise.all([
        taskAPI.getNurseTasks(user.id),
        taskAPI.getStats(user.id),
        messageAPI.getUnreadCount(),
      ])
      if (taskRes.code === 200) setTasks(taskRes.data)
      if (statsRes.code === 200) setStats(statsRes.data)
      if (unreadRes.code === 200) setUnreadCount(unreadRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const updateTaskStatus = async (taskId, status) => {
    try {
      await taskAPI.updateStatus(taskId, status)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const getTimeGreeting = () => {
    const h = new Date().getHours()
    if (h < 9) return '早上好'
    if (h < 12) return '上午好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    return '晚上好'
  }

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-100 text-orange-600'
      case 'normal': return 'bg-blue-50 text-blue-500'
      case 'low': return 'bg-gray-50 text-gray-500'
      default: return 'bg-gray-50 text-gray-500'
    }
  }

  const getPriorityLabel = (priority) => {
    const map = { urgent: '紧急', high: '高', normal: '普通', low: '低' }
    return map[priority] || '普通'
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="page-container bg-gray-50/50">
      {/* 顶部 */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-400 to-primary-600 px-5 pt-12 pb-6 rounded-b-[28px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/80 text-xs">{getTimeGreeting()}</p>
              <h2 className="text-white text-lg font-semibold mt-0.5">{user.name}</h2>
              <p className="text-white/60 text-[11px] mt-0.5">{user.title} · {user.department}</p>
            </div>
            <button 
              onClick={() => navigate('/nurse/messages')}
              className="relative w-10 h-10 bg-white/15 backdrop-blur rounded-full flex items-center justify-center"
            >
              <Bell size={20} className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* 统计卡片 */}
          {stats && (
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-white">{stats.total}</p>
                <p className="text-[10px] text-white/60">全部任务</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-300">{stats.pending}</p>
                <p className="text-[10px] text-white/60">待处理</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-300">{stats.in_progress}</p>
                <p className="text-[10px] text-white/60">进行中</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-green-300">{stats.completed}</p>
                <p className="text-[10px] text-white/60">已完成</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4 fade-in">
        {/* 快捷功能 */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">工作台</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: <Users size={22} className="text-primary-500" />, label: '患者管理', path: '/nurse/patients' },
              { icon: <AlertTriangle size={22} className="text-red-500" />, label: '智能预警', path: '/nurse/alerts' },
              { icon: <Pill size={22} className="text-orange-500" />, label: '镇痛方案', path: '/nurse/pain-plans' },
              { icon: <BarChart3 size={22} className="text-blue-500" />, label: '数据统计', path: '/nurse/stats' },
              { icon: <Activity size={22} className="text-green-500" />, label: '疼痛评估', path: '/nurse/patients' },
              { icon: <ClipboardList size={22} className="text-indigo-500" />, label: '护理记录', path: '/nurse/patients' },
              { icon: <MessageCircle size={22} className="text-teal-500" />, label: '消息中心', path: '/nurse/messages' },
              { icon: <Settings size={22} className="text-gray-500" />, label: '系统设置', path: '/nurse/settings' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-[11px] text-gray-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 今日任务 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">今日护理任务</h3>
            <span className="text-[10px] text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
              {pendingTasks.length}项待完成
            </span>
          </div>

          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getPriorityStyle(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                    <span className="text-xs text-gray-400">{task.scheduled_time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800">{task.title}</h4>
                    {task.content && <p className="text-xs text-gray-500 mt-1">{task.content}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded">
                        {task.patient_name}
                      </span>
                      {task.bed_number && (
                        <span className="text-[10px] text-gray-400">
                          {task.ward} {task.bed_number}床
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => updateTaskStatus(task.id, task.status === 'pending' ? 'in_progress' : 'completed')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-medium ${
                      task.status === 'in_progress'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-primary-50 text-primary-600'
                    }`}
                  >
                    {task.status === 'in_progress' ? '完成' : '开始'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 已完成 */}
        {completedTasks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-500" />
              已完成 ({completedTasks.length})
            </h3>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-xl p-3 card-shadow opacity-60 flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 line-through">{task.title}</p>
                    <span className="text-[10px] text-gray-400">{task.patient_name} · {task.scheduled_time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banner */}
        <div className="rounded-2xl overflow-hidden card-shadow mb-4">
          <img
            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&h=200&fit=crop"
            alt="医疗团队"
            className="w-full h-28 object-cover"
          />
          <div className="bg-white p-4">
            <p className="text-sm font-medium text-gray-700">规范护理操作</p>
            <p className="text-xs text-gray-400 mt-1">严格遵守护理操作规程，保障患者安全...</p>
          </div>
        </div>
      </div>

      <BottomNav items={navItems} />
    </div>
  )
}
