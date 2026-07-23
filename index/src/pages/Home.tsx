import { ArrowRight, BookOpen, Construction, AlertTriangle, Mail, GraduationCap, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Chapter {
  id: number
  title: string
  description: string
  sections: string[]
  path: string
  comingSoon?: boolean
  notFullyReviewed?: boolean
}

const chapters: Chapter[] = [
  {
    id: 1,
    title: '决策分析概述',
    description: '理解决策分析的基本概念、要素、分类、原则、步骤与方法，为后续各章奠定理论基础。',
    sections: ['概念与要素', '分类与原则', '步骤与追踪决策', '定性与定量方法', '案例分析'],
    path: './ch1/',
  },
  {
    id: 2,
    title: '确定型决策分析',
    description: '掌握确定性条件下的决策分析方法，包括货币时间价值、盈亏分析、投资评价等核心工具。',
    sections: ['货币时间价值', '盈亏决策分析', '投资评价指标', '多方案投资决策'],
    path: './ch2/',
  },
  {
    id: 3,
    title: '风险型决策分析',
    description: '学习在风险条件下的决策准则与方法，包括期望值、决策树、贝叶斯决策等分析技术。',
    sections: ['期望值准则', '决策树分析', '贝叶斯决策', '灵敏度分析', '效用理论'],
    path: './ch3/',
  },
  {
    id: 4,
    title: '不确定型决策分析',
    description: '探索不确定性条件下的各种决策准则，包括乐观、悲观、折中、后悔值等经典方法。',
    sections: ['基本概念', '乐观准则', '悲观准则', '折中准则', '后悔值准则', '等概率准则', '案例分析'],
    path: './ch4/',
  },
  {
    id: 5,
    title: '多目标决策分析',
    description: '掌握多目标决策的核心方法，包括目标准则体系、多维效用并合、AHP、DEA、模糊评价与ANP。',
    sections: ['目标准则体系', '多维效用并合', '层次分析(AHP)', 'DEA思想简化演示', '模糊综合评价', '网络分析法(ANP)'],
    path: './ch5/',
    notFullyReviewed: true,
  },
  {
    id: 6,
    title: '序贯决策分析',
    description: '研究多阶段序贯决策问题，包括多阶段决策、序列决策、马尔可夫决策和群体决策。',
    sections: ['多阶段决策', '序列决策', '马尔可夫决策', '群体决策简介'],
    path: './ch6/',
    notFullyReviewed: true,
  },
]

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#1B3A5F] flex items-center shadow-md">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-white/90" aria-hidden="true" />
          <span className="text-white font-semibold text-base tracking-wide">决策理论与方法</span>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="pt-28 pb-12 md:pt-36 md:pb-16 px-4 text-center">
      <div className="flex justify-center mb-6 animate-fade-in-up">
        <img
          src="./xbm.jpg"
          alt="中国石油大学（华东）校徽"
          className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white object-cover shadow-md border border-[#E0DDD5]"
        />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-[#1B3A5F] tracking-tight mb-3 animate-fade-in-up">
        决策理论与方法
      </h1>
      <p className="text-lg md:text-xl text-[#6B6B6B] mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        交互式学习平台
      </p>
      <div className="flex justify-center">
        <div
          className="h-1 w-20 rounded-full bg-[#C8963E] animate-scale-x"
          aria-hidden="true"
        />
      </div>
    </section>
  )
}

function ChapterCard({ chapter, index }: { chapter: Chapter; index: number }) {
  if (chapter.comingSoon) {
    return (
      <div
        className={cn(
          'relative rounded-xl bg-white shadow-md border border-[#E0DDD5] p-6',
          'opacity-60 select-none animate-fade-in-up'
        )}
        style={{ animationDelay: `${0.2 + index * 0.1}s` }}
      >
        <div className="flex items-start justify-between mb-4">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#E0DDD5] text-[#9E9E9E] text-sm font-semibold">
            {chapter.id}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#9E9E9E] bg-[#F8F6F2] px-2.5 py-1 rounded-full border border-[#E0DDD5]">
            <Construction className="w-3.5 h-3.5" aria-hidden="true" />
            建设中
          </div>
        </div>

        <h3 className="text-xl font-semibold text-[#9E9E9E] mb-2">
          第{chapter.id}章 {chapter.title}
        </h3>
        <p className="text-sm text-[#9E9E9E] mb-5 leading-relaxed">
          {chapter.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {chapter.sections.map((section) => (
            <span
              key={section}
              className="text-xs px-2.5 py-1 rounded-full bg-[#F8F6F2] text-[#9E9E9E] font-medium border border-[#E0DDD5]"
            >
              {section}
            </span>
          ))}
        </div>

        <button
          disabled
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#E0DDD5] text-[#9E9E9E] text-sm font-medium cursor-not-allowed"
        >
          敬请期待
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group rounded-xl bg-white shadow-md border border-[#E0DDD5] p-6',
        'hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up'
      )}
      style={{ animationDelay: `${0.2 + index * 0.1}s` }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#1B3A5F] text-white text-sm font-semibold">
          {chapter.id}
        </span>
        {chapter.notFullyReviewed ? (
          <div className="flex items-center gap-1 text-xs font-medium text-[#1B3A5F] bg-[#F5EDE0] border border-[#C8963E] px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3 text-[#C8963E]" aria-hidden="true" />
            尚未完全审核完成
          </div>
        ) : (
          <span className="text-xs text-[#6B6B6B] bg-[#F8F6F2] px-2.5 py-1 rounded-full font-medium border border-[#E0DDD5]">
            {chapter.sections.length} 节
          </span>
        )}
      </div>

      <h3 className="text-xl font-semibold text-[#1B3A5F] mb-2">
        第{chapter.id}章 {chapter.title}
      </h3>
      <p className="text-sm text-[#6B6B6B] mb-5 leading-relaxed">
        {chapter.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {chapter.sections.map((section) => (
          <span
            key={section}
            className="text-xs px-2.5 py-1 rounded-full bg-[#F8F6F2] text-[#6B6B6B] font-medium border border-[#E0DDD5]"
          >
            {section}
          </span>
        ))}
      </div>

      <a
        href={chapter.path}
        className={cn(
          'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
          'bg-[#1B3A5F] text-white text-sm font-medium',
          'hover:bg-[#2A4A73] transition-colors duration-200'
        )}
        aria-label={`进入第${chapter.id}章 ${chapter.title}`}
      >
        进入学习
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </a>
    </div>
  )
}

const instructors = ['崔耕', '渐令', '王信敏']

function TeachingTeamSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-14">
      <div
        className="max-w-3xl mx-auto rounded-xl bg-white shadow-md border border-[#E0DDD5] px-6 py-8 text-center animate-fade-in-up"
        style={{ animationDelay: '0.25s' }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="w-5 h-5 text-[#C8963E]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[#1B3A5F]">教学团队</h2>
        </div>
        <p className="text-sm text-[#6B6B6B] mb-6">
          中国石油大学（华东）· 经济管理学院
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {instructors.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F8F6F2] border border-[#E0DDD5] text-sm text-[#1B3A5F] font-medium"
            >
              <User className="w-4 h-4 text-[#C8963E]" aria-hidden="true" />
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function ChaptersGrid() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map((chapter, index) => (
            <ChapterCard key={chapter.id} chapter={chapter} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-[#1B3A5F] text-white mt-auto border-t-4 border-[#C8963E]">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-white/90 text-base font-medium">
            决策理论与方法 · 交互式学习平台
          </p>
          <div className="inline-flex items-start gap-3 bg-amber-100 text-amber-900 rounded-lg px-5 py-3 text-sm font-medium max-w-2xl text-left shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              本网站内容仅供教学与学习交流使用。未经授权，禁止用于商业用途或大规模转载。
            </span>
          </div>
          <a
            href="mailto:gengc25@hotmail.com"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            如发现内容疏漏，或有合作意向，欢迎联系：gengc25@hotmail.com
          </a>
          <p className="text-white/60 text-xs">
            All Rights Reserved. Licensed for educational use.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8F6F2]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <TeachingTeamSection />
        <ChaptersGrid />
      </main>
      <Footer />
    </div>
  )
}
