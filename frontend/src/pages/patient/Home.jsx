import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { painAPI, reminderAPI, messageAPI, reactionAPI, recoveryAPI } from '../../api'
import BottomNav from '../../components/BottomNav'
import { Home, ClipboardList, MessageCircle, User, Bell, FileText, Phone, Activity, Pill, Stethoscope, Clock, CheckCircle2, ChevronRight, Heart, Check, AlertTriangle, X, ShieldAlert } from 'lucide-react'

const navItems = [
  { path: '/patient', label: '首页', icon: <Home size={22} /> },
  { path: '/patient/records', label: '镇痛', icon: <Activity size={22} /> },
  { path: '/patient/recovery', label: '康复', icon: <Heart size={22} /> },
  { path: '/patient/consultation', label: '消息', icon: <MessageCircle size={22} /> },
  { path: '/patient/profile', label: '我的', icon: <User size={22} /> },
]

export default function PatientHome() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [painScore, setPainScore] = useState(null)
  const [currentScore, setCurrentScore] = useState(0)
  const [reminders, setReminders] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPainSubmit, setShowPainSubmit] = useState(false)
  const [showReactionForm, setShowReactionForm] = useState(false)
  const [reactionType, setReactionType] = useState('nausea')
  const [reactionDesc, setReactionDesc] = useState('')
  const [recoveryProgress, setRecoveryProgress] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [painRes, reminderRes, unreadRes, recoveryRes] = await Promise.all([
        painAPI.getLatest(user.id),
        reminderAPI.getList(user.id),
        messageAPI.getUnreadCount(),
        recoveryAPI.getProgress(user.id),
      ])
      if (painRes.code === 200 && painRes.data) {
        setPainScore(painRes.data)
        setCurrentScore(painRes.data.score)
      }
      if (reminderRes.code === 200) setReminders(reminderRes.data)
      if (unreadRes.code === 200) setUnreadCount(unreadRes.data)
      if (recoveryRes.code === 200) setRecoveryProgress(recoveryRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const markReminderDone = async (id) => {
    try {
      const res = await reminderAPI.updateStatus(id, 'done')
      if (res.code === 200) loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const submitReaction = async () => {
    try {
      const res = await reactionAPI.create({ type: reactionType, severity: 'moderate', description: reactionDesc })
      if (res.code === 200) { setShowReactionForm(false); setReactionDesc('') }
    } catch (err) { console.error(err) }
  }

  const submitPainScore = async () => {
    try {
      const res = await painAPI.submit({
        patient_id: user.id,
        score: currentScore,
        description: '',
        body_part: ''
      })
      if (res.code === 200) {
        setPainScore(res.data)
        setShowPainSubmit(false)
      }
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

  const getReminderIcon = (type) => {
    switch (type) {
      case 'medication': return <Pill size={16} className="text-primary-500" />
      case 'treatment': return <Stethoscope size={16} className="text-orange-500" />
      case 'examination': return <FileText size={16} className="text-blue-500" />
      case 'rehabilitation': return <Activity size={16} className="text-green-500" />
      case 'vital_signs': return <Heart size={16} className="text-red-400" />
      case 'diet': return <Clock size={16} className="text-amber-500" />
      default: return <Bell size={16} className="text-primary-500" />
    }
  }

  const getScoreColor = (score) => {
    if (score <= 3) return 'text-green-500'
    if (score <= 6) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreBarColor = (score) => {
    if (score <= 3) return 'bg-green-400'
    if (score <= 6) return 'bg-amber-400'
    return 'bg-red-400'
  }

  const pendingReminders = reminders.filter(r => r.status === 'pending')
  const doneReminders = reminders.filter(r => r.status === 'done')

  return (
    <div className="page-container bg-gray-50/50">
      {/* 顶部区域 */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-400 to-primary-600 px-5 pt-12 pb-6 rounded-b-[28px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-xs">{getTimeGreeting()}</p>
              <h2 className="text-white text-lg font-semibold mt-0.5">{user.name}</h2>
              <p className="text-white/60 text-[11px] mt-0.5">{user.department}</p>
            </div>
            <button 
              onClick={() => navigate('/patient/consultation')}
              className="relative w-10 h-10 bg-white/15 backdrop-blur rounded-full flex items-center justify-center"
            >
              <Bell size={20} className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Banner图 */}
          <div className="rounded-2xl overflow-hidden h-32 bg-white/10 backdrop-blur-sm">
            <img 
              src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&h=250&fit=crop" 
              alt="健康banner"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute bottom-8 left-6 right-6">
              <p className="text-white text-sm font-medium drop-shadow">关注健康，从每一天开始</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4 fade-in">
        {/* 疼痛评分卡片 */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-primary-500" />
              疼痛评分
            </h3>
            {painScore && (
              <span className={`text-2xl font-bold ${getScoreColor(painScore.score)}`}>
                {painScore.score}
                <span className="text-xs text-gray-400 font-normal">/10</span>
              </span>
            )}
          </div>

          {/* 评分滑块 */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max="10"
              value={currentScore}
              onChange={(e) => {
                setCurrentScore(parseInt(e.target.value))
                setShowPainSubmit(true)
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%)`,
              }}
            />
            <div className="flex justify-between mt-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <span key={n} className="text-[10px] text-gray-300 w-[20px] text-center">{n}</span>
              ))}
            </div>
          </div>

          {showPainSubmit && (
            <button
              onClick={submitPainScore}
              className="w-full py-2 bg-primary-50 text-primary-600 rounded-xl text-xs font-medium hover:bg-primary-100 transition-colors"
            >
              提交评分 ({currentScore}分)
            </button>
          )}

          {painScore?.description && (
            <p className="text-xs text-gray-400 mt-2">{painScore.description}</p>
          )}
        </div>

        {/* 今日提醒 + 快捷操作 */}
        <div className="grid grid-cols-5 gap-3">
          {/* 今日提醒 */}
          <div className="col-span-3 bg-white rounded-2xl p-4 card-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <Clock size={14} className="text-primary-500" />
                今日提醒
              </h3>
              <span className="text-[10px] text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
                {pendingReminders.length}项待完成
              </span>
            </div>
            <div className="space-y-2.5">
              {pendingReminders.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {getReminderIcon(r.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">{r.content}</p>
                    <p className="text-[10px] text-gray-300">{r.remind_time}</p>
                  </div>
                  <button
                    onClick={() => markReminderDone(r.id)}
                    className="w-6 h-6 rounded-full border-2 border-primary-300 flex items-center justify-center hover:bg-primary-50 flex-shrink-0"
                  >
                    <Check size={12} className="text-primary-400" />
                  </button>
                </div>
              ))}
              {pendingReminders.length === 0 && (
                <p className="text-xs text-gray-300 text-center py-3">暂无待完成提醒</p>
              )}
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="col-span-2 bg-white rounded-2xl p-4 card-shadow flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">快捷操作</h3>
            <button
              onClick={() => navigate('/patient/consultation')}
              className="flex items-center gap-2 px-3 py-2.5 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
            >
              <Phone size={14} className="text-primary-600" />
              <span className="text-xs text-primary-700 font-medium">联系医生</span>
            </button>
            <button
              onClick={() => navigate('/patient/records')}
              className="flex items-center gap-2 px-3 py-2.5 bg-fresh-50 rounded-xl hover:bg-fresh-100 transition-colors"
            >
              <FileText size={14} className="text-green-600" />
              <span className="text-xs text-green-700 font-medium">查看报告</span>
            </button>
            <button
              onClick={() => navigate('/patient/archive')}
              className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <ClipboardList size={14} className="text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">我的档案</span>
            </button>
          </div>
        </div>

        {/* 不良反应上报 + 紧急求助 */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setShowReactionForm(true)} className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">不良反应</p>
              <p className="text-[10px] text-gray-400">一键上报</p>
            </div>
          </button>
          <button onClick={() => { if(confirm('确定拨打紧急求助电话？')) {} }} className="bg-red-500 rounded-2xl p-4 card-shadow flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">紧急求助</p>
              <p className="text-[10px] text-white/70">一键呼叫</p>
            </div>
          </button>
        </div>

        {/* 术后康复小卡片 */}
        <div onClick={() => navigate('/patient/recovery')} className="bg-white rounded-2xl p-4 card-shadow">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">术后康复</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: recoveryProgress ? `康复第${recoveryProgress.daysSinceSurgery}天` : '康复中', sub: recoveryProgress ? `计划${recoveryProgress.estimatedDays}天` : '-', color: 'text-primary-500 bg-primary-50' },
              { label: '今日训练', sub: recoveryProgress?.nextRehab || '无', color: 'text-blue-500 bg-blue-50' },
              { label: '下次换药', sub: recoveryProgress?.nextTreatmentTime || '无', color: 'text-orange-500 bg-orange-50' },
            ].map((c, i) => (
              <div key={i} className={`rounded-xl p-3 ${c.color}`}>
                <p className="text-[10px] font-medium">{c.label}</p>
                <p className="text-xs font-semibold mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 功能入口 */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">医疗服务</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: <Activity size={22} className="text-primary-500" />, label: '镇痛管理', path: '/patient/records' },
              { icon: <Heart size={22} className="text-red-400" />, label: '康复中心', path: '/patient/recovery' },
              { icon: <Stethoscope size={22} className="text-green-500" />, label: '在线咨询', path: '/patient/consultation' },
              { icon: <FileText size={22} className="text-blue-500" />, label: '健康档案', path: '/patient/archive' },
              { icon: <Pill size={22} className="text-orange-500" />, label: '用药记录', path: '/patient/records' },
              { icon: <AlertTriangle size={22} className="text-amber-500" />, label: '不良反应', onClick: () => setShowReactionForm(true) },
              { icon: <Phone size={22} className="text-teal-500" />, label: '联系医护', path: '/patient/consultation' },
              { icon: <User size={22} className="text-pink-500" />, label: '个人中心', path: '/patient/profile' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
                className="flex flex-col items-center gap-2 py-2"
              >
                <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-[11px] text-gray-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 已完成提醒 */}
        {doneReminders.length > 0 && (
          <div className="bg-white rounded-2xl p-4 card-shadow mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-500" />
              已完成
            </h3>
            <div className="space-y-2">
              {doneReminders.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 opacity-60">
                  <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={14} className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 line-through">{r.content}</p>
                    <p className="text-[10px] text-gray-300">{r.remind_time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 健康小贴士 */}
        <div className="rounded-2xl overflow-hidden card-shadow mb-4">
          <img
            src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&h=200&fit=crop"
            alt="健康提示"
            className="w-full h-32 object-cover"
          />
          <div className="bg-white p-4">
            <p className="text-sm font-medium text-gray-700">术后康复小贴士</p>
            <p className="text-xs text-gray-400 mt-1">适当运动有助于恢复，但要注意循序渐进...</p>
          </div>
        </div>
      </div>

      {/* 不良反应上报弹窗 */}
      {showReactionForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-5 slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">不良反应上报</h3>
              <button onClick={() => setShowReactionForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-2">反应类型</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{v:'nausea',l:'恶心呕吐'},{v:'dizziness',l:'头晕'},{v:'breathing',l:'呼吸异常'},{v:'rash',l:'皮疹'},{v:'drowsiness',l:'嗜睡'},{v:'other',l:'其他'}].map(t=>(
                    <button key={t.v} onClick={()=>setReactionType(t.v)} className={`py-2 rounded-xl text-xs font-medium ${reactionType===t.v?'bg-primary-500 text-white':'bg-gray-50 text-gray-600'}`}>{t.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">详细描述</p>
                <textarea rows={2} placeholder="请描述不良反应的具体情况..." value={reactionDesc} onChange={e=>setReactionDesc(e.target.value)} className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 resize-none" />
              </div>
              <button onClick={submitReaction} className="w-full py-3 bg-amber-500 text-white rounded-xl text-sm font-medium">立即上报</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav items={navItems} />
    </div>
  )
}
