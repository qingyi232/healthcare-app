import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI, profileAPI, messageAPI } from '../../api'
import BottomNav from '../../components/BottomNav'
import { Home, ClipboardList, MessageCircle, User, ChevronRight, LogOut, FileText, Bell, Settings, Heart, Phone, Shield, Activity } from 'lucide-react'

const navItems = [
  { path: '/patient', label: '首页', icon: <Home size={22} /> },
  { path: '/patient/records', label: '镇痛', icon: <Activity size={22} /> },
  { path: '/patient/recovery', label: '康复', icon: <Heart size={22} /> },
  { path: '/patient/consultation', label: '消息', icon: <MessageCircle size={22} /> },
  { path: '/patient/profile', label: '我的', icon: <User size={22} /> },
]

export default function PatientProfile() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [profile, setProfile] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [profileRes, unreadRes] = await Promise.all([
        profileAPI.get(user.id),
        messageAPI.getUnreadCount(),
      ])
      if (profileRes.code === 200) setProfile(profileRes.data)
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
    { icon: <FileText size={18} className="text-blue-500" />, label: '健康档案', desc: '查看个人健康信息', path: '/patient/archive' },
    { icon: <ClipboardList size={18} className="text-green-500" />, label: '诊疗记录', desc: '查看历史诊疗', path: '/patient/records' },
    { icon: <Bell size={18} className="text-amber-500" />, label: '消息中心', desc: unreadCount > 0 ? `${unreadCount}条未读` : '暂无新消息', path: '/patient/consultation', badge: unreadCount },
    { icon: <Heart size={18} className="text-red-400" />, label: '疼痛记录', desc: '查看疼痛评分历史', path: '/patient/records' },
    { icon: <Phone size={18} className="text-teal-500" />, label: '联系医护', desc: '与医护人员沟通', path: '/patient/consultation' },
  ]

  return (
    <div className="page-container bg-gray-50/50">
      {/* 个人信息卡片 */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-5 pt-14 pb-8 rounded-b-[28px]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{user.name?.[0]}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{user.name}</h2>
            <p className="text-xs text-white/70 mt-0.5">{user.department} · {user.gender} · {user.age}岁</p>
            {profile && (
              <p className="text-xs text-white/50 mt-0.5">{profile.ward} · {profile.bed_number}床</p>
            )}
          </div>
        </div>

        {profile && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{profile.blood_type || '-'}</p>
              <p className="text-[10px] text-white/60">血型</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{profile.height || '-'}</p>
              <p className="text-[10px] text-white/60">身高(cm)</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{profile.weight || '-'}</p>
              <p className="text-[10px] text-white/60">体重(kg)</p>
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
