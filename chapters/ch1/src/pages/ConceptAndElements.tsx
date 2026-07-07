import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Lightbulb, User, Target, ListTodo, CloudSun, BarChart3, CheckSquare, ChefHat } from 'lucide-react'

const outcomes = {
  good: {
    direct: '做成 6 个鸡蛋的煎饼',
    separate: '做成 6 个鸡蛋的煎饼，多洗一个碗',
    discard: '做成 5 个鸡蛋煎饼，浪费一个好蛋',
  },
  bad: {
    direct: '5 个鸡蛋受到污染，做无蛋煎饼',
    separate: '做成 5 个鸡蛋煎饼，多洗一个碗',
    discard: '做成 5 个鸡蛋煎饼',
  },
}

const elements = [
  {
    title: '决策者',
    icon: User,
    desc: '决策主体，可以是个人或群体，受社会、政治、经济、文化、心理等因素影响。',
    example: '本例中即为准备做煎饼的家庭主妇。',
  },
  {
    title: '决策目标',
    icon: Target,
    desc: '希望达到的明确目标，可以是单目标或多目标。',
    example: '煎饼含蛋越多越好，付出的劳动越少、越方便越好。',
  },
  {
    title: '决策方案',
    icon: ListTodo,
    desc: '可供选择的行动方案，分为明确方案与由约束条件描述的无限方案。',
    example: '直接打入碗里 / 打入另一个碗检查 / 将鸡蛋丢弃。',
  },
  {
    title: '自然状态',
    icon: CloudSun,
    desc: '决策者无法控制但可以预见的客观环境状态，可能是确定的或不确定的。',
    example: '第 6 个鸡蛋是好蛋还是坏蛋，不确定且离散。',
  },
  {
    title: '决策结果',
    icon: BarChart3,
    desc: '各方案在不同自然状态下出现的结果。',
    example: '3 种方案在 2 种自然状态下对应 6 种可能结果。',
  },
  {
    title: '决策准则',
    icon: CheckSquare,
    desc: '评价方案是否达到目标的价值标准，与决策者的价值取向或偏好有关。',
    example: '家庭主妇的喜好和价值判断决定最终选择。',
  },
]

export default function ConceptAndElements() {
  const [selected, setSelected] = useState<'direct' | 'separate' | 'discard' | null>(null)

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <section className="text-center py-8">
        <Badge variant="secondary" className="mb-3 bg-[#F5EDE0] text-[#1B3A5F] hover:bg-[#F5EDE0]">
          1.1
        </Badge>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A5F] mb-2">
          决策分析的概念及其基本要素
        </h1>
        <p className="text-[#6B6B6B]">从“拍板”到系统过程：建立科学的决策观</p>
      </section>

      {/* Concept */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-[#C8963E]" />
            <h2 className="text-lg font-semibold text-[#1B3A5F]">决策分析的概念</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#F8F6F2] rounded-xl p-5">
              <h3 className="font-medium text-[#1B3A5F] mb-2">狭义理解</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                决策就是“做出决定”，仅限于人们从不同的行动方案中做出最佳选择，
                即通常所说的“拍板”。
              </p>
            </div>
            <div className="bg-[#1B3A5F] rounded-xl p-5 text-white">
              <h3 className="font-medium mb-2">广义理解（本书采用）</h3>
              <p className="text-sm leading-relaxed opacity-90">
                决策是一个发现问题、提出问题、分析问题和解决问题的过程。
                它不是瞬间的行为，而是包含目标设定、方案探索、选择实施与反馈控制的完整系统过程。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Egg Pancake Example */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-[#C8963E]" />
            <h2 className="text-lg font-semibold text-[#1B3A5F]">案例：鸡蛋煎饼的决策</h2>
          </div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-5">
            萨凡奇（Sovage）用“做鸡蛋煎饼”的无数据决策例子说明决策的内容和过程。
            一名家庭主妇准备用 6 个鸡蛋和一碗面粉做煎饼。已经向碗里打了 5 个好鸡蛋，
            准备打第 6 个时，不知道这个鸡蛋是好是坏，她面临两种自然状态和三种可选方案。
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#E0DDD5]">
            <table className="w-full text-sm">
              <thead className="bg-[#1B3A5F] text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">打蛋方案</th>
                  <th className="px-4 py-3 text-center font-medium">好蛋</th>
                  <th className="px-4 py-3 text-center font-medium">坏蛋</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['直接打入碗里', 'direct'],
                    ['打入另一个碗里', 'separate'],
                    ['将鸡蛋丢弃', 'discard'],
                  ] as const
                ).map(([label, key]) => (
                  <tr
                    key={key}
                    className={`border-b border-[#E0DDD5] cursor-pointer transition-colors ${
                      selected === key ? 'bg-[#F5EDE0]' : 'hover:bg-[#F8F6F2]'
                    }`}
                    onClick={() => setSelected(key)}
                  >
                    <td className="px-4 py-3 font-medium text-[#1B3A5F]">{label}</td>
                    <td className="px-4 py-3 text-center text-[#6B6B6B]">{outcomes.good[key]}</td>
                    <td className="px-4 py-3 text-center text-[#6B6B6B]">{outcomes.bad[key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#9E9E9E] mt-3">
            提示：点击上表中的方案行，可高亮查看对应结果。
          </p>

          {selected && (
            <div className="mt-5 bg-[#F8F6F2] rounded-xl p-5 border border-[#E0DDD5]">
              <h3 className="font-medium text-[#1B3A5F] mb-2">方案分析</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#9E9E9E]">若为好蛋：</span>
                  <p className="text-[#6B6B6B] mt-1">{outcomes.good[selected]}</p>
                </div>
                <div>
                  <span className="text-[#9E9E9E]">若为坏蛋：</span>
                  <p className="text-[#6B6B6B] mt-1">{outcomes.bad[selected]}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Six Elements */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-[#1B3A5F] mb-5">决策分析的六大基本要素</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {elements.map((el) => {
              const Icon = el.icon
              return (
                <div
                  key={el.title}
                  className="bg-[#F8F6F2] rounded-xl p-5 border border-[#E0DDD5] hover:border-[#C8963E] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1B3A5F] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#1B3A5F]">{el.title}</h3>
                  </div>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed mb-2">{el.desc}</p>
                  <p className="text-xs text-[#9E9E9E]">{el.example}</p>
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
          决策分析包含决策者、决策目标、决策方案、自然状态、决策结果和决策准则六个基本要素。
          它们共同构成了描述和分析一个决策问题的基础框架。在实际应用中，明确这些要素是做出科学决策的第一步。
        </p>
      </div>
    </div>
  )
}
