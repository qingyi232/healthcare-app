import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI, painAPI } from '../../api'
import BottomNav from '../../components/BottomNav'
import { Home, Users, MessageCircle, User, Search, ChevronRight, Bed, Building, AlertTriangle, Activity } from 'lucide-react'

const navItems = [
  { path: '/nurse', label: '首页', icon: <Home size={22} /> },
  { path: '/nurse/patients', label: '患者', icon: <Users size={22} /> },
  { path: '/nurse/alerts', label: '预警', icon: <AlertTriangle size={22} /> },
  { path: '/nurse/messages', label: '消息', icon: <MessageCircle size={22} /> },
  { path: '/nurse/profile', label: '我的', icon: <User size={22} /> },
]

export default function NursePatients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [searchKey, setSearchKey] = useState('')
  const [painMap, setPainMap] = useState({})

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const res = await authAPI.getPatients()
      if (res.code === 200) {
        setPatients(res.data)
        const map = {}
        for (const p of res.data) {
          try {
            const pr = await painAPI.getLatest(p.id)
            if (pr.code === 200 && pr.data) map[p.id] = pr.data.score
          } catch {}
        }
        setPainMap(map)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getScoreLevel = (score) => {
    if (score === undefined || score === null) return { color: 'bg-gray-100 text-gray-400', label: '未评' }
    if (score >= 7) return { color: 'bg-red-100 text-red-600', label: '高危' }
    if (score >= 4) return { color: 'bg-amber-100 text-amber-600', label: '注意' }
    return { color: 'bg-green-100 text-green-600', label: '平稳' }
  }

  const filtered = patients.filter(p =>
    p.name.includes(searchKey) || p.department?.includes(searchKey) || p.bed_number?.includes(searchKey)
  )

  return (
    <div className="page-container bg-gray-50/50">
      <div className="bg-white px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-gray-800">患者管理</h1>
        <p className="text-xs text-gray-400 mt-0.5">共 {patients.length} 位患者</p>

        <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-gray-300" />
          <input
            type="text"
            placeholder="搜索患者姓名、科室、床位..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-300"
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 fade-in">
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/nurse/patient/${p.id}`)}
            className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
              <span className="text-base font-semibold text-primary-600">{p.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-800">{p.name}</h4>
                <span className="text-[10px] text-gray-400">{p.gender} · {p.age}岁</span>
                {(() => {
                  const sl = getScoreLevel(painMap[p.id])
                  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sl.color}`}>{sl.label}</span>
                })()}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Building size={10} /> {p.department}
                </span>
                {p.ward && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Bed size={10} /> {p.ward} {p.bed_number}
                  </span>
                )}
                {painMap[p.id] !== undefined && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    <Activity size={10} /> 疼痛:{painMap[p.id]}分
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        ))}
      </div>

      <BottomNav items={navItems} />
    </div>
  )
}
