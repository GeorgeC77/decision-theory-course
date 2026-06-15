import { Link, useLocation } from 'react-router'
import { Home, Layers, GitBranch, Shuffle, Users } from 'lucide-react'

const navItems = [
  { path: '/6-1', label: '6.1 多阶段决策', icon: Layers },
  { path: '/6-2', label: '6.2 序列决策', icon: GitBranch },
  { path: '/6-3', label: '6.3 马尔可夫决策', icon: Shuffle },
  { path: '/6-4', label: '6.4 群体决策简介', icon: Users },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-60 bg-white border-r border-[#E0DDD5] h-[calc(100vh-3.5rem)] sticky top-14 hidden lg:block overflow-y-auto">
      <div className="p-4">
        {/* Back to Home */}
        <Link
          to="/"
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors no-underline ${
            location.pathname === '/'
              ? 'text-[#C8963E] bg-[#F5EDE0]'
              : 'text-[#6B6B6B] hover:bg-[#F8F6F2]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>返回章节首页</span>
        </Link>

        <hr className="my-3 border-[#E0DDD5]" />

        {/* Section Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors no-underline ${
                  isActive
                    ? 'text-[#C8963E] bg-[#F5EDE0] border-l-2 border-[#C8963E]'
                    : 'text-[#6B6B6B] hover:bg-[#F8F6F2] border-l-2 border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
