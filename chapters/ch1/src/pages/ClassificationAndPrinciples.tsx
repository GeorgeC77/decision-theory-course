import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Building2,
  Rocket,
  Settings,
  Briefcase,
  Repeat,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Wind,
  BarChart3,
  Binary,
  Scale,
  List,
  Users,
  BookOpen,
  ShieldCheck,
  Zap,
  Target,
  Footprints,
  RotateCcw,
  MessageCircle,
} from 'lucide-react'

const classifications = [
  {
    title: '按决策者身份',
    items: [
      { icon: User, label: '个人决策', desc: '为个人目的以个人身份做出的决策，如职业选择、生活方式选择。' },
      { icon: Building2, label: '组织决策', desc: '与组织目标直接相关，价值判断应客观化和理性化。' },
    ],
  },
  {
    title: '按问题性质',
    items: [
      { icon: Rocket, label: '战略决策', desc: '解决全局性、长远性和根本性问题，如经营方向、新产品开发。' },
      { icon: Settings, label: '管理决策', desc: '为实现战略而进行的计划、组织、指挥与控制决策。' },
      { icon: Briefcase, label: '业务决策', desc: '也称战术决策，提高日常业务效率，如生产安排、存货控制。' },
    ],
  },
  {
    title: '按重复性与规范性',
    items: [
      { icon: Repeat, label: '程序化决策', desc: '经常重复、目标与标准明确，可按常规办法解决（照章办事）。' },
      { icon: Sparkles, label: '非程序化决策', desc: '不常发生、无例可循，主要依靠经验、智慧和创造力。' },
    ],
  },
  {
    title: '按自然状态',
    items: [
      { icon: CheckCircle2, label: '确定型决策', desc: '只存在唯一确定的自然状态，结果可预先确定。' },
      { icon: HelpCircle, label: '竞争型决策', desc: '自然状态之一是决策者不能控制的竞争对手。' },
      { icon: Wind, label: '风险型决策', desc: '各种自然状态出现的概率可以预测，如鸡蛋煎饼案例。' },
      { icon: BarChart3, label: '不确定型决策', desc: '自然状态概率不能确定，取决于个人喜好与价值取向。' },
    ],
  },
  {
    title: '按过程连续性',
    items: [
      { icon: Binary, label: '单项决策（静态）', desc: '解决某个时点或某段时期的决策，行动方案只有一个。' },
      { icon: List, label: '序列决策（动态）', desc: '一系列时间上有先后顺序、相互关联的决策。' },
    ],
  },
  {
    title: '按目标数量',
    items: [
      { icon: Target, label: '单目标决策', desc: '目标单一，制定实施较容易，但可能带有片面性。' },
      { icon: Scale, label: '多目标决策', desc: '目标之间存在相互联系与制约，如商品“物美”又“价廉”。' },
    ],
  },
  {
    title: '按量化程度',
    items: [
      { icon: Users, label: '定性决策', desc: '因素不能用确切数量表示，依靠逻辑思维和判断推理。' },
      { icon: BookOpen, label: '定量决策', desc: '可量化成数学模型并进行定量分析，易找出最优方案。' },
    ],
  },
]

const principles = [
  { icon: BookOpen, title: '信息准全原则', desc: '准确、完备的信息是决策的基础，要及时掌握充足可靠的信息。' },
  { icon: Zap, title: '效益原则', desc: '追求决策取得的效益，同时提高决策过程本身的经济性。' },
  { icon: Settings, title: '系统原则', desc: '局部服从整体、当前与长远结合，谋求决策系统与环境的动态平衡。' },
  { icon: Sparkles, title: '科学原则', desc: '运用科学的理论、方法和手段，提高决策的科学性。' },
  { icon: ShieldCheck, title: '可行原则', desc: '决策方案必须可行，充分考虑人才、资金、设备、原料、技术等限制。' },
  { icon: CheckCircle2, title: '选优原则', desc: '根据价值准则权衡利弊，选出最优或满意方案。' },
  { icon: Footprints, title: '行动原则', desc: '把方案落实到具体行动规划上并付诸实施，才能检验其有效性。' },
  { icon: RotateCcw, title: '反馈原则', desc: '根据执行反馈及时调整，保持决策目标的动态平衡。' },
  { icon: MessageCircle, title: '民主原则', desc: '发挥集体智慧，重视智囊和信息作用，实行现代民主决策体制。' },
]

export default function ClassificationAndPrinciples() {
  const [activePrinciple, setActivePrinciple] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <section className="text-center py-8">
        <Badge variant="secondary" className="mb-3 bg-[#F5EDE0] text-[#1B3A5F] hover:bg-[#F5EDE0]">
          1.2
        </Badge>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A5F] mb-2">
          决策分析的分类及其基本原则
        </h1>
        <p className="text-[#6B6B6B]">多角度认识决策，掌握科学决策的准则</p>
      </section>

      {/* Classification */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-[#1B3A5F] mb-5">决策分析的分类</h2>
          <div className="space-y-6">
            {classifications.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-[#9E9E9E] uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.label}
                        className="bg-[#F8F6F2] rounded-xl p-4 border border-[#E0DDD5] hover:border-[#C8963E] transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-[#C8963E]" />
                          <span className="font-medium text-[#1B3A5F]">{item.label}</span>
                        </div>
                        <p className="text-xs text-[#6B6B6B] leading-relaxed">{item.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-[#E0DDD5]" />

      {/* Principles */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-[#1B3A5F] mb-2">决策分析的基本原则</h2>
          <p className="text-sm text-[#6B6B6B] mb-5">
            正确的决策除了依赖决策者的经验、智慧和才能外，还必须遵循科学的决策原则。
            点击卡片查看详细说明。
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {principles.map((p, idx) => {
              const Icon = p.icon
              const isActive = activePrinciple === idx
              return (
                <button
                  key={p.title}
                  onClick={() => setActivePrinciple(isActive ? null : idx)}
                  className={`text-left rounded-xl p-4 border transition-all ${
                    isActive
                      ? 'bg-[#1B3A5F] text-white border-[#1B3A5F]'
                      : 'bg-[#F8F6F2] border-[#E0DDD5] hover:border-[#C8963E]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#C8963E]' : 'text-[#1B3A5F]'}`} />
                    <span className="font-medium">{p.title}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${isActive ? 'opacity-90' : 'text-[#6B6B6B]'}`}>
                    {p.desc}
                  </p>
                </button>
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
          决策可从决策者身份、问题性质、自然状态、过程连续性、目标数量和量化程度等角度进行分类。
          科学决策应遵循信息准全、效益、系统、科学、可行、选优、行动、反馈和民主九大原则。
        </p>
      </div>
    </div>
  )
}
