import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileAPI, surgeryAPI, followUpAPI, doctorNoteAPI } from '../../api'
import { ArrowLeft, Heart, User, Phone, AlertTriangle, Ruler, Weight, Droplet, Building, Bed, Stethoscope, Calendar, MessageSquare, ClipboardList } from 'lucide-react'

export default function PatientArchive() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [profile, setProfile] = useState(null)
  const [surgeries, setSurgeries] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [doctorNotes, setDoctorNotes] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [profileRes, surgeryRes, followRes, noteRes] = await Promise.all([
        profileAPI.get(user.id),
        surgeryAPI.getList(user.id),
        followUpAPI.getList(user.id),
        doctorNoteAPI.getList(user.id),
      ])
      if (profileRes.code === 200) setProfile(profileRes.data)
      if (surgeryRes.code === 200) setSurgeries(surgeryRes.data)
      if (followRes.code === 200) setFollowUps(followRes.data)
      if (noteRes.code === 200) setDoctorNotes(noteRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">加载中...</p>
      </div>
    )
  }

  const infoGroups = [
    {
      title: '基本信息',
      items: [
        { icon: <User size={16} className="text-primary-500" />, label: '姓名', value: profile.name },
        { icon: <User size={16} className="text-blue-500" />, label: '性别', value: profile.gender },
        { icon: <Heart size={16} className="text-red-400" />, label: '年龄', value: `${profile.age}岁` },
        { icon: <Phone size={16} className="text-green-500" />, label: '联系电话', value: user.phone },
        { icon: <Droplet size={16} className="text-red-500" />, label: '血型', value: profile.blood_type },
        { icon: <Ruler size={16} className="text-amber-500" />, label: '身高', value: `${profile.height}cm` },
        { icon: <Weight size={16} className="text-indigo-500" />, label: '体重', value: `${profile.weight}kg` },
      ]
    },
    {
      title: '住院信息',
      items: [
        { icon: <Building size={16} className="text-primary-500" />, label: '科室', value: profile.department },
        { icon: <Building size={16} className="text-teal-500" />, label: '病区', value: profile.ward },
        { icon: <Bed size={16} className="text-blue-500" />, label: '床位', value: profile.bed_number },
        { icon: <Heart size={16} className="text-pink-500" />, label: '入院日期', value: profile.admission_date },
      ]
    },
    {
      title: '健康信息',
      items: [
        { icon: <AlertTriangle size={16} className="text-orange-500" />, label: '过敏史', value: profile.allergies || '无' },
        { icon: <Heart size={16} className="text-red-400" />, label: '病史', value: profile.medical_history || '无' },
      ]
    },
    {
      title: '紧急联系人',
      items: [
        { icon: <User size={16} className="text-primary-500" />, label: '联系人', value: profile.emergency_contact },
        { icon: <Phone size={16} className="text-green-500" />, label: '联系电话', value: profile.emergency_phone },
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white px-4 pt-10 pb-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-800">健康档案</h2>
      </div>

      <div className="px-4 py-4 space-y-4 fade-in">
        {infoGroups.map((group, gi) => (
          <div key={gi} className="bg-white rounded-2xl card-shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">{group.title}</h3>
            </div>
            {group.items.map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400">{item.label}</p>
                  <p className="text-sm text-gray-700">{item.value || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* 手术信息 */}
        {surgeries.length > 0 && surgeries.map((s, si) => (
        <div key={si} className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">手术信息</h3>
          </div>
          {[
            { icon: <Stethoscope size={16} className="text-red-500" />, label: '手术名称', value: s.surgery_name },
            { icon: <Calendar size={16} className="text-blue-500" />, label: '手术日期', value: s.surgery_date },
            { icon: <User size={16} className="text-primary-500" />, label: '主刀医生', value: s.surgeon },
            { icon: <Building size={16} className="text-teal-500" />, label: '手术室', value: s.operating_room },
            { icon: <ClipboardList size={16} className="text-amber-500" />, label: '麻醉方式', value: s.anesthesia_type },
            { icon: <Heart size={16} className="text-green-500" />, label: '手术结果', value: s.result },
          ].map((item, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">{item.icon}</div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400">{item.label}</p>
                <p className="text-sm text-gray-700">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        ))}

        {/* 随访记录 */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">随访记录</h3>
          </div>
          {followUps.length > 0 ? followUps.map((f) => (
            <div key={f.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{f.follow_date}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${f.status === 'completed' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}>{f.status === 'completed' ? '已完成' : '待随访'}</span>
              </div>
              <p className="text-xs text-gray-500">{f.content}</p>
              <p className="text-[10px] text-gray-400 mt-1">随访医护：{f.doctor_name}</p>
            </div>
          )) : <p className="px-4 py-4 text-xs text-gray-400 text-center">暂无随访记录</p>}
        </div>

        {/* 医生留言 */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">医生留言</h3>
          </div>
          {doctorNotes.length > 0 ? doctorNotes.map((m) => (
            <div key={m.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={12} className="text-primary-500" />
                <span className="text-xs font-medium text-gray-700">{m.doctor_name}</span>
                <span className="text-[10px] text-gray-400 ml-auto">{m.created_at}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{m.content}</p>
            </div>
          )) : <p className="px-4 py-4 text-xs text-gray-400 text-center">暂无医生留言</p>}
        </div>
      </div>
    </div>
  )
}
