import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'
import { Home, Activity, Heart, MessageCircle, User, Utensils, PersonStanding, Wind, ShieldPlus, Moon, ChevronDown, ChevronUp } from 'lucide-react'

const navItems = [
  { path: '/patient', label: '首页', icon: <Home size={22} /> },
  { path: '/patient/records', label: '镇痛', icon: <Activity size={22} /> },
  { path: '/patient/recovery', label: '康复', icon: <Heart size={22} /> },
  { path: '/patient/consultation', label: '消息', icon: <MessageCircle size={22} /> },
  { path: '/patient/profile', label: '我的', icon: <User size={22} /> },
]

const guides = [
  {
    id: 'diet', icon: <Utensils size={20} className="text-orange-500" />, title: '术后饮食指导', color: 'bg-orange-50',
    items: [
      { title: '术后6小时', desc: '禁食禁水，待肠鸣音恢复后可少量饮水' },
      { title: '流质饮食期', desc: '米汤、藕粉、果汁等，少量多餐，每次100-200ml' },
      { title: '半流质饮食期', desc: '稀饭、面条、蒸蛋等，逐渐增加食量' },
      { title: '普通饮食期', desc: '高蛋白（鱼、蛋、奶）、高维生素（蔬果）、适量纤维素' },
      { title: '禁忌食物', desc: '避免辛辣、油腻、生冷食物，忌烟酒及碳酸饮料' },
    ]
  },
  {
    id: 'activity', icon: <PersonStanding size={20} className="text-blue-500" />, title: '活动指导', color: 'bg-blue-50',
    items: [
      { title: '术后第1天', desc: '卧床休息，可在床上做踝泵运动（脚踝上下活动），每组20次，每日3-4组' },
      { title: '术后第2-3天', desc: '在护士协助下坐起，练习床边站立，注意防跌倒' },
      { title: '术后第4-7天', desc: '使用助行器短距离行走，逐渐增加距离，每次5-10分钟' },
      { title: '术后1-2周', desc: '加强关节活动度训练，适当增加步行距离' },
      { title: '注意事项', desc: '活动时如感到剧烈疼痛、头晕应立即停止并休息' },
    ]
  },
  {
    id: 'breathing', icon: <Wind size={20} className="text-teal-500" />, title: '呼吸训练', color: 'bg-teal-50',
    items: [
      { title: '腹式呼吸', desc: '平卧，双手放在腹部，鼻子缓慢吸气使腹部鼓起，嘴巴缓慢呼气。每次5-10分钟' },
      { title: '缩唇呼吸', desc: '鼻子吸气2秒，嘴唇缩成吹口哨状缓慢呼气4-6秒。每组10次' },
      { title: '有效咳嗽', desc: '深吸气后屏气2-3秒，然后用力咳嗽排痰。必要时用枕头压住伤口处' },
      { title: '训练频率', desc: '每日3-4次，每次10-15分钟，饭后1小时进行效果最佳' },
    ]
  },
  {
    id: 'wound', icon: <ShieldPlus size={20} className="text-red-400" />, title: '伤口护理', color: 'bg-red-50',
    items: [
      { title: '保持清洁干燥', desc: '伤口敷料应保持干燥，如有渗液及时通知护士更换' },
      { title: '换药时间', desc: '一般术后2-3天首次换药，之后根据恢复情况每1-2天换药一次' },
      { title: '观察要点', desc: '注意伤口有无红肿、渗液、异味等异常，如有发热>38.5°C及时报告' },
      { title: '拆线时间', desc: '一般术后7-14天拆线，具体时间由主治医生根据愈合情况决定' },
      { title: '日常注意', desc: '拆线前避免淋浴，可擦浴。拆线后1周再正常洗澡' },
    ]
  },
  {
    id: 'sleep', icon: <Moon size={20} className="text-indigo-500" />, title: '睡眠改善', color: 'bg-indigo-50',
    items: [
      { title: '作息规律', desc: '建议晚上10点前入睡，保证7-8小时睡眠时间' },
      { title: '睡前准备', desc: '睡前30分钟停止使用手机，可听舒缓音乐或做深呼吸放松' },
      { title: '体位调整', desc: '选择舒适体位，可在膝下垫软枕减轻疼痛。避免压迫伤口' },
      { title: '环境营造', desc: '保持病房安静、适宜温度（22-24°C）、适当通风' },
      { title: '药物辅助', desc: '如疼痛影响睡眠，可在医生指导下睡前服用止痛药' },
    ]
  },
]

export default function PatientRecovery() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState('diet')

  return (
    <div className="page-container bg-gray-50/50">
      <div className="bg-white px-5 pt-12 pb-4">
        <h1 className="text-lg font-semibold text-gray-800">康复中心</h1>
        <p className="text-xs text-gray-400 mt-0.5">术后康复全程指导</p>
      </div>

      <div className="px-4 py-4 space-y-3 fade-in">
        {/* 康复进度卡片 */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-400 rounded-2xl p-4 text-white">
          <p className="text-xs text-white/70">术后康复进度</p>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-bold">第4天</span>
              <span className="text-xs text-white/60 ml-1">/ 预计14天</span>
            </div>
            <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded-full">恢复良好</span>
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: '28%' }} />
          </div>
        </div>

        {/* 康复指南列表 */}
        {guides.map((g) => (
          <div key={g.id} className="bg-white rounded-2xl card-shadow overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === g.id ? '' : g.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5"
            >
              <div className={`w-10 h-10 rounded-xl ${g.color} flex items-center justify-center flex-shrink-0`}>
                {g.icon}
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 text-left">{g.title}</span>
              {expanded === g.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expanded === g.id && (
              <div className="px-4 pb-4 space-y-3 slide-up">
                {g.items.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5" />
                      {i < g.items.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs font-medium text-gray-700">{item.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <BottomNav items={navItems} />
    </div>
  )
}
