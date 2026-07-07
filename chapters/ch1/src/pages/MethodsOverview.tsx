import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Brain, Calculator, Combine, CheckCircle2 } from 'lucide-react'

const methodGroups = [
  {
    id: 'qualitative',
    title: '定性决策方法',
    icon: Brain,
    color: 'bg-amber-50 border-amber-200',
    titleColor: 'text-amber-800',
    points: [
      '在事实资料、实践经验、理论知识基础上，利用直观判断和逻辑推理进行分析。',
      '适用于数据不多、影响因素复杂且难以用数量或数学模型表示的问题。',
      '能考虑无法量化的因素，简便易行，是一种不可缺少的灵活方法。',
      '准确程度主要取决于决策者的经验、理论水平和分析判断能力。',
    ],
    examples: ['组织机构设置与调整', '产品质量测定', '环境污染对人体健康影响'],
  },
  {
    id: 'quantitative',
    title: '定量决策方法',
    icon: Calculator,
    color: 'bg-blue-50 border-blue-200',
    titleColor: 'text-blue-800',
    points: [
      '在历史数据和统计资料基础上，运用数学和其他分析技术建立数学模型。',
      '适用于可量化的问题，能从数量关系上找出符合目标的最优决策。',
      '电子计算机对复杂模型的处理大大减少了计算工作量。',
      '不能充分考虑定性因素的影响，且要求外界环境相对稳定。',
    ],
    examples: ['计划年产量', '成本预算', '资源配置', '总产值与利润计算'],
  },
]

const integratedPoints = [
  '复杂问题中存在大量非数量性指标，只能进行定性分析。',
      '只有在大量透彻的定性分析基础上，才能建立起合理的数学模型。',
      '现实问题复杂多变，模型往往只是理想化模型，需要结合定性分析与实践。',
      '定量分析必须与定性分析相结合：定性是定量的基础，定量使定性深入和具体化。',
]

export default function MethodsOverview() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <section className="text-center py-8">
        <Badge variant="secondary" className="mb-3 bg-[#F5EDE0] text-[#1B3A5F] hover:bg-[#F5EDE0]">
          1.4
        </Badge>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A5F] mb-2">
          决策分析的定性与定量方法概述
        </h1>
        <p className="text-[#6B6B6B]">两种方法各有所长，综合决策才是趋势</p>
      </section>

      {/* Comparison */}
      <div className="grid md:grid-cols-2 gap-5">
        {methodGroups.map((group) => {
          const Icon = group.icon
          const isSelected = selected === group.id
          return (
            <Card
              key={group.id}
              className={`rounded-2xl shadow-sm border-2 cursor-pointer transition-all ${
                isSelected ? group.color : 'bg-white border-transparent hover:border-[#E0DDD5]'
              }`}
              onClick={() => setSelected(isSelected ? null : group.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${group.color}`}>
                    <Icon className={`w-5 h-5 ${group.titleColor}`} />
                  </div>
                  <h2 className={`text-lg font-semibold ${group.titleColor}`}>{group.title}</h2>
                </div>
                <ul className="space-y-3">
                  {group.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[#6B6B6B]">
                      <CheckCircle2 className="w-4 h-4 text-[#C8963E] mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.examples.map((ex) => (
                    <span
                      key={ex}
                      className="text-xs px-2 py-1 rounded-md bg-white border border-[#E0DDD5] text-[#6B6B6B]"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Separator className="bg-[#E0DDD5]" />

      {/* Integrated Decision */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Combine className="w-5 h-5 text-[#C8963E]" />
            <h2 className="text-lg font-semibold text-[#1B3A5F]">综合决策</h2>
          </div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-5">
            由于定性方法和定量方法在使用上都有一定的局限性，为了使决策结果比较切合实际、提高决策质量，
            在实际工作中应把两种方法结合起来应用，形成综合决策。
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {integratedPoints.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-[#F8F6F2] rounded-xl p-4 border border-[#E0DDD5]"
              >
                <span className="w-6 h-6 rounded-full bg-[#1B3A5F] text-white text-xs flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-[#E0DDD5]" />

      {/* Summary */}
      <div className="bg-[#1B3A5F] rounded-2xl p-6 text-white">
        <h3 className="font-semibold mb-2">本节小结</h3>
        <p className="text-sm leading-relaxed opacity-90">
          定性方法适用于难以量化的复杂因素，定量方法适用于可建立数学模型的精确分析。
          科学的决策分析应坚持“定性分析与定量分析相结合”的综合决策方法，使两者相互补充、各取所长。
        </p>
      </div>
    </div>
  )
}
