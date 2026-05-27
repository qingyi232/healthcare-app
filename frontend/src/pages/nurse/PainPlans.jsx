import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { painPlanAPI } from '../../api'
import { ArrowLeft, FileText, CheckCircle2, Edit3, Gauge, Pill, User } from 'lucide-react'

export default function NursePainPlans() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [showMsg, setShowMsg] = useState('')
  const [plans, setPlans] = useState([])

  useEffect(() => { loadPlans() }, [])

  const loadPlans = async () => {
    try {
      const res = await painPlanAPI.getAll()
      if (res.code === 200) setPlans(res.data)
    } catch (err) { console.error(err) }
  }

  const confirmPlan = async (id) => {
    try {
      const res = await painPlanAPI.confirm(id)
      if (res.code === 200) { setShowMsg('方案已确认！'); loadPlans() }
    } catch (err) { console.error(err) }
    setTimeout(() => setShowMsg(''), 2000)
  }
  const editPlan = (id) => {
    setShowMsg('已进入编辑模式（模拟）')
    setTimeout(() => setShowMsg(''), 2000)
  }
  const generateDoc = (id) => {
    setShowMsg('标准化文书已生成（模拟）')
    setTimeout(() => setShowMsg(''), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white px-4 pt-10 pb-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-800">镇痛方案管理</h2>
      </div>

      <div className="px-4 py-4 space-y-3 fade-in">
        {/* 统计 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <p className="text-xl font-bold text-green-600">{plans.filter(p=>p.status==='confirmed').length}</p>
            <p className="text-xs text-green-500">已确认方案</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-xl font-bold text-amber-600">{plans.filter(p=>p.status==='pending').length}</p>
            <p className="text-xs text-amber-500">待确认方案</p>
          </div>
        </div>

        {plans.map(p => (
          <div key={p.id} className="bg-white rounded-2xl card-shadow overflow-hidden">
            <button onClick={() => setSelected(selected === p.id ? null : p.id)} className="w-full p-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-800">{p.patient_name}</h4>
                    <span className="text-[10px] text-gray-400">{p.bed_number}床</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{p.diagnosis} - {p.department}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full ${p.status==='confirmed'?'bg-green-50 text-green-500':'bg-amber-50 text-amber-500'}`}>
                  {p.status==='confirmed'?'已确认':'待确认'}
                </span>
              </div>
            </button>

            {selected === p.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3 slide-up">
                {p.pca_drug !== '无' && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-2"><Gauge size={12} className="text-blue-500" /> PCA泵参数（系统推荐）</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {l:'药物',v:p.pca_drug},{l:'背景剂量',v:p.pca_bg},{l:'单次剂量',v:p.pca_bolus},{l:'锁定时间',v:p.pca_lock}
                      ].map((x,i)=>(
                        <div key={i} className="bg-blue-50 rounded-lg p-2">
                          <p className="text-[10px] text-blue-400">{x.l}</p>
                          <p className="text-xs font-medium text-blue-700">{x.v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-2"><Pill size={12} className="text-orange-500" /> 口服用药方案</p>
                  {(p.oral_drugs||'').split('|').filter(Boolean).map((d,i)=>(
                    <div key={i} className="bg-orange-50 rounded-lg p-2 mb-1">
                      <p className="text-xs text-orange-700">{d}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {p.status === 'pending' && (
                    <button onClick={()=>confirmPlan(p.id)} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1">
                      <CheckCircle2 size={14} /> 确认方案
                    </button>
                  )}
                  <button onClick={()=>editPlan(p.id)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
                    <Edit3 size={14} /> 修改方案
                  </button>
                  <button onClick={()=>generateDoc(p.id)} className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
                    <FileText size={14} /> 生成文书
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">更新时间：{p.updated_at}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {showMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 slide-up">
          {showMsg}
        </div>
      )}
    </div>
  )
}
