import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api'
import { Heart, Shield, User, Lock, ChevronRight } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login({ username, password })
      if (res.code === 200) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        if (res.data.user.role === 'patient') {
          navigate('/patient')
        } else if (res.data.user.role === 'nurse') {
          navigate('/nurse')
        }
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError('登录失败，请检查网络连接')
    }
    setLoading(false)
  }

  const quickLogin = async (uname) => {
    setUsername(uname)
    setPassword('123456')
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login({ username: uname, password: '123456' })
      if (res.code === 200) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        if (res.data.user.role === 'patient') {
          navigate('/patient')
        } else {
          navigate('/nurse')
        }
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError('登录失败，请检查网络连接')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-fresh-50 flex flex-col">
      {/* 顶部装饰 */}
      <div className="relative pt-16 pb-8 px-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-100/40 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute top-20 left-0 w-24 h-24 bg-fresh-100/50 rounded-full -translate-x-1/2" />
        
        <div className="relative z-10 flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-200">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">智慧医护</h1>
            <p className="text-xs text-gray-400">Smart Healthcare</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">用心守护每一位患者的健康</p>
      </div>

      {/* 登录表单 */}
      <div className="flex-1 px-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="bg-white rounded-2xl p-4 card-shadow">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
              <User className="w-5 h-5 text-primary-500" />
              <input
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 text-sm text-gray-700 placeholder-gray-300"
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Lock className="w-5 h-5 text-primary-500" />
              <input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 text-sm text-gray-700 placeholder-gray-300"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-medium text-sm transition-all shadow-lg shadow-primary-200 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        {/* 快捷登录 */}
        <div className="mt-8">
          <p className="text-xs text-gray-400 text-center mb-4">— 快捷体验登录 —</p>
          
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 card-shadow">
              <p className="text-xs text-primary-600 font-medium mb-3 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> 患者端
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { username: 'patient1', name: '张伟', dept: '骨科' },
                  { username: 'patient2', name: '李芳', dept: '内科' },
                  { username: 'patient3', name: '王强', dept: '心内科' },
                  { username: 'patient5', name: '刘洋', dept: '呼吸科' },
                ].map((p) => (
                  <button
                    key={p.username}
                    onClick={() => quickLogin(p.username)}
                    className="flex items-center justify-between px-3 py-2.5 bg-primary-50/60 rounded-xl text-left hover:bg-primary-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.dept}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 card-shadow">
              <p className="text-xs text-primary-600 font-medium mb-3 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> 医护端
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { username: 'nurse1', name: '赵雪梅', title: '主管护师' },
                  { username: 'nurse2', name: '孙丽华', title: '护师' },
                  { username: 'doctor1', name: '吴建国', title: '主任医师' },
                  { username: 'doctor2', name: '郑美玲', title: '副主任医师' },
                ].map((n) => (
                  <button
                    key={n.username}
                    onClick={() => quickLogin(n.username)}
                    className="flex items-center justify-between px-3 py-2.5 bg-fresh-50/80 rounded-xl text-left hover:bg-fresh-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700">{n.name}</p>
                      <p className="text-[10px] text-gray-400">{n.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-gray-300 text-center mt-6 pb-8">默认密码：123456</p>
      </div>
    </div>
  )
}
