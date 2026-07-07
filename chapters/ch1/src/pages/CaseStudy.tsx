import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Car, Fuel, DollarSign, TrendingDown, Calculator } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function TeX({ math, display = false }: { math: string; display?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, { displayMode: display, throwOnError: false })
    } catch {
      return math
    }
  }, [math, display])
  return (
    <span
      className={display ? 'block my-3' : 'inline'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function CaseStudy() {
  const [annualIncome, setAnnualIncome] = useState(10000)
  const [carPrice, setCarPrice] = useState(5000)
  const [lifetime, setLifetime] = useState(5)
  const [dailyMileage, setDailyMileage] = useState(3)
  const [oilPrice, setOilPrice] = useState(0.2)
  const [priceMultiplier, setPriceMultiplier] = useState(4)
  const [fuelReduction, setFuelReduction] = useState(40)

  const purchaseRatio = useMemo(
    () => (carPrice / lifetime / annualIncome) * 100,
    [carPrice, lifetime, annualIncome]
  )

  const oilRatioBefore = useMemo(
    () => ((365 * dailyMileage * oilPrice) / annualIncome) * 100,
    [dailyMileage, oilPrice, annualIncome]
  )

  const oilRatioAfter = useMemo(() => oilRatioBefore * priceMultiplier, [oilRatioBefore, priceMultiplier])

  const totalBefore = purchaseRatio + oilRatioBefore
  const totalAfter = purchaseRatio + oilRatioAfter

  const targetTotal = totalBefore
  const oilRatioTarget = oilRatioAfter * (1 - fuelReduction / 100)
  const priceRatioTarget = targetTotal - oilRatioTarget
  const targetCarPrice = (annualIncome * lifetime * priceRatioTarget) / 100

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <section className="text-center py-8">
        <Badge variant="secondary" className="mb-3 bg-[#F5EDE0] text-[#1B3A5F] hover:bg-[#F5EDE0]">
          1.5
        </Badge>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1B3A5F] mb-2">
          案例分析：应对石油危机的汽车开发决策
        </h1>
        <p className="text-[#6B6B6B]">通过模拟案例体验目标分解与定量推演</p>
      </section>

      {/* Background */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-[#C8963E]" />
            <h2 className="text-lg font-semibold text-[#1B3A5F]">案例背景</h2>
          </div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-4">
            20 世纪 70 年代的石油危机使西方各国石油供应发生重大变化，油价上涨了 4 倍，
            汽车用户负担显著加重，汽车消费下降，汽车工业面临严重危机。
            与此同时，日本汽车制造商却成功渡过危机，并将其转化为进入欧美小汽车市场的机遇。
          </p>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            本案例模拟日本汽车制造商的应对思路：以“让消费者不因油价上涨而增加负担”
            这一“不变负担准则”为参考点，将总目标在“降低油价”与“降低车价”之间分解，
            最终确定汽车的开发目标。
          </p>
        </CardContent>
      </Card>

      {/* Parameters */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="w-5 h-5 text-[#C8963E]" />
            <h2 className="text-lg font-semibold text-[#1B3A5F]">参数设置</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label className="text-sm text-[#6B6B6B]">国民平均年收入（美元）</Label>
              <Input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
                className="bg-[#F8F6F2]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[#6B6B6B]">小汽车售价（美元）</Label>
              <Input
                type="number"
                value={carPrice}
                onChange={(e) => setCarPrice(Number(e.target.value))}
                className="bg-[#F8F6F2]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[#6B6B6B]">使用寿命（年）</Label>
              <Input
                type="number"
                value={lifetime}
                onChange={(e) => setLifetime(Number(e.target.value))}
                className="bg-[#F8F6F2]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[#6B6B6B]">日耗油（加仑）</Label>
              <Input
                type="number"
                value={dailyMileage}
                onChange={(e) => setDailyMileage(Number(e.target.value))}
                className="bg-[#F8F6F2]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[#6B6B6B]">油价（美元/加仑）</Label>
              <Input
                type="number"
                step={0.1}
                value={oilPrice}
                onChange={(e) => setOilPrice(Number(e.target.value))}
                className="bg-[#F8F6F2]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[#6B6B6B]">油价上涨倍数</Label>
              <Input
                type="number"
                step={0.1}
                value={priceMultiplier}
                onChange={(e) => setPriceMultiplier(Number(e.target.value))}
                className="bg-[#F8F6F2]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[#6B6B6B]">节油目标（%）</Label>
              <Input
                type="number"
                value={fuelReduction}
                onChange={(e) => setFuelReduction(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="bg-[#F8F6F2]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculations */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-5">
            <TrendingDown className="w-5 h-5 text-[#C8963E]" />
            <h2 className="text-lg font-semibold text-[#1B3A5F]">负担测算与目标分解</h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E0DDD5] mb-6">
            <table className="w-full text-sm">
              <thead className="bg-[#1B3A5F] text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">项目</th>
                  <th className="px-4 py-3 text-center font-medium">石油涨价前</th>
                  <th className="px-4 py-3 text-center font-medium">涨价后</th>
                  <th className="px-4 py-3 text-center font-medium">开发目标</th>
                </tr>
              </thead>
              <tbody className="bg-[#F8F6F2]">
                <tr className="border-b border-[#E0DDD5]">
                  <td className="px-4 py-3 font-medium text-[#1B3A5F]">购车费/年收入</td>
                  <td className="px-4 py-3 text-center text-[#6B6B6B]">{purchaseRatio.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center text-[#6B6B6B]">{purchaseRatio.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center font-semibold text-[#1B3A5F]">{priceRatioTarget.toFixed(1)}%</td>
                </tr>
                <tr className="border-b border-[#E0DDD5]">
                  <td className="px-4 py-3 font-medium text-[#1B3A5F]">油费/年收入</td>
                  <td className="px-4 py-3 text-center text-[#6B6B6B]">{oilRatioBefore.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center text-[#6B6B6B]">{oilRatioAfter.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center font-semibold text-[#1B3A5F]">{oilRatioTarget.toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#1B3A5F]">总费用/年收入</td>
                  <td className="px-4 py-3 text-center text-[#6B6B6B]">{totalBefore.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center text-[#6B6B6B]">{totalAfter.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center font-semibold text-emerald-600">{targetTotal.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-[#F8F6F2] rounded-xl p-5 border border-[#E0DDD5] space-y-3">
            <h3 className="font-medium text-[#1B3A5F]">计算说明</h3>
            <div className="text-sm text-[#6B6B6B] space-y-2">
              <p>
                <DollarSign className="w-4 h-4 inline text-[#C8963E] mr-1" />
                购车费占年收入比：
                <TeX math="\frac{\text{车价} \div \text{使用年限}}{\text{年收入}} \times 100\%" display={false} />
              </p>
              <p>
                <Fuel className="w-4 h-4 inline text-[#C8963E] mr-1" />
                油费占年收入比：
                <TeX math="\frac{365 \times \text{日耗油} \times \text{油价}}{\text{年收入}} \times 100\%" display={false} />
              </p>
              <p>
                若油耗降低 <strong>{fuelReduction}%</strong>，则目标油费负担为：
                <TeX math={`${oilRatioAfter.toFixed(1)}\\% \\times ${1 - fuelReduction / 100} = ${oilRatioTarget.toFixed(1)}\\%`} display={false} />
              </p>
              <p>
                对应可接受的车价负担为：
                <TeX math={`${targetTotal.toFixed(1)}\\% - ${oilRatioTarget.toFixed(1)}\\% = ${priceRatioTarget.toFixed(1)}\\%`} display={false} />
              </p>
              <p>
                因此，满足“不变负担准则”的目标售价为：
                <TeX math={`\\text{年收入} \\times \\text{使用年限} \\times ${(priceRatioTarget / 100).toFixed(4)} \\approx \\mathbf{${Math.round(targetCarPrice).toLocaleString()}} \\text{ 美元}`} display={false} />
              </p>
            </div>
          </div>

          <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-800 leading-relaxed">
              <strong>结论：</strong>在石油危机背景下，通过节油 {fuelReduction}% 降低油费负担，
              可将目标车价控制在约 <strong>{Math.round(targetCarPrice).toLocaleString()} 美元</strong>，
              使消费者总负担维持在涨价前水平。日本汽车制造商正是凭借低油耗、低售价的车型成功进入欧美市场。
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-[#E0DDD5]" />

      {/* Summary */}
      <div className="bg-[#1B3A5F] rounded-2xl p-6 text-white">
        <h3 className="font-semibold mb-2">本节小结</h3>
        <p className="text-sm leading-relaxed opacity-90">
          本案例展示了决策分析从问题识别、目标设定、方案推演到定量测算的完整过程。
          通过“不变负担准则”进行目标分解，将总目标在油耗与车价之间分配，体现了系统分析与定量决策的结合。
        </p>
      </div>
    </div>
  )
}
