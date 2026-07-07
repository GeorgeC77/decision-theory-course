import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Target,
  ListTodo,
  CheckSquare,
  Play,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  GitCompare,
  Brain,
} from 'lucide-react'

const steps = [
  {
    id: 1,
    icon: Search,
    title: '分析问题',
    desc: '决策分析的前提。发现现实状态与期望状态之间的差距，界定问题性质、时间、地点、范围与程度。',
    tips: ['主动寻找问题', '抓住主要问题', '避免片面性', '依据客观事实'],
  },
  {
    id: 2,
    icon: Target,
    title: '确定目标',
    desc: '明确决策系统期望达到的状态。目标应针对性强、需要与可能结合、具体明确，并区分主次与约束条件。',
    tips: ['目标针对性', '需要与可能结合', '尽可能数量化', '明确约束条件'],
  },
  {
    id: 3,
    icon: ListTodo,
    title: '拟定方案',
    desc: '寻找解决问题、实现目标的方法与途径。应大胆创新、集思广益，并预测各方案的可能结果。',
    tips: ['保证方案可行', '勇于创新', '寻找→设计→估测'],
  },
  {
    id: 4,
    icon: CheckSquare,
    title: '选择方案',
    desc: '根据决策目标和评价标准，对各方案进行比较、分析和评价，从中选出最优或满意方案。',
    tips: ['科学分析与评价', '综合权衡利弊', '考虑风险与偏好'],
  },
  {
    id: 5,
    icon: Play,
    title: '实施方案',
    desc: '将方案付诸实施，在实践中检验真伪。对出现的新情况及时进行反馈修正，必要时进行追踪决策。',
    tips: ['追踪控制', '及时修正', '付诸行动'],
  },
]

const trackingFeatures = [
  { icon: RotateCcw, title: '回溯分析', desc: '从原决策起点开始，客观分析产生环境和条件，查找失误点及原因。' },
  { icon: AlertTriangle, title: '非零起点', desc: '追踪决策发生在原决策实施过程中，时点和条件已不再是原决策产生时的状态。' },
  { icon: GitCompare, title: '双重优化', desc: '新方案应优于原决策方案，且新决策的预期效果应优于原决策的可能执行效果。' },
  { icon: Brain, title: '心理效应', desc: '消除原决策失误带来的心理压力，以客观公正、积极的心态进行追踪决策。' },
]

export default function StepsAndTracking() {
  const [activeStep, setActiveStep] = useState(1)

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <section className="text-center py-8">
        <Badge variant="secondary" className="mb-3 bg-[#F5EDE0] text-[#1B3A5F] hover:bg-[#F5EDE0]">
          1.3
        </Badge>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A5F] mb-2">
          决策分析的步骤与追踪决策
        </h1>
        <p className="text-[#6B6B6B]">科学决策的系统过程与动态修正机制</p>
      </section>

      {/* Steps Flow */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-[#1B3A5F] mb-5">决策分析的五个基本步骤</h2>

          {/* Stepper */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {steps.map((step, idx) => {
              const Icon = step.icon
              const isActive = step.id === activeStep
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#1B3A5F] text-white shadow-md'
                        : 'bg-[#F8F6F2] text-[#6B6B6B] hover:bg-[#E0DDD5]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {step.title}
                  </button>
                  {idx < steps.length - 1 && <ArrowRight className="w-4 h-4 text-[#C8963E] mx-1" />}
                </div>
              )
            })}
          </div>

          {/* Active Step Detail */}
          <div className="bg-[#F8F6F2] rounded-xl p-6 border border-[#E0DDD5]">
            {steps.map((step) => {
              const Icon = step.icon
              if (step.id !== activeStep) return null
              return (
                <div key={step.id} className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1B3A5F] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1B3A5F]">
                      步骤 {step.id}：{step.title}
                    </h3>
                  </div>
                  <p className="text-[#6B6B6B] leading-relaxed mb-4">{step.desc}</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {step.tips.map((tip) => (
                      <div
                        key={tip}
                        className="flex items-center gap-2 text-sm text-[#6B6B6B] bg-white rounded-lg px-3 py-2 border border-[#E0DDD5]"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C8963E]" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-[#9E9E9E] mt-4">
            提示：实际决策过程中，这些步骤往往不是严格单向的，而是可能多次反复、形成循环。
            例如拟定方案时发现目标过高，可能返回重新修订目标。
          </p>
        </CardContent>
      </Card>

      <Separator className="bg-[#E0DDD5]" />

      {/* Tracking Decision */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-[#C8963E]" />
            <h2 className="text-lg font-semibold text-[#1B3A5F]">追踪决策</h2>
          </div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-5">
            追踪决策是在方案实施过程中，当主客观情况发生重大变化或原决策方案存在重大失误时，
            所进行的一种补救性的新决策。它不同于一般性修正，而是对原有决策的根本性修正。
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#E0DDD5] mb-6">
            <table className="w-full text-sm">
              <thead className="bg-[#1B3A5F] text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">原决策 \ 现状</th>
                  <th className="px-4 py-3 text-center font-medium">主客观情况基本不变</th>
                  <th className="px-4 py-3 text-center font-medium">主观情况重大变化</th>
                  <th className="px-4 py-3 text-center font-medium">客观情况重大变化</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { original: '原决策正确', cells: ['实施', '追踪决策', '追踪决策'] },
                  { original: '原决策错误', cells: ['追踪决策', '追踪决策', '追踪决策'] },
                ].map((row) => (
                  <tr key={row.original} className="border-b border-[#E0DDD5]">
                    <td className="px-4 py-3 font-medium text-[#1B3A5F]">{row.original}</td>
                    {row.cells.map((cell) => (
                      <td
                        key={cell}
                        className={`px-4 py-3 text-center ${
                          cell === '实施' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold text-[#1B3A5F] mb-3">追踪决策的基本特征</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {trackingFeatures.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="bg-[#F8F6F2] rounded-xl p-4 border border-[#E0DDD5]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-[#C8963E]" />
                    <span className="font-medium text-[#1B3A5F]">{f.title}</span>
                  </div>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-[#E0DDD5]" />

      {/* Summary */}
      <div className="bg-[#1B3A5F] rounded-2xl p-6 text-white">
        <h3 className="font-semibold mb-2">本节小结</h3>
        <p className="text-sm leading-relaxed opacity-90">
          科学的决策过程包括分析问题、确定目标、拟定方案、选择方案、实施方案五个基本步骤。
          在实施过程中，当情况发生重大变化时，需要进行追踪决策，并把握回溯分析、非零起点、双重优化和心理效应等特征。
        </p>
      </div>
    </div>
  )
}
