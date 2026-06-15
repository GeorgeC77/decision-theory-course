import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  RotateCcw,
  Lightbulb,
  CheckCircle,
  BarChart3,
  BookOpen,
  Award,
} from 'lucide-react';

/* ── default data ── */
const DEFAULT_PROBS = [0.3, 0.5, 0.2];
const DEFAULT_PAYOFFS = [
  [20, 12, 8],
  [16, 16, 10],
  [12, 12, 12],
];
const SCHEME_NAMES = ['A', 'B', 'C'];
const STATE_LABELS = ['θ₁（好）', 'θ₂（中）', 'θ₃（差）'];

/* ── animations ── */
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export default function ExpectedValueCriterion() {
  /* ── state ── */
  const [probs, setProbs] = useState<number[]>([...DEFAULT_PROBS]);
  const [payoffs, setPayoffs] = useState<number[][]>(
    DEFAULT_PAYOFFS.map((row) => [...row])
  );
  const [shakeKey, setShakeKey] = useState(0);

  /* ── computed ── */
  const probSum = useMemo(() => {
    return probs.reduce((s, p) => s + (isNaN(p) ? 0 : p), 0);
  }, [probs]);

  const probValid = useMemo(() => {
    return Math.abs(probSum - 1) < 0.001;
  }, [probSum]);

  const expectedValues = useMemo(() => {
    return payoffs.map((row) =>
      row.reduce((sum, val, j) => sum + val * (isNaN(probs[j]) ? 0 : probs[j]), 0)
    );
  }, [payoffs, probs]);

  const maxEV = useMemo(() => Math.max(...expectedValues), [expectedValues]);
  const optimalIndex = useMemo(
    () => expectedValues.findIndex((ev) => ev === maxEV),
    [expectedValues, maxEV]
  );

  /* EVPI: Ep = sum_j P(theta_j) * max_i(d_ij) */
  const ep = useMemo(() => {
    let sum = 0;
    for (let j = 0; j < 3; j++) {
      const colMax = Math.max(...payoffs.map((row) => row[j]));
      sum += probs[j] * colMax;
    }
    return sum;
  }, [payoffs, probs]);

  const evpi = useMemo(() => ep - maxEV, [ep, maxEV]);

  /* Per-state optimal for perfect info table */
  const stateOptimals = useMemo(() => {
    return [0, 1, 2].map((j) => {
      const col = payoffs.map((row) => row[j]);
      const maxVal = Math.max(...col);
      const schemeIdx = col.findIndex((v) => v === maxVal);
      return {
        state: STATE_LABELS[j],
        prob: probs[j],
        scheme: `方案 ${SCHEME_NAMES[schemeIdx]}`,
        maxPayoff: maxVal,
        isOptimal: true,
      };
    });
  }, [payoffs, probs]);

  /* ── handlers ── */
  const handleProbChange = useCallback(
    (idx: number, value: string) => {
      const num = parseFloat(value);
      const next = [...probs];
      next[idx] = isNaN(num) ? 0 : num;
      setProbs(next);
      if (Math.abs(next.reduce((s, p) => s + p, 0) - 1) >= 0.001) {
        setShakeKey((k) => k + 1);
      }
    },
    [probs]
  );

  const handlePayoffChange = useCallback(
    (schemeIdx: number, stateIdx: number, value: string) => {
      const num = parseFloat(value);
      const next = payoffs.map((row) => [...row]);
      next[schemeIdx][stateIdx] = isNaN(num) ? 0 : num;
      setPayoffs(next);
    },
    [payoffs]
  );

  const handleReset = useCallback(() => {
    setProbs([...DEFAULT_PROBS]);
    setPayoffs(DEFAULT_PAYOFFS.map((row) => [...row]));
  }, []);

  /* ── bar chart data ── */
  const chartData = useMemo(
    () =>
      SCHEME_NAMES.map((name, i) => ({
        name: `方案 ${name}`,
        value: expectedValues[i],
        isOptimal: i === optimalIndex,
      })),
    [expectedValues, optimalIndex]
  );

  const chartMax = useMemo(() => {
    const m = Math.max(...chartData.map((d) => d.value));
    return Math.ceil(m / 2) * 2 + 2;
  }, [chartData]);

  /* ── tooltip state ── */
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  return (
    <div className="space-y-6 mt-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-[22px] h-[22px] text-[#C8963E]" />
            <h2 className="text-[22px] font-bold text-[#2B2B2B]">
              期望值准则 (Expected Value Criterion)
            </h2>
          </div>
          <p className="text-[13px] text-[#6B6B6B] mt-1">
            基于期望值选择最优决策方案，支持实时编辑收益矩阵并自动计算 EVPI
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#F0EDE8] px-3 py-2 rounded-lg transition-all cursor-pointer self-start sm:self-auto active:scale-[0.97]"
        >
          <RotateCcw className="w-4 h-4" />
          重置数据
        </button>
      </div>

      {/* ── Card 1: Decision Matrix ── */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[17px] font-semibold text-[#2B2B2B]">决策收益矩阵</h3>
          <span className="bg-[#F5EDE0] text-[#C8963E] border border-[#C8963E]/30 rounded-full px-2 py-0.5 text-xs">
            可编辑
          </span>
        </div>
        <p className="text-[13px] text-[#6B6B6B] mb-4">
          修改概率和损益值，表格将自动重新计算各方案期望值
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="决策收益矩阵">
            <thead>
              <tr className="bg-[#1B3A5F] text-white h-11">
                <th className="px-4 py-2 text-left font-semibold rounded-tl-xl">方案 \ 状态</th>
                {STATE_LABELS.map((label) => (
                  <th key={label} className="px-4 py-2 text-center font-semibold">
                    {label}
                  </th>
                ))}
                <th className="px-4 py-2 text-center font-semibold">E(dᵢ) — 期望值</th>
                <th className="px-4 py-2 text-center font-semibold rounded-tr-xl">结果</th>
              </tr>
            </thead>
            <tbody>
              {/* Probability row */}
              <tr className="bg-[#F0EDE8] h-12">
                <td className="px-4 py-2 font-medium text-[#2B2B2B]">概率 P(θⱼ)</td>
                {probs.map((p, j) => (
                  <td key={j} className="px-4 py-2 text-center">
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={1}
                      value={p}
                      onChange={(e) => handleProbChange(j, e.target.value)}
                      className={
                        'w-16 h-9 border rounded-lg text-center text-sm font-medium tabular-nums px-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20 focus:border-[#2A4A73] ' +
                        (probValid ? 'border-[#E0DDD5]' : 'border-[#F44336]')
                      }
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-center text-[#9E9E9E]">—</td>
                <td className="px-4 py-2 text-center text-[#9E9E9E]">—</td>
              </tr>

              {/* Scheme rows */}
              {SCHEME_NAMES.map((name, i) => {
                const isOptimal = i === optimalIndex;
                return (
                  <tr
                    key={name}
                    className={
                      'h-12 border-b border-[#EFEBE5] transition-colors hover:bg-[#F0EDE8]/50 ' +
                      (isOptimal ? 'bg-[#E8F5E9]/50 border-l-[3px] border-l-[#4CAF50]' : 'bg-white')
                    }
                  >
                    <td className="px-4 py-2 font-medium text-[#2B2B2B]">
                      方案 {name}
                    </td>
                    {payoffs[i].map((val, j) => (
                      <td key={j} className="px-4 py-2 text-center">
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => handlePayoffChange(i, j, e.target.value)}
                          className="w-16 h-9 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium tabular-nums px-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]/20 focus:border-[#2A4A73]"
                        />
                      </td>
                    ))}
                    <td
                      className={
                        'px-4 py-2 text-center font-bold tabular-nums ' +
                        (isOptimal ? 'text-[#4CAF50]' : 'text-[#2B2B2B]')
                      }
                    >
                      {expectedValues[i].toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {isOptimal && (
                        <span className="inline-flex items-center gap-1 bg-[#E8F5E9] text-[#4CAF50] border border-[#4CAF50]/30 rounded-full px-2 py-0.5 text-xs font-semibold">
                          <Award className="w-3 h-3" />
                          最优
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Probability validation */}
        <div
          key={shakeKey}
          className={
            'text-right mt-3 text-sm font-medium tabular-nums ' +
            (probValid ? 'text-[#4CAF50]' : 'text-[#F44336] animate-shake')
          }
        >
          概率验证：ΣP = {probSum.toFixed(2)}
          {!probValid && (
            <span className="ml-2 text-xs">（概率之和必须等于 1.00）</span>
          )}
        </div>
      </motion.div>

      {/* ── Cards 2 & 3: EVPI + Perfect Info Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EVPI Card */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-[#C8963E]" />
            <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
              完整情报价值 (EVPI)
            </h3>
          </div>
          <p className="text-xs text-[#9E9E9E] mb-3">Expected Value of Perfect Information</p>

          <div className="space-y-2 font-mono text-sm text-[#6B6B6B] tabular-nums">
            <div className="flex justify-between">
              <span>完整情报期望收益 Eₚ：</span>
              <span className="font-semibold">
                Eₚ = Σ P(θⱼ) × maxᵢ(dᵢⱼ) = {ep.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>最优方案期望值：</span>
              <span className="font-semibold">max(E(dᵢ)) = {maxEV.toFixed(2)}</span>
            </div>
            <div className="border-t border-[#E0DDD5] pt-2 flex justify-between items-center">
              <span className="font-semibold">EVPI = Eₚ − max(E(dᵢ)) =</span>
              <span className="text-2xl font-bold text-[#C8963E] tabular-nums">
                {evpi.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Economic meaning */}
          <div className="mt-4 bg-[#C8963E]/5 rounded-lg p-4 text-sm leading-relaxed">
            获得完整情报后，期望收益最多可增加{' '}
            <span className="font-bold text-[#C8963E]">{evpi.toFixed(2)}</span>{' '}
            个单位。若情报成本低于此值，则获取情报是值得的。
          </div>
        </motion.div>

        {/* Perfect Info Optimal Schemes Table */}
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-[#C8963E]" />
            <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
              完整情报下各状态最优方案
            </h3>
          </div>
          <p className="text-[13px] text-[#6B6B6B] mb-4">
            若已知未来状态，则每期选择对应最优方案
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1B3A5F] text-white h-11">
                  <th className="px-4 py-2 text-left font-semibold rounded-tl-xl">
                    自然状态 θⱼ
                  </th>
                  <th className="px-4 py-2 text-center font-semibold">概率 P(θⱼ)</th>
                  <th className="px-4 py-2 text-center font-semibold">最优方案</th>
                  <th className="px-4 py-2 text-center font-semibold rounded-tr-xl">
                    最大收益 maxᵢ(dᵢⱼ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {stateOptimals.map((row, idx) => (
                  <tr
                    key={idx}
                    className="h-12 bg-white border-b border-[#EFEBE5] hover:bg-[#F0EDE8]/50"
                  >
                    <td className="px-4 py-2 font-medium">{row.state}</td>
                    <td className="px-4 py-2 text-center tabular-nums">{row.prob}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-[#4CAF50] font-semibold">{row.scheme}</span>
                      <span className="ml-2 inline-flex items-center bg-[#E8F5E9] text-[#4CAF50] border border-[#4CAF50]/30 rounded-full px-2 py-0.5 text-xs font-semibold">
                        最优
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center font-semibold tabular-nums">
                      {row.maxPayoff}
                    </td>
                  </tr>
                ))}
                {/* Ep row */}
                <tr className="h-12 bg-[#F0EDE8] font-bold">
                  <td className="px-4 py-2">加权合计 Eₚ</td>
                  <td className="px-4 py-2 text-center">—</td>
                  <td className="px-4 py-2 text-center">—</td>
                  <td className="px-4 py-2 text-center tabular-nums text-[#2B2B2B]">
                    {ep.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ── Card 4: Bar Chart ── */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-[#C8963E]" />
          <h3 className="text-[17px] font-semibold text-[#2B2B2B]">各方案期望值对比</h3>
        </div>
        <p className="text-[13px] text-[#6B6B6B] mb-4">
          绿色柱子为最优方案，蓝色为其他方案
        </p>

        {/* SVG Bar Chart */}
        <div className="w-full" style={{ height: 240, position: 'relative' }}>
          <svg
            viewBox="0 0 400 200"
            className="w-full h-full"
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Y-axis grid lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = 180 - (i * chartMax) / 4 * (160 / chartMax);
              return (
                <g key={i}>
                  <line
                    x1={40}
                    y1={y}
                    x2={380}
                    y2={y}
                    stroke="#EFEBE5"
                    strokeWidth={1}
                    strokeDasharray="4,3"
                  />
                  <text
                    x={30}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-[#9E9E9E]"
                  >
                    {((chartMax / 4) * i).toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* X-axis line */}
            <line x1={40} y1={180} x2={380} y2={180} stroke="#E0DDD5" strokeWidth={1} />

            {/* Bars */}
            {chartData.map((d, i) => {
              const barHeight = (d.value / chartMax) * 160;
              const barX = 65 + i * 110;
              const barY = 180 - barHeight;
              const barW = 60;
              const fill = d.isOptimal ? '#4CAF50' : '#1B3A5F';

              return (
                <g key={d.name}>
                  {/* Bar with animation */}
                  <motion.rect
                    x={barX}
                    width={barW}
                    rx={4}
                    fill={fill}
                    initial={{ height: 0, y: 180 }}
                    animate={{ height: barHeight, y: barY }}
                    transition={{
                      delay: 0.3 + i * 0.1,
                      duration: 0.6,
                      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as SVGRectElement).getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                        text: `${d.name}: E = ${d.value.toFixed(2)}`,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                  />
                  {/* Value label */}
                  <motion.text
                    x={barX + barW / 2}
                    y={barY - 8}
                    textAnchor="middle"
                    className="text-xs font-bold fill-[#2B2B2B] tabular-nums"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                  >
                    {d.value.toFixed(2)}
                  </motion.text>
                  {/* X-axis label */}
                  <text
                    x={barX + barW / 2}
                    y={196}
                    textAnchor="middle"
                    className="text-xs fill-[#6B6B6B]"
                  >
                    {d.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute pointer-events-none bg-[#2B2B2B] text-white text-xs rounded-lg px-3 py-1.5 shadow-lg z-10 -translate-x-1/2 -translate-y-full"
              style={{ left: tooltip.x - 0, top: tooltip.y - 0 }}
            >
              {tooltip.text}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#2B2B2B]" />
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#4CAF50]" />
              <span className="text-xs text-[#6B6B6B]">最优方案</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#1B3A5F]" />
              <span className="text-xs text-[#6B6B6B]">其他方案</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Card 5: Knowledge ── */}
      <motion.div
        custom={4}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#1B3A5F]/[0.03] border border-[#1B3A5F]/10 rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-[#1B3A5F]" />
          <h3 className="text-[17px] font-semibold text-[#2B2B2B]">
            知识点：期望值准则
          </h3>
        </div>

        <div className="space-y-3 text-sm leading-relaxed">
          <div>
            <span className="font-semibold text-[#2B2B2B]">适用条件：</span>
            <span className="text-[#6B6B6B]">
              适用于各自然状态概率已知且稳定、决策者追求长期平均收益最大化的场景。
            </span>
          </div>
          <div>
            <span className="font-semibold text-[#2B2B2B]">EVPI 经济含义：</span>
            <span className="text-[#6B6B6B]">
              EVPI 表示获取完美信息所能带来的最大期望收益增量。当实际信息获取成本 &lt; EVPI 时，搜集信息在经济上是合理的。
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-3">
            <code className="bg-white border border-[#E0DDD5] rounded-lg px-3 py-1.5 font-mono text-sm text-[#1B3A5F]">
              E(dᵢ) = Σⱼ P(θⱼ) × dᵢⱼ
            </code>
            <code className="bg-white border border-[#E0DDD5] rounded-lg px-3 py-1.5 font-mono text-sm text-[#1B3A5F]">
              EVPI = Eₚ − maxᵢ(E(dᵢ))
            </code>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
