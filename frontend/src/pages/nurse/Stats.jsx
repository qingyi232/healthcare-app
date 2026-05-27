import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { statsAPI } from '../../api'
import { ArrowLeft, Activity, AlertTriangle, Calendar, Heart, TrendingUp, Users } from 'lucide-react'

export default function NurseStats() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [trend, setTrend] = useState([])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [statsRes, trendRes] = await Promise.all([
        statsAPI.getAll(),
        statsAPI.getTrend(),
      ])
      if (statsRes.code === 200) setStats(statsRes.data)
      if (trendRes.code === 200) setTrend(trendRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  if (!stats) return <div className="min-h-screen flex items-center justify-center"><p className="text-sm text-gray-400">加载中...</p></div>

  const cards = [
    { label: '科室疼痛控制合格率', value: `${stats.controlRate}%`, sub: '评分≤3分占比', icon: <Activity size={20} className="text-primary-500" />, color: 'bg-primary-50', trend: '+2.3%' },
    { label: '不良反应发生率', value: `${stats.totalPatients > 0 ? Math.round(stats.reactionCount / stats.totalPatients * 100) : 0}%`, sub: `共${stats.reactionCount}例`, icon: <AlertTriangle size={20} className="text-amber-500" />, color: 'bg-amber-50', trend: '-1.2%' },
    { label: '平均住院日', value: `${stats.avgStayDays}天`, sub: '科室平均值', icon: <Calendar size={20} className="text-blue-500" />, color: 'bg-blue-50', trend: '-0.3天' },
    { label: '患者满意度', value: `${stats.satisfaction}%`, sub: '本月数据', icon: <Heart size={20} className="text-red-400" />, color: 'bg-red-50', trend: '+1.5%' },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white px-4 pt-10 pb-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-800">数据统计中心</h2>
      </div>

      <div className="px-4 py-4 space-y-4 fade-in">
        {/* 顶部概览 */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-400 rounded-2xl p-5 text-white">
          <p className="text-xs text-white/70">科室概况</p>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalPatients}</p>
              <p className="text-[10px] text-white/60">在院患者</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.avgPain}</p>
              <p className="text-[10px] text-white/60">平均疼痛分</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.reactionCount}</p>
              <p className="text-[10px] text-white/60">不良反应数</p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center flex-shrink-0`}>{c.icon}</div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400">{c.label}</p>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{c.value}</p>
              <p className="text-[10px] text-gray-400">{c.sub}</p>
            </div>
            <div className="flex items-center gap-1 text-green-500">
              <TrendingUp size={12} />
              <span className="text-xs">{c.trend}</span>
            </div>
          </div>
        ))}

        {/* 疼痛控制趋势图(真实数据) */}
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h4 className="text-sm font-medium text-gray-800 mb-3">本周疼痛控制合格率趋势</h4>
          {trend.length > 0 ? (
          <svg viewBox="0 0 280 120" className="w-full">
            {[20,40,60,80,100].map(v => (
              <g key={v}>
                <line x1="30" y1={100-v} x2="260" y2={100-v} stroke="#f0f0f0" strokeWidth="0.5" />
                <text x="24" y={103-v} textAnchor="end" fill="#aaa" fontSize="7">{v}%</text>
              </g>
            ))}
            <polyline
              points={trend.map((d,i)=>`${30+i*38},${100-d.controlRate}`).join(' ')}
              fill="none" stroke="#05C8AC" strokeWidth="2" strokeLinejoin="round" />
            <path d={`${trend.map((d,i)=>`${i===0?'M':'L'}${30+i*38},${100-d.controlRate}`).join(' ')} L${30+(trend.length-1)*38},100 L30,100 Z`} fill="url(#sg)" opacity="0.2" />
            {trend.map((d,i)=>(
              <g key={i}>
                <circle cx={30+i*38} cy={100-d.controlRate} r="3" fill="#05C8AC" />
                <text x={30+i*38} y={95-d.controlRate} textAnchor="middle" fill="#05C8AC" fontSize="7" fontWeight="bold">{d.controlRate}%</text>
                <text x={30+i*38} y="115" textAnchor="middle" fill="#aaa" fontSize="7">{d.dayName}</text>
              </g>
            ))}
            <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#05C8AC" stopOpacity="0.4"/><stop offset="100%" stopColor="#05C8AC" stopOpacity="0"/></linearGradient></defs>
          </svg>
          ) : <p className="text-xs text-gray-400 text-center py-8">暂无趋势数据</p>}
        </div>
      </div>
    </div>
  )
}
