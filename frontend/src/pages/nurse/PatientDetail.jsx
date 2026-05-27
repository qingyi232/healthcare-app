import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { profileAPI, painAPI, recordAPI, reminderAPI, taskAPI } from '../../api'
import { ArrowLeft, Activity, FileText, ClipboardList, Heart, MessageCircle, Pill, Stethoscope, Clock, Calendar, ChevronRight, AlertTriangle, Plus, X } from 'lucide-react'

export default function NursePatientDetail() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [painScores, setPainScores] = useState([])
  const [records, setRecords] = useState([])
  const [reminders, setReminders] = useState([])
  const [tasks, setTasks] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [recordForm, setRecordForm] = useState({ title: '', content: '', type: 'nursing', diagnosis: '', treatment: '' })
  const [taskForm, setTaskForm] = useState({ title: '', content: '', priority: 'normal', scheduled_time: '' })

  useEffect(() => {
    loadAll()
  }, [patientId])

  const loadAll = async () => {
    try {
      const [profileRes, painRes, recordRes, reminderRes, taskRes] = await Promise.all([
        profileAPI.get(patientId),
        painAPI.getScores(patientId),
        recordAPI.getList(patientId),
        reminderAPI.getList(patientId),
        taskAPI.getPatientTasks(patientId),
      ])
      if (profileRes.code === 200) setProfile(profileRes.data)
      if (painRes.code === 200) setPainScores(painRes.data)
      if (recordRes.code === 200) setRecords(recordRes.data)
      if (reminderRes.code === 200) setReminders(reminderRes.data)
      if (taskRes.code === 200) setTasks(taskRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const submitRecord = async () => {
    if (!recordForm.title.trim() || !recordForm.content.trim()) return
    try {
      const res = await recordAPI.create({ patient_id: parseInt(patientId), ...recordForm })
      if (res.code === 200) {
        setShowRecordForm(false)
        setRecordForm({ title: '', content: '', type: 'nursing', diagnosis: '', treatment: '' })
        loadAll()
      }
    } catch (err) { console.error(err) }
  }

  const submitTask = async () => {
    if (!taskForm.title.trim()) return
    try {
      const res = await taskAPI.create({ patient_id: parseInt(patientId), ...taskForm })
      if (res.code === 200) {
        setShowTaskForm(false)
        setTaskForm({ title: '', content: '', priority: 'normal', scheduled_time: '' })
        loadAll()
      }
    } catch (err) { console.error(err) }
  }

  const updateTaskStatus = async (taskId, status) => {
    try {
      await taskAPI.updateStatus(taskId, status)
      loadAll()
    } catch (err) { console.error(err) }
  }

  const getScoreColor = (score) => {
    if (score <= 3) return 'bg-green-100 text-green-600'
    if (score <= 6) return 'bg-amber-100 text-amber-600'
    return 'bg-red-100 text-red-600'
  }

  const getRecordTypeName = (type) => {
    const map = { admission: '入院记录', surgery: '手术记录', nursing: '护理记录', examination: '检查报告', general: '一般记录' }
    return map[type] || '记录'
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 头部 */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-4 pt-10 pb-6 rounded-b-[24px]">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="text-base font-semibold text-white">患者详情</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-xl font-bold text-white">{profile.name?.[0]}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">{profile.name}</h3>
            <p className="text-xs text-white/70">{profile.gender} · {profile.age}岁 · {profile.blood_type}</p>
            <p className="text-xs text-white/50">{profile.ward} {profile.bed_number}床 · 入院: {profile.admission_date}</p>
          </div>
          <button
            onClick={() => navigate(`/nurse/chat/${patientId}`)}
            className="w-10 h-10 bg-white/15 backdrop-blur rounded-full flex items-center justify-center"
          >
            <MessageCircle size={18} className="text-white" />
          </button>
        </div>

        {profile.allergies && profile.allergies !== '无' && (
          <div className="mt-3 flex items-center gap-2 bg-red-500/20 rounded-lg px-3 py-2">
            <AlertTriangle size={14} className="text-yellow-300" />
            <span className="text-xs text-white">过敏: {profile.allergies}</span>
          </div>
        )}
      </div>

      {/* Tab */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl card-shadow p-1 flex gap-1">
          {[
            { key: 'overview', label: '概览' },
            { key: 'records', label: '诊疗记录' },
            { key: 'pain', label: '疼痛' },
            { key: 'tasks', label: '护理任务' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.key ? 'bg-primary-50 text-primary-600' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 fade-in">
        {activeTab === 'overview' && (
          <>
            {/* 基本信息 */}
            <div className="bg-white rounded-2xl p-4 card-shadow">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">基本信息</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '科室', value: profile.department },
                  { label: '病区', value: profile.ward },
                  { label: '床位', value: profile.bed_number },
                  { label: '血型', value: profile.blood_type },
                  { label: '身高', value: `${profile.height}cm` },
                  { label: '体重', value: `${profile.weight}kg` },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400">{item.label}</p>
                    <p className="text-sm text-gray-700 font-medium">{item.value || '-'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 最新疼痛评分 */}
            {painScores.length > 0 && (
              <div className="bg-white rounded-2xl p-4 card-shadow">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">最新疼痛评分</h4>
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getScoreColor(painScores[0].score)}`}>
                    <span className="text-2xl font-bold">{painScores[0].score}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{painScores[0].description || '疼痛评分'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{painScores[0].body_part} · {formatDate(painScores[0].recorded_at)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 今日提醒 */}
            <div className="bg-white rounded-2xl p-4 card-shadow">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">今日提醒</h4>
              <div className="space-y-2">
                {reminders.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'done' ? 'bg-green-400' : 'bg-amber-400'}`} />
                    <span className="text-xs text-gray-400 w-10 flex-shrink-0">{r.remind_time}</span>
                    <span className={`text-xs flex-1 ${r.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{r.content}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 紧急联系人 */}
            <div className="bg-white rounded-2xl p-4 card-shadow">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">紧急联系人</h4>
              <p className="text-xs text-gray-600">{profile.emergency_contact}</p>
              <p className="text-xs text-gray-400">{profile.emergency_phone}</p>
            </div>
          </>
        )}

        {activeTab === 'records' && (
          <>
          <button onClick={() => setShowRecordForm(true)} className="w-full py-2.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
            <Plus size={14} /> 新增护理记录
          </button>
          {records.length > 0 ? records.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-4 card-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-800">{r.title}</h4>
                <span className="text-[10px] text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">{getRecordTypeName(r.type)}</span>
              </div>
              <p className="text-xs text-gray-500">{r.content}</p>
              {r.diagnosis && <p className="text-xs text-gray-600 mt-2">诊断: {r.diagnosis}</p>}
              {r.treatment && <p className="text-xs text-gray-600">治疗: {r.treatment}</p>}
              <p className="text-[10px] text-gray-400 mt-2">{r.nurse_name} · {formatDate(r.created_at)}</p>
            </div>
          )) : (
            <div className="text-center py-12">
              <FileText size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">暂无诊疗记录</p>
            </div>
          )}
          </>
        )}

        {activeTab === 'pain' && (
          painScores.length > 0 ? (
            <>
              <div className="bg-white rounded-2xl p-4 card-shadow">
                <h4 className="text-sm font-medium text-gray-800 mb-3">疼痛趋势</h4>
                {(() => {
                  const data = painScores.slice(0, 7).reverse()
                  const W = 280, H = 120, PX = 30, PY = 10
                  const chartW = W - PX * 2, chartH = H - PY * 2
                  const stepX = data.length > 1 ? chartW / (data.length - 1) : 0
                  const points = data.map((s, i) => ({
                    x: PX + i * stepX, y: PY + chartH - (s.score / 10) * chartH, score: s.score, date: new Date(s.recorded_at),
                  }))
                  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
                  const area = points.length > 1 ? `M${points[0].x},${PY+chartH} L${points.map(p=>`${p.x},${p.y}`).join(' L')} L${points[points.length-1].x},${PY+chartH} Z` : ''
                  return (
                    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
                      {[0,2,4,6,8,10].map(v => { const y = PY + chartH - (v/10)*chartH; return (<g key={v}><line x1={PX} y1={y} x2={W-PX} y2={y} stroke="#f0f0f0" strokeWidth="0.5"/><text x={PX-6} y={y+3} textAnchor="end" fill="#aaa" fontSize="8">{v}</text></g>) })}
                      {area && <path d={area} fill="url(#npGrad)" opacity="0.3"/>}
                      {points.length > 1 && <polyline points={polyline} fill="none" stroke="#05C8AC" strokeWidth="2" strokeLinejoin="round"/>}
                      {points.map((p,i) => (<g key={i}><circle cx={p.x} cy={p.y} r="4" fill={p.score<=3?'#22c55e':p.score<=6?'#eab308':'#ef4444'} stroke="white" strokeWidth="2"/><text x={p.x} y={p.y-8} textAnchor="middle" fill="#555" fontSize="8" fontWeight="600">{p.score}</text><text x={p.x} y={H+14} textAnchor="middle" fill="#aaa" fontSize="7">{`${p.date.getMonth()+1}/${p.date.getDate()}`}</text></g>))}
                      <defs><linearGradient id="npGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#05C8AC" stopOpacity="0.4"/><stop offset="100%" stopColor="#05C8AC" stopOpacity="0"/></linearGradient></defs>
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
            <div className="text-center py-12">
              <Activity size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">暂无疼痛记录</p>
            </div>
          )
        )}

        {activeTab === 'tasks' && (
          <>
          <button onClick={() => setShowTaskForm(true)} className="w-full py-2.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
            <Plus size={14} /> 新增护理任务
          </button>
          {tasks.length > 0 ? tasks.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-4 card-shadow">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  t.status === 'completed' ? 'bg-green-400' : t.status === 'in_progress' ? 'bg-blue-400' : 'bg-amber-400'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{t.title}</p>
                  {t.content && <p className="text-xs text-gray-400 mt-0.5">{t.content}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{t.nurse_name} · {t.scheduled_time}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  t.status === 'completed' ? 'bg-green-50 text-green-500' : t.status === 'in_progress' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'
                }`}>
                  {t.status === 'completed' ? '已完成' : t.status === 'in_progress' ? '进行中' : '待处理'}
                </span>
              </div>
              {t.status !== 'completed' && (
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-50">
                  {t.status === 'pending' && (
                    <button onClick={() => updateTaskStatus(t.id, 'in_progress')} className="px-3 py-1.5 bg-blue-50 text-blue-500 rounded-lg text-[10px] font-medium">开始执行</button>
                  )}
                  <button onClick={() => updateTaskStatus(t.id, 'completed')} className="px-3 py-1.5 bg-green-50 text-green-500 rounded-lg text-[10px] font-medium">标记完成</button>
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-12">
              <ClipboardList size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">暂无护理任务</p>
            </div>
          )}
          </>
        )}
      </div>

      {/* 新增记录弹窗 */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-5 slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">新增护理记录</h3>
              <button onClick={() => setShowRecordForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">记录类型</p>
                <select value={recordForm.type} onChange={e => setRecordForm(p => ({...p, type: e.target.value}))} className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700">
                  <option value="nursing">护理记录</option>
                  <option value="examination">检查报告</option>
                  <option value="general">一般记录</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">标题</p>
                <input type="text" placeholder="请输入标题" value={recordForm.title} onChange={e => setRecordForm(p => ({...p, title: e.target.value}))} className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">内容</p>
                <textarea rows={3} placeholder="请输入记录内容" value={recordForm.content} onChange={e => setRecordForm(p => ({...p, content: e.target.value}))} className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 resize-none" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">诊断（可选）</p>
                <input type="text" placeholder="诊断信息" value={recordForm.diagnosis} onChange={e => setRecordForm(p => ({...p, diagnosis: e.target.value}))} className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">治疗方案（可选）</p>
                <input type="text" placeholder="治疗方案" value={recordForm.treatment} onChange={e => setRecordForm(p => ({...p, treatment: e.target.value}))} className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300" />
              </div>
              <button onClick={submitRecord} disabled={!recordForm.title.trim() || !recordForm.content.trim()} className="w-full py-3 bg-primary-500 text-white rounded-xl text-sm font-medium disabled:opacity-40">提交记录</button>
            </div>
          </div>
        </div>
      )}

      {/* 新增任务弹窗 */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-5 slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">新增护理任务</h3>
              <button onClick={() => setShowTaskForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">任务标题</p>
                <input type="text" placeholder="请输入任务标题" value={taskForm.title} onChange={e => setTaskForm(p => ({...p, title: e.target.value}))} className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">任务内容</p>
                <textarea rows={2} placeholder="请输入任务详情" value={taskForm.content} onChange={e => setTaskForm(p => ({...p, content: e.target.value}))} className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 resize-none" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">优先级</p>
                <select value={taskForm.priority} onChange={e => setTaskForm(p => ({...p, priority: e.target.value}))} className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700">
                  <option value="urgent">紧急</option>
                  <option value="high">高</option>
                  <option value="normal">普通</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">计划时间</p>
                <input type="text" placeholder="如: 14:00" value={taskForm.scheduled_time} onChange={e => setTaskForm(p => ({...p, scheduled_time: e.target.value}))} className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300" />
              </div>
              <button onClick={submitTask} disabled={!taskForm.title.trim()} className="w-full py-3 bg-primary-500 text-white rounded-xl text-sm font-medium disabled:opacity-40">创建任务</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
