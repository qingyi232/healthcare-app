import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { messageAPI } from '../../api'
import { ArrowLeft, Send } from 'lucide-react'

export default function PatientChat() {
  const { otherId } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [otherName, setOtherName] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    loadMessages()
  }, [otherId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    try {
      const res = await messageAPI.getChat(otherId)
      if (res.code === 200) {
        setMessages(res.data)
        if (res.data.length > 0) {
          const first = res.data[0]
          setOtherName(first.sender_id == otherId ? first.sender_name : first.receiver_name)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    try {
      const res = await messageAPI.send({
        receiver_id: parseInt(otherId),
        content: input.trim(),
      })
      if (res.code === 200) {
        setMessages(prev => [...prev, res.data])
        setInput('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white px-4 pt-10 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-800">{otherName || '聊天'}</h2>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMine ? 'order-1' : ''}`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-primary-500 text-white rounded-tr-sm'
                    : 'bg-white text-gray-700 rounded-tl-sm card-shadow'
                }`}>
                  {msg.content}
                </div>
                <p className={`text-[10px] text-gray-300 mt-1 ${isMine ? 'text-right' : ''}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <input
          type="text"
          placeholder="输入消息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          <Send size={18} className="text-white" />
        </button>
      </div>
    </div>
  )
}
