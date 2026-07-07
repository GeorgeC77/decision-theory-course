import { Link } from 'react-router'
import { Lightbulb, ListTree, Route, Scale, Car, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const sections = [
  {
    id: '1-1',
    number: '1.1',
    title: '决策分析的概念及其基本要素',
    desc: '理解决策分析从“拍板”到系统过程的广义内涵，掌握决策者、目标、方案、自然状态、结果与准则六大基本要素。',
    tags: ['决策概念', '基本要素', '鸡蛋煎饼案例'],
    icon: Lightbulb,
  },
  {
    id: '1-2',
    number: '1.2',
    title: '决策分析的分类及其基本原则',
    desc: '从决策者、问题性质、自然状态、过程连续性等维度对决策进行分类，并学习科学决策应遵循的九大基本原则。',
    tags: ['分类维度', '确定/不确定', '九大原则'],
    icon: ListTree,
  },
  {
    id: '1-3',
    number: '1.3',
    title: '决策分析的步骤与追踪决策',
    desc: '掌握分析问题、确定目标、拟定方案、选择方案、实施方案五个基本步骤，以及追踪决策的特征与应用。',
    tags: ['五步法', '追踪决策', '反馈循环'],
    icon: Route,
  },
  {
    id: '1-4',
    number: '1.4',
    title: '决策分析的定性与定量方法概述',
    desc: '比较定性分析与定量分析的适用场景和优缺点，理解综合决策“定性为基础、定量作深化”的思想。',
    tags: ['定性方法', '定量方法', '综合决策'],
    icon: Scale,
  },
  {
    id: '1-5',
    number: '1.5',
    title: '案例分析：应对石油危机的汽车开发决策',
    desc: '通过日本汽车制造商应对石油危机的模拟案例，体验目标分解、方案推演与定量测算的完整决策过程。',
    tags: ['石油危机', '目标分解', '定量推演'],
    icon: Car,
  },
]

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-bold text-[#1B3A5F] mb-3">
          决策分析概述
        </h1>
        <p className="text-base lg:text-lg text-[#6B6B6B] mb-4">
          决策理论与方法 · 第1章
        </p>
        <div className="w-16 h-1 bg-[#C8963E] mx-auto rounded-full" />
      </section>

      {/* Intro */}
      <section className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E0DDD5] p-6 lg:p-8">
          <p className="text-[#6B6B6B] leading-relaxed mb-4">
            决策分析是人们为了实现某一特定目标，在占有一定信息和经验的基础上，根据主客观条件的可能性，
            提出各种可行方案，采用科学的手段对各方案进行比较、分析和评价，按照决策准则，
            从中筛选出最满意的方案，并根据方案实施的反馈情况进行修整控制，直至目标实现的整个系统过程。
          </p>
          <p className="text-[#6B6B6B] leading-relaxed">
            本章将带领大家建立对“决策”的科学认识：它不仅是瞬间的“拍板”，更是一个发现问题、分析问题、
            解决问题并不断反馈优化的动态过程。
          </p>
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
