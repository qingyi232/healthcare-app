import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { nurseSettingAPI } from '../../api'
import { ArrowLeft, User, Shield, Download, Bell, Clock, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react'

export default function NurseSettings() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [painAlert, setPainAlert] = useState(true)
  const [noAssessAlert, setNoAssessAlert] = useState(true)
  const [reactionAlert, setReactionAlert] = useState(true)
  const [autoRemind, setAutoRemind] = useState(true)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const res = await nurseSettingAPI.get(user.id)
      if (res.code === 200 && res.data) {
        setPainAlert(!!res.data.pain_alert)
        setNoAssessAlert(!!res.data.no_assess_alert)
        setReactionAlert(!!res.data.reaction_alert)
        setAutoRemind(!!res.data.auto_remind)
      }
      setLoaded(true)
    } catch (err) { console.error(err); setLoaded(true) }
  }

  const saveSettings = async (pa, na, ra, ar) => {
    try {
      await nurseSettingAPI.update(user.id, { pain_alert: pa, no_assess_alert: na, reaction_alert: ra, auto_remind: ar })
    } catch (err) { console.error(err) }
  }

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)}>
      {value ? <ToggleRight size={28} className="text-primary-500" /> : <ToggleLeft size={28} className="text-gray-300" />}
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white px-4 pt-10 pb-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-800">系统设置</h2>
      </div>

      <div className="px-4 py-4 space-y-4 fade-in">
        {/* 账号管理 */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User size={14} className="text-primary-500" /> 账号管理
            </h3>
          </div>
          {[
            { label: '修改密码', desc: '定期更换密码保障账号安全' },
            { label: '绑定手机号', desc: '138****9001' },
            { label: '登录记录', desc: '查看最近登录历史' },
          ].map((item, i) => (
            <button key={i} className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm text-gray-700">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* 提醒规则设置 */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Bell size={14} className="text-amber-500" /> 提醒规则设置
            </h3>
          </div>
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
            <div>
              <p className="text-sm text-gray-700">疼痛过高预警</p>
              <p className="text-[10px] text-gray-400">评分≥7分时自动提醒</p>
            </div>
            <Toggle value={painAlert} onChange={(v)=>{setPainAlert(v);saveSettings(v,noAssessAlert,reactionAlert,autoRemind)}} />
          </div>
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
            <div>
              <p className="text-sm text-gray-700">未评估提醒</p>
              <p className="text-[10px] text-gray-400">超过1小时未评估时提醒</p>
            </div>
            <Toggle value={noAssessAlert} onChange={(v)=>{setNoAssessAlert(v);saveSettings(painAlert,v,reactionAlert,autoRemind)}} />
          </div>
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
            <div>
              <p className="text-sm text-gray-700">不良反应预警</p>
              <p className="text-[10px] text-gray-400">患者上报不良反应时立即通知</p>
            </div>
            <Toggle value={reactionAlert} onChange={(v)=>{setReactionAlert(v);saveSettings(painAlert,noAssessAlert,v,autoRemind)}} />
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">自动用药提醒</p>
              <p className="text-[10px] text-gray-400">到达服药时间自动推送</p>
            </div>
            <Toggle value={autoRemind} onChange={(v)=>{setAutoRemind(v);saveSettings(painAlert,noAssessAlert,reactionAlert,v)}} />
          </div>
        </div>

        {/* 数据导出 */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Download size={14} className="text-blue-500" /> 数据导出
            </h3>
          </div>
          {[
            { label: '导出患者疼痛数据', desc: 'Excel格式，含所有患者评分记录' },
            { label: '导出护理记录', desc: 'PDF格式，含诊疗和护理记录' },
            { label: '导出统计报表', desc: 'Excel格式，含科室各项统计指标' },
          ].map((item, i) => (
            <button key={i} className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm text-gray-700">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.desc}</p>
              </div>
              <Download size={16} className="text-primary-500" />
            </button>
          ))}
        </div>

        {/* 安全设置 */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Shield size={14} className="text-green-500" /> 安全与隐私
            </h3>
          </div>
          <button className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-50">
            <div>
              <p className="text-sm text-gray-700">数据加密</p>
              <p className="text-[10px] text-gray-400">传输与存储均已加密保护</p>
            </div>
            <span className="text-[10px] text-green-500 bg-green-50 px-2 py-0.5 rounded-full">已启用</span>
          </button>
          <button className="w-full px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">操作日志</p>
              <p className="text-[10px] text-gray-400">查看系统操作记录</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-300 pb-4">智慧医护 v1.0 · 信息科技术支持</p>
      </div>
    </div>
  )
}
