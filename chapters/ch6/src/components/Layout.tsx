import { useLocation } from 'react-router'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

const sectionNames: Record<string, string> = {
  '/': '首页',
  '/6-1': '6.1 多阶段决策',
  '/6-2': '6.2 序列决策',
  '/6-3': '6.3 马尔可夫决策',
  '/6-4': '6.4 群体决策简介',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const currentPath = location.pathname
  const sectionName = sectionNames[currentPath] || '序贯决策分析'

  const breadcrumbItems =
    currentPath === '/'
      ? [{ label: '首页', path: '/' }]
      : [
          { label: '首页', path: '/' },
          { label: sectionName, path: currentPath },
        ]

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8F6F2]">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="pt-14 flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <main className="flex-1 min-w-0 min-h-[calc(100vh-3.5rem)]">
          {/* Breadcrumb */}
          <div className="bg-white border-b border-[#E0DDD5] px-4 lg:px-6 py-3">
            <nav className="flex items-center gap-2 text-sm text-[#6B6B6B]">
              {breadcrumbItems.map((item, index) => (
                <span key={item.path} className="flex items-center gap-2">
                  {index > 0 && <span className="text-[#9E9E9E]">/</span>}
                  <span
                    className={
                      index === breadcrumbItems.length - 1
                        ? 'text-[#2A4A73] font-medium'
                        : 'hover:text-[#C8963E] transition-colors'
                    }
                  >
                    {item.label}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          {/* Page Content */}
          <div className="page-enter p-4 lg:p-6">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
