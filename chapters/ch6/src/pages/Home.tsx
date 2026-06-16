import { Link } from 'react-router'
import { Layers, GitBranch, Shuffle, Users, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const sections = [
  {
    id: '6-1',
    number: '6.1',
    title: '多阶段决策',
    desc: '研究如何将决策过程分为若干相互联系的阶段，在每个阶段做出最优决策，使整个过程达到最优效果。包括决策树方法和逆序归纳法。',
    tags: ['多阶段', '决策树', '逆序归纳'],
    icon: Layers,
  },
  {
    id: '6-2',
    number: '6.2',
    title: '序列决策',
    desc: '决策后产生新情况需要继续决策的序列过程，通过决策树和贝叶斯分析进行序列决策，包括后验概率计算。',
    tags: ['序列决策', '贝叶斯', '后验概率'],
    icon: GitBranch,
  },
  {
    id: '6-3',
    number: '6.3',
    title: '马尔可夫决策',
    desc: '系统在不同状态间转移的决策问题，利用转移矩阵和稳态概率进行决策分析，适用于具有马尔可夫性的决策场景。',
    tags: ['马尔可夫链', '转移矩阵', '稳态概率'],
    icon: Shuffle,
  },
  {
    id: '6-4',
    number: '6.4',
    title: '群体决策简介',
    desc: '多个决策者共同参与的决策过程，介绍投票规则、波德规则和多指标群组决策方法。',
    tags: ['群体决策', '投票规则', '综合加权'],
    icon: Users,
  },
]

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-white border border-[#E0DDD5] rounded-2xl px-6 py-12 lg:px-12 lg:py-16 text-center relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1B3A5F] mb-3">
            序贯决策分析
          </h1>
          <p className="text-base lg:text-lg text-[#6B6B6B] mb-4">
            决策理论与方法 · 第6章
          </p>
          <div className="w-16 h-1 bg-[#C8963E] mx-auto rounded-full" />
        </div>
      </section>

      {/* Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card
              key={section.id}
              className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0">
                {/* Card Header */}
                <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1B3A5F] text-white text-xs font-bold">
                    {section.number}
                  </span>
                  <Icon className="w-5 h-5 text-[#6B6B6B]" />
                </div>

                {/* Card Body */}
                <div className="px-5 pb-3">
                  <h3 className="text-lg font-semibold text-[#1B3A5F] mb-2">
                    {section.title}
                  </h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed mb-3">
                    {section.desc}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {section.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[#f1f5f9] text-[#6B6B6B] text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 pb-5">
                  <Link to={`/${section.id}`} className="no-underline">
                    <Button className="w-full bg-[#1B3A5F] hover:bg-[#2A4A73] text-white rounded-xl h-10 text-sm font-medium">
                      进入学习
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
