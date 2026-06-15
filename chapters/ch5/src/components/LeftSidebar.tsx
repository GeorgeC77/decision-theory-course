import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sidebarLinks = [
  { path: '/criteria-system', label: '目标准则体系', badge: '5.1' },
  { path: '/utility-merging', label: '多维效用并合', badge: '5.2' },
  { path: '/ahp', label: '层次分析(AHP)', badge: '5.3' },
  { path: '/dea', label: 'DEA思想简化演示', badge: '5.4' },
  { path: '/fuzzy-eval', label: '模糊综合评价', badge: '5.5' },
  { path: '/anp', label: '网络分析法(ANP)', badge: '5.6' },
];

export default function LeftSidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className="hidden lg:flex flex-col w-[240px] h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto"
      style={{
        background: '#F8F6F2',
        borderRight: '1px solid #E0DDD5',
        padding: '16px',
      }}
    >
      {/* Back to home */}
      <Link
        to="/"
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 no-underline mb-4"
        style={{ color: '#6B6B6B' }}
      >
        <ArrowLeft size={16} />
        <span>返回章节首页</span>
      </Link>

      {/* Divider */}
      <div className="w-full h-px mb-4" style={{ background: '#E0DDD5' }} />

      {/* Chapter links */}
      <nav className="flex flex-col gap-1 flex-1">
        {sidebarLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 no-underline"
            style={{
              background: isActive(link.path) ? '#F5EDE0' : 'transparent',
              color: isActive(link.path) ? '#1B3A5F' : '#6B6B6B',
              borderLeft: isActive(link.path) ? '3px solid #C8963E' : '3px solid transparent',
            }}
          >
            <span
              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: isActive(link.path) ? '#C8963E' : '#1B3A5F',
                color: '#ffffff',
              }}
            >
              {link.badge}
            </span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Copyright */}
      <div className="mt-auto pt-4">
        <p className="text-xs" style={{ color: '#9E9E9E' }}>
          决策理论与方法 · 第三版
        </p>
      </div>
    </aside>
  );
}
