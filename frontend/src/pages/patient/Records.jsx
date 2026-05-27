import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { recordAPI, painAPI, medicationAPI, pcaAPI, selfRatingAPI } from '../../api'
import BottomNav from '../../components/BottomNav'
import { Home, ClipboardList, MessageCircle, User, FileText, Activity, ChevronRight, Calendar, Stethoscope, Pill, Heart, Gauge, ThumbsUp } from 'lucide-react'

const navItems = [
  { path: '/patient', label: '首页', icon: <Home size={22} /> },
  { path: '/patient/records', label: '镇痛', icon: <Activity size={22} /> },
  { path: '/patient/recovery', label: '康复', icon: <Heart size={22} /> },
  { path: '/patient/consultation', label: '消息', icon: <MessageCircle size={22} /> },
  { path: '/patient/profile', label: '我的', icon: <User size={22} /> },
]

export default function PatientRecords() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [activeTab, setActiveTab] = useState('pain')
  const [records, setRecords] = useState([])
  const [painScores, setPainScores] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [medications, setMedications] = useState([])
  const [selfRating, setSelfRating] = useState(1)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [pcaData, setPcaData] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [recordRes, painRes, medRes, pcaRes, ratingRes] = await Promise.all([
        recordAPI.getList(user.id),
        painAPI.getScores(user.id),
        medicationAPI.getList(user.id),
        pcaAPI.getStatus(user.id),
        selfRatingAPI.getList(user.id),
      ])
      if (recordRes.code === 200) setRecords(recordRes.data)
      if (painRes.code === 200) setPainScores(painRes.data)
      if (medRes.code === 200) setMedications(medRes.data)
      if (pcaRes.code === 200) setPcaData(pcaRes.data)
      if (ratingRes.code === 200 && ratingRes.data.length > 0) {
        setSelfRating(ratingRes.data[0].rating)
        setRatingSubmitted(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const submitSelfRating = async () => {
    try {
      const res = await selfRatingAPI.submit({ patient_id: user.id, rating: selfRating })
      if (res.code === 200) setRatingSubmitted(true)
    } catch (err) { console.error(err) }
  }

  const handlePcaPress = async () => {
    try {
      const res = await pcaAPI.press(user.id)
      if (res.code === 200) setPcaData(res.data)
    } catch (err) { console.error(err) }
  }

  const getRecordIcon = (type) => {
    switch (type) {
      case 'admission': return <FileText size={18} className="text-blue-500" />
      case 'surgery': return <Stethoscope size={18} className="text-red-500" />
      case 'nursing': return <Activity size={18} className="text-green-500" />
      case 'examination': return <ClipboardList size={18} className="text-purple-500" />
      default: return <FileText size={18} className="text-gray-500" />
    }
  }

  const getRecordTypeName = (type) => {
    const map = { admission: '入院记录', surgery: '手术记录', nursing: '护理记录', examination: '检查报告', general: '一般记录' }
    return map[type] || '记录'
  }

  const getScoreColor = (score) => {
    if (score <= 3) return 'bg-green-100 text-green-600'
    if (score <= 6) return 'bg-amber-100 text-amber-600'
    return 'bg-red-100 text-red-600'
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="page-container bg-gray-50/50">
      {/* 顶部 */}
      <div className="bg-white px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-gray-800">镇痛管理</h1>
        <p className="text-xs text-gray-400 mt-0.5">疼痛记录、用药与PCA泵状态</p>
        
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
          {['pain','medication','pca','records'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {{pain:'疼痛曲线',medication:'用药记录',pca:'PCA泵',records:'诊疗记录'}[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 fade-in">
        {/* 用药记录 tab */}
        {activeTab === 'medication' && (
          medications.length > 0 ? medications.map(m => (
            <div key={m.id} className="bg-white rounded-2xl p-4 card-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Pill size={18} className="text-orange-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800">{m.medication_name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{m.dosage} · {m.frequency}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded">
                      {{oral:'口服',injection:'注射',inhalation:'雾化吸入',sublingual:'舌下含服'}[m.route]||m.route}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.status==='active'?'bg-green-50 text-green-500':'bg-gray-50 text-gray-400'}`}>
                      {m.status==='active'?'使用中':'已停用'}
                    </span>
                    <span className="text-[10px] text-gray-400">{m.start_date}起</span>
                  </div>
                </div>
              </div>
            </div>
          )) : <div className="text-center py-16"><Pill size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">暂无用药记录</p></div>
        )}

        {/* PCA泵状态 tab */}
        {activeTab === 'pca' && (
          <div className="space-y-3">
            {pcaData ? (
            <div className="bg-white rounded-2xl p-5 card-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Gauge size={24} className="text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">PCA镇痛泵</h4>
                  <p className={`text-xs font-medium ${pcaData.status==='running'?'text-green-500':'text-gray-400'}`}>• {pcaData.status==='running'?'正常运行中':'已停止'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:'药物名称',value:pcaData.drug_name},
                  {label:'背景剂量',value:pcaData.background_dose},
                  {label:'单次剂量',value:pcaData.bolus_dose},
                  {label:'锁定时间',value:pcaData.lock_time},
                  {label:'今日按压次数',value:`${pcaData.press_count}次`},
                  {label:'剩余药量',value:`${pcaData.remaining_ml}ml`},
                ].map((p,i)=>(
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400">{p.label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{p.value}</p>
                  </div>
                ))}
              </div>
              <button onClick={handlePcaPress} className="w-full mt-3 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-medium">模拟按压PCA泵（+1次）</button>
            </div>
            ) : (
            <div className="text-center py-16"><Gauge size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">当前无PCA泵记录</p></div>
            )}
            <div className="bg-white rounded-2xl p-4 card-shadow">
              <h4 className="text-sm font-medium text-gray-800 mb-3">镇痛效果自评</h4>
              <div className="space-y-2">
                {['非常满意','比较满意','一般','不太满意'].map((l,i)=>(
                  <button key={i} onClick={()=>{setSelfRating(i);setRatingSubmitted(false)}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${selfRating===i?'bg-primary-50 ring-1 ring-primary-200':'bg-gray-50'}`}>
                    <ThumbsUp size={14} className={selfRating===i?'text-primary-500':'text-gray-300'} />
                    <span className={`text-xs ${selfRating===i?'text-primary-600 font-medium':'text-gray-500'}`}>{l}</span>
                    {selfRating===i && <span className="ml-auto text-[10px] text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">已选</span>}
                  </button>
                ))}
              </div>
              <button onClick={submitSelfRating} className={`w-full mt-3 py-2.5 rounded-xl text-xs font-medium transition-all ${ratingSubmitted?'bg-green-50 text-green-600':'bg-primary-500 text-white'}`}>
                {ratingSubmitted?'✓ 已提交评价':'提交自评'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'records' ? (
          records.length > 0 ? records.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedRecord(selectedRecord?.id === r.id ? null : r)}
              className="bg-white rounded-2xl p-4 card-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {getRecordIcon(r.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-800">{r.title}</h4>
                    <span className="text-[10px] text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
                      {getRecordTypeName(r.type)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{r.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar size={10} /> {formatDate(r.created_at)}
                    </span>
                    {r.nurse_name && (
                      <span className="text-[10px] text-gray-400">
                        {r.nurse_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedRecord?.id === r.id && (
                <div className="mt-3 pt-3 border-t border-gray-50 space-y-2 slide-up">
                  {r.diagnosis && (
                    <div>
                      <p className="text-[10px] text-gray-400">诊断</p>
                      <p className="text-xs text-gray-700">{r.diagnosis}</p>
                    </div>
                  )}
                  {r.treatment && (
                    <div>
                      <p className="text-[10px] text-gray-400">治疗方案</p>
                      <p className="text-xs text-gray-700">{r.treatment}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-16">
              <FileText size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">暂无诊疗记录</p>
            </div>
          )
        ) : activeTab === 'pain' ? (
          painScores.length > 0 ? (
            <>
              {/* 疼痛趋势SVG折线图 */}
              <div className="bg-white rounded-2xl p-4 card-shadow">
                <h4 className="text-sm font-medium text-gray-800 mb-3">疼痛趋势</h4>
                {(() => {
                  const data = painScores.slice(0, 7).reverse()
                  const W = 280, H = 120, PX = 30, PY = 10
                  const chartW = W - PX * 2, chartH = H - PY * 2
                  const stepX = data.length > 1 ? chartW / (data.length - 1) : 0
                  const points = data.map((s, i) => ({
                    x: PX + i * stepX,
                    y: PY + chartH - (s.score / 10) * chartH,
                    score: s.score,
                    date: new Date(s.recorded_at),
                  }))
                  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
                  const area = points.length > 1
                    ? `M${points[0].x},${PY + chartH} L${points.map(p => `${p.x},${p.y}`).join(' L')} L${points[points.length-1].x},${PY + chartH} Z`
                    : ''
                  return (
                    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
                      {/* Y轴刻度线 */}
                      {[0, 2, 4, 6, 8, 10].map(v => {
                        const y = PY + chartH - (v / 10) * chartH
                        return (
                          <g key={v}>
                            <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="#f0f0f0" strokeWidth="0.5" />
                            <text x={PX - 6} y={y + 3} textAnchor="end" fill="#aaa" fontSize="8">{v}</text>
                          </g>
                        )
                      })}
                      {/* 填充区域 */}
                      {area && <path d={area} fill="url(#painGrad)" opacity="0.3" />}
                      {/* 折线 */}
                      {points.length > 1 && <polyline points={polyline} fill="none" stroke="#05C8AC" strokeWidth="2" strokeLinejoin="round" />}
                      {/* 数据点 */}
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill={p.score <= 3 ? '#22c55e' : p.score <= 6 ? '#eab308' : '#ef4444'} stroke="white" strokeWidth="2" />
                          <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#555" fontSize="8" fontWeight="600">{p.score}</text>
                          <text x={p.x} y={H + 14} textAnchor="middle" fill="#aaa" fontSize="7">
                            {`${p.date.getMonth() + 1}/${p.date.getDate()}`}
                          </text>
                        </g>
                      ))}
                      <defs>
                        <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#05C8AC" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#05C8AC" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )
                })()}
              </div>
              
              {painScores.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getScoreColor(s.score)}`}>
                    <span className="text-lg font-bold">{s.score}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-700">{s.description || '疼痛评分记录'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {s.body_part && <span className="text-[10px] text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded">{s.body_part}</span>}
                      <span className="text-[10px] text-gray-400">{formatDate(s.recorded_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-16">
              <Activity size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">暂无疼痛记录</p>
            </div>
          )
        ) : null}
      </div>

      <BottomNav items={navItems} />
    </div>
  )
}
