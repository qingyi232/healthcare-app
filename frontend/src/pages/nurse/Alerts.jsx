import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { nurseAlertAPI } from '../../api'
import BottomNav from '../../components/BottomNav'
import { Home, Users, MessageCircle, User, AlertTriangle, Activity, Clock, Wind, ThermometerSun, ChevronRight } from 'lucide-react'

const navItems = [
  { path: '/nurse', label: '首页', icon: <Home size={22} /> },
  { path: '/nurse/patients', label: '患者', icon: <Users size={22} /> },
  { path: '/nurse/alerts', label: '预警', icon: <AlertTriangle size={22} /> },
  { path: '/nurse/messages', label: '消息', icon: <MessageCircle size={22} /> },
  { path: '/nurse/profile', label: '我的', icon: <User size={22} /> },
]

export default function NurseAlerts() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [handled, setHandled] = useState({})
  const [toast, setToast] = useState('')
  const [alerts, setAlerts] = useState([])

  useEffect(() => { loadAlerts() }, [])

  const loadAlerts = async () => {
    try {
      const res = await nurseAlertAPI.getAll()
      if (res.code === 200) setAlerts(res.data)
    } catch (err) { console.error(err) }
  }

  const handleAlert = (id) => {
    setHandled(prev => ({ ...prev, [id]: true }))
    setToast('预警已处理')
    setTimeout(() => setToast(''), 2000)
  }

  const filtered = (filter === 'all' ? alerts : alerts.filter(a => a.level === filter)).filter(a => !handled[a.id])

  const getLevelStyle = (level) => {
    switch (level) {
      case 'danger': return 'border-l-4 border-red-500'
      case 'warning': return 'border-l-4 border-amber-400'
      case 'caution': return 'border-l-4 border-yellow-300'
      default: return ''
    }
  }

  return (
    <div className="page-container bg-gray-50/50">
      <div className="bg-white px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-gray-800">智能预警中心</h1>
        <p className="text-xs text-gray-400 mt-0.5">实时监控患者异常情况</p>

        {/* 统计概览 */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-red-500">{alerts.filter(a=>a.level==='danger'&&!handled[a.id]).length}</p>
            <p className="text-[10px] text-red-400">高危预警</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-amber-500">{alerts.filter(a=>a.level==='warning'&&!handled[a.id]).length}</p>
            <p className="text-[10px] text-amber-400">注意预警</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-500">{alerts.filter(a=>a.level==='caution'&&!handled[a.id]).length}</p>
            <p className="text-[10px] text-green-400">一般提醒</p>
          </div>
        </div>

        <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
          {['all','danger','warning','caution'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${filter===f?'bg-white text-primary-600 shadow-sm':'text-gray-500'}`}
            >
              {{all:'全部',danger:'高危',warning:'注意',caution:'一般'}[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 fade-in">
        {filtered.map(a => (
          <div key={a.id} className={`bg-white rounded-2xl p-4 card-shadow ${getLevelStyle(a.level)}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                {a.type==='pain_high'?<Activity size={18} className={a.level==='danger'?'text-red-500':'text-amber-500'}/>:a.type==='no_assessment'?<Clock size={18} className="text-amber-500"/>:a.type==='adverse'?<ThermometerSun size={18} className="text-orange-500"/>:<AlertTriangle size={18} className="text-gray-400"/>}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-800">{a.patient}</h4>
                  <span className="text-[10px] text-gray-400">{a.time}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded">{a.department}</span>
                  <span className="text-[10px] text-gray-400">{a.bed}床</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={()=>navigate(`/nurse/patient/${a.patient_id}`)} className="flex-1 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-[11px] font-medium">查看患者</button>
                  <button onClick={()=>handleAlert(a.id)} className="flex-1 py-1.5 bg-green-50 text-green-600 rounded-lg text-[11px] font-medium">已处理</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 slide-up">
          {toast}
        </div>
      )}

      <BottomNav items={navItems} />
    </div>
  )
}
