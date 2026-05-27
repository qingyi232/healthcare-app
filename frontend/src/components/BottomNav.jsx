import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav({ items }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 z-50">
      <div className="flex items-center justify-around h-[60px]">
        {items.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 flex-1"
            >
              <span className={`text-[22px] ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                {item.icon}
              </span>
              <span className={`text-[11px] ${isActive ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}
