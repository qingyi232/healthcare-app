import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskAPI, messageAPI } from '../../api'
import BottomNav from '../../components/BottomNav'
import { Home, Users, MessageCircle, User, ChevronRight, LogOut, ClipboardList, Bell, Settings, Shield, Phone, Award, AlertTriangle, BarChart3, Pill } from 'lucide-react'

const navItems = [
  { path: '/nurse', label: '首页', icon: <Home size={22} /> },
  { path: '/nurse/patients', label: '患者', icon: <Users size={22} /> },
  { path: '/nurse/alerts', label: '预警', icon: <AlertTriangle size={22} /> },
  { path: '/nurse/messages', label: '消息', icon: <MessageCircle size={22} /> },
  { path: '/nurse/profile', label: '我的', icon: <User size={22} /> },
]

export default function NurseProfile() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [stats, setStats] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, unreadRes] = await Promise.all([
        taskAPI.getStats(user.id),
        messageAPI.getUnreadCount(),
      ])
      if (statsRes.code === 200) setStats(statsRes.data)
      if (unreadRes.code === 200) setUnreadCount(unreadRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const menuItems = [
    { icon: <Users size={18} className="text-primary-500" />, label: '患者管理', desc: '查看和管理患者信息', path: '/nurse/patients' },
    { icon: <AlertTriangle size={18} className="text-red-500" />, label: '智能预警', desc: '实时监控异常情况', path: '/nurse/alerts' },
    { icon: <Pill size={18} className="text-orange-500" />, label: '镇痛方案', desc: '查看和管理镇痛方案', path: '/nurse/pain-plans' },
    { icon: <BarChart3 size={18} className="text-blue-500" />, label: '数据统计', desc: '科室数据分析报告', path: '/nurse/stats' },
    { icon: <Bell size={18} className="text-amber-500" />, label: '消息中心', desc: unreadCount > 0 ? `${unreadCount}条未读` : '暂无新消息', path: '/nurse/messages', badge: unreadCount },
    { icon: <Settings size={18} className="text-gray-500" />, label: '系统设置', desc: '账号、提醒规则、数据导出', path: '/nurse/settings' },
  ]

  return (
    <div className="page-container bg-gray-50/50">
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-5 pt-14 pb-8 rounded-b-[28px]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{user.name?.[0]}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{user.name}</h2>
            <p className="text-xs text-white/70 mt-0.5">{user.title} · {user.department}</p>
            <p className="text-xs text-white/50 mt-0.5 flex items-center gap-1">
              <Award size={12} /> 工号: {user.id.toString().padStart(5, '0')}
            </p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{stats.total}</p>
              <p className="text-[10px] text-white/60">总任务</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-300">{stats.pending}</p>
              <p className="text-[10px] text-white/60">待处理</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green-300">{stats.completed}</p>
              <p className="text-[10px] text-white/60">已完成</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-3 fade-in">
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-gray-700">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                {item.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl card-shadow py-3.5 text-sm text-red-500 font-medium flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>

      <BottomNav items={navItems} />
    </div>
  )
}
