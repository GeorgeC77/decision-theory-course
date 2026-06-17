import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  BarChart3,
  Lightbulb,
  BookOpen,
  Pencil,
  RotateCcw,
  SlidersHorizontal,
  RefreshCw,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Matrix = number[][];

interface CriterionResult {
  name: string;
  alias: string;
  method: string;
  formula: string;
  a1Result: string;
  a2Result: string;
  a3Result: string;
  best: string[];
  personality: string;
  color: string;
  barColor: string;
  value: number;
}

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

/* ------------------------------------------------------------------ */
/*  Default data                                                       */
/* ------------------------------------------------------------------ */
const DEFAULT_MATRIX: Matrix = [
  [120, 80, -40],
  [80, 60, 20],
  [50, 40, 30],
];

const SCENARIOS = ['S1(畅销)', 'S2(一般)', 'S3(滞销)'];
const ALTERNATIVES = ['A1(大批量)', 'A2(中批量)', 'A3(小批量)'];


/* ------------------------------------------------------------------ */
/*  Regret matrix calculation                                          */
/* ------------------------------------------------------------------ */
function computeRegretMatrix(m: Matrix): Matrix {
  const cols = m[0].length;
  const colMax: number[] = [];
  for (let j = 0; j < cols; j++) {
    let max = -Infinity;
    for (let i = 0; i < m.length; i++) {
      if (m[i][j] > max) max = m[i][j];
    }
    colMax.push(max);
  }
  return m.map((row) => row.map((v, j) => colMax[j] - v));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CaseStudy() {
  const [matrix, setMatrix] = useState<Matrix>(DEFAULT_MATRIX.map((r) => [...r]));
  const [alpha, setAlpha] = useState(0.6);

  /* ---- real-time calculations ---- */
  const results = useMemo<CriterionResult[]>(() => {
    const cols = matrix[0].length;

    // Row-wise max and min
    const rowMax = matrix.map((r) => Math.max(...r));
    const rowMin = matrix.map((r) => Math.min(...r));

    // Optimistic (Maximax)
    const optVals = [...rowMax];
    const optBestVal = Math.max(...optVals);
    const optBestIdx = optVals.map((v, i) => (Math.abs(v - optBestVal) < 1e-9 ? i : -1)).filter((i) => i !== -1);

    // Pessimistic (Maximin)
    const pesVals = [...rowMin];
    const pesBestVal = Math.max(...pesVals);
    const pesBestIdx = pesVals.map((v, i) => (Math.abs(v - pesBestVal) < 1e-9 ? i : -1)).filter((i) => i !== -1);

    // Compromise (Hurwicz)
    const compVals = rowMax.map((mx, i) => alpha * mx + (1 - alpha) * rowMin[i]);
    const compBestVal = Math.max(...compVals);
    const compBestIdx = compVals.map((v, i) => (Math.abs(v - compBestVal) < 1e-9 ? i : -1)).filter((i) => i !== -1);

    // Regret (Savage)
    const regret = computeRegretMatrix(matrix);
    const rowRegretMax = regret.map((r) => Math.max(...r));
    const savageBestVal = Math.min(...rowRegretMax);
    const savageBestIdx = rowRegretMax.map((v, i) => (Math.abs(v - savageBestVal) < 1e-9 ? i : -1)).filter((i) => i !== -1);

    // Laplace (Equal probability)
    const lapVals = matrix.map((r) => r.reduce((a, b) => a + b, 0) / cols);
    const lapBestVal = Math.max(...lapVals);
    const lapBestIdx = lapVals.map((v, i) => (Math.abs(v - lapBestVal) < 1e-9 ? i : -1)).filter((i) => i !== -1);

    const mk = (
      name: string,
      alias: string,
      method: string,
      formula: string,
      vals: number[],
      bestIdx: number[],
      personality: string,
      color: string,
      barColor: string,
    ): CriterionResult => ({
      name,
      alias,
      method,
      formula,
      a1Result: vals[0].toFixed(1),
      a2Result: vals[1].toFixed(1),
      a3Result: vals[2].toFixed(1),
      best: bestIdx.map((i) => ALTERNATIVES[i]),
      personality,
      color,
      barColor,
      value: Math.round(vals[bestIdx[0]]),
    });

    return [
      mk('乐观准则(Maximax)', 'Maximax', '每行取最大值，再取最大', 'maxᵢ{maxⱼ(dᵢⱼ)}', optVals, optBestIdx, '冒险型', '#F44336', '#F44336'),
      mk('悲观准则(Maximin)', 'Maximin/Wald', '每行取最小值，再取最大', 'maxᵢ{minⱼ(dᵢⱼ)}', pesVals, pesBestIdx, '保守型', '#3b82f6', '#3b82f6'),
      mk(`折中准则(Hurwicz, α=${alpha})`, 'Hurwicz', `${alpha}×最大值 + ${(1 - alpha).toFixed(1)}×最小值`, 'α×max+(1−α)×min', compVals, compBestIdx, '中间型', '#8b5cf6', '#8b5cf6'),
      mk('后悔值准则(Savage)', 'Savage', '构建后悔矩阵，取最小最大后悔值', 'minᵢ{maxⱼ(Rᵢⱼ)}', rowRegretMax, savageBestIdx, '稳健型', '#4CAF50', '#4CAF50'),
      mk('等概率准则(Laplace)', 'Laplace', '每行取平均值，再取最大', 'maxᵢ{avg(dᵢⱼ)}', lapVals, lapBestIdx, '中立型', '#C8963E', '#C8963E'),
    ];
  }, [matrix, alpha]);

  // Chart data
  const chartData = useMemo(
    () =>
      results.map((r) => ({
        name: r.name.split('(')[0],
        fullName: r.name,
        value: r.value,
        best: r.best.join('、'),
        color: r.barColor,
      })),
    [results],
  );

  // Best-scheme tally (each criterion counts 1 for every tied best scheme)
  const tally = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach((r) => {
      r.best.forEach((alt) => {
        counts[alt] = (counts[alt] || 0) + 1;
      });
    });
    return counts;
  }, [results]);

  // Regret matrix for display
  const regretMatrix = useMemo(() => computeRegretMatrix(matrix), [matrix]);

  /* ---- handlers ---- */
  const updateCell = (i: number, j: number, val: string) => {
    const n = parseFloat(val);
    if (Number.isNaN(n) || val.trim() === '') {
      // Allow empty for editing, store as NaN placeholder
      const copy = matrix.map((r) => [...r]);
      copy[i][j] = 0;
      setMatrix(copy);
      return;
    }
    const copy = matrix.map((r) => [...r]);
    copy[i][j] = n;
    setMatrix(copy);
  };

  const reset = () => {
    setMatrix(DEFAULT_MATRIX.map((r) => [...r]));
    setAlpha(0.6);
  };

  /* ---- render helpers ---- */
  const SectionCard = ({
    children,
    className,
    border = false,
  }: {
    children: React.ReactNode;
    className?: string;
    border?: boolean;
  }) => (
    <motion.div
      variants={itemVariants}
      className={cn(
        'bg-white rounded-xl p-6',
        border && 'border-2 border-[#1B3A5F]',
        className,
      )}
      style={{ boxShadow: '0 2px 12px rgba(27,58,95,0.06)' }}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: '#F8F6F2' }}>
      {/* ============================ */}
      {/* Main Content                 */}
      {/* ============================ */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 py-6 pb-16 flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ---- Page Title ---- */}
        <motion.div variants={itemVariants} className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Briefcase size={22} style={{ color: '#C8963E' }} />
            <h1
              className="text-2xl font-semibold"
              style={{
                color: '#1B3A5F',
                fontFamily: "'Noto Serif SC', serif",
              }}
            >
              4.7 案例分析
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            综合运用不确定型决策准则
          </p>
        </motion.div>

        {/* ---- Section 1: Case Description ---- */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={18} style={{ color: '#1B3A5F' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              投资决策案例
            </h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#1B3A5F', lineHeight: 1.8 }}>
            某企业计划推出新产品，面临三种市场状态（畅销 S1、一般 S2、滞销 S3），考虑三种生产方案（大批量生产 A1、中批量生产 A2、小批量生产 A3）。由于市场变化莫测，无法估计各市场状态出现的概率。
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: '#1B3A5F', lineHeight: 1.8 }}>
            各方案在不同市场状态下的预期收益（万元）如下表所示，决策者需要根据五种不同的决策准则来选择最优方案。
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['不确定型决策', '概率未知', '五种准则对比'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: '#F8F6F2', color: '#5d6d7e' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </SectionCard>

        {/* ---- Section 2: Editable Payoff Matrix ---- */}
        <SectionCard>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} style={{ color: '#1B3A5F' }} />
              <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
                决策收益矩阵
              </h2>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(200,150,62,0.12)', color: '#C8963E' }}
              >
                <Pencil size={11} />
                可编辑
              </span>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#F8F6F2', color: '#1B3A5F' }}
            >
              <RotateCcw size={13} />
              重置数据
            </button>
          </div>
          <p className="text-xs mb-4" style={{ color: '#6B6B6B' }}>
            修改收益值，下方综合对比表将自动更新所有准则的计算结果
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#1B3A5F' }}>
                  <th className="px-4 py-3 text-left text-white text-sm font-medium">方案 \ 状态</th>
                  {SCENARIOS.map((s) => (
                    <th key={s} className="px-4 py-3 text-center text-white text-sm font-medium">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: i % 2 === 0 ? '#fff' : '#f8f6f3',
                    }}
                  >
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: '#1B3A5F' }}
                    >
                      {ALTERNATIVES[i]}
                    </td>
                    {row.map((val, j) => (
                      <td key={j} className="px-4 py-2 text-center">
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => updateCell(i, j, e.target.value)}
                          className="w-20 px-2 py-1.5 text-center text-sm rounded-md border transition-all duration-200 focus:outline-none"
                          style={{
                            borderColor: '#E0DDD5',
                            backgroundColor: '#fff',
                            color: '#1B3A5F',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#1B3A5F';
                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(27,58,95,0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#E0DDD5';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alpha slider for compromise criterion */}
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#f8f6f3' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: '#1B3A5F' }}>
                <SlidersHorizontal size={14} className="inline mr-1" />
                折中系数 α = {alpha.toFixed(1)}
              </span>
              <span className="text-xs" style={{ color: '#6B6B6B' }}>
                调整折中准则的乐观程度
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: '#1B3A5F',
                background: `linear-gradient(to right, #1B3A5F 0%, #1B3A5F ${alpha * 100}%, #E0DDD5 ${alpha * 100}%, #E0DDD5 100%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs" style={{ color: '#6B6B6B' }}>
                悲观 (α=0)
              </span>
              <span className="text-xs" style={{ color: '#6B6B6B' }}>
                乐观 (α=1)
              </span>
            </div>
          </div>

          {/* Regret matrix display */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
              <RefreshCw size={14} className="inline mr-1" />
              后悔值矩阵（用于后悔值准则计算）
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#2A4A73' }}>
                    <th className="px-3 py-2 text-left text-white text-xs font-medium">方案</th>
                    {SCENARIOS.map((s) => (
                      <th key={s} className="px-3 py-2 text-center text-white text-xs font-medium">
                        {s}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center text-white text-xs font-medium">最大后悔值</th>
                  </tr>
                </thead>
                <tbody>
                  {regretMatrix.map((row, i) => {
                    const maxReg = Math.max(...row);
                    const minMax = Math.min(...regretMatrix.map(r => Math.max(...r)));
                    return (
                      <tr
                        key={i}
                        style={{
                          backgroundColor: i % 2 === 0 ? '#fff' : '#f8f6f3',
                        }}
                      >
                        <td className="px-3 py-2 text-xs font-medium" style={{ color: '#1B3A5F' }}>
                          {ALTERNATIVES[i]}
                        </td>
                        {row.map((v, j) => (
                          <td
                            key={j}
                            className="px-3 py-2 text-center text-xs font-mono"
                            style={{ color: v === 0 ? '#27ae60' : '#2c3e60' }}
                          >
                            {v}
                          </td>
                        ))}
                        <td
                          className="px-3 py-2 text-center text-xs font-mono font-semibold"
                          style={{ color: maxReg === minMax ? '#e74c3c' : '#1B3A5F' }}
                        >
                          {maxReg}
                          {maxReg === minMax && (
                            <span className="ml-1 text-xs">(最小)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

        {/* ---- Section 3: Comprehensive Comparison Table ---- */}
        <SectionCard border>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} style={{ color: '#1B3A5F' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              五种决策准则综合对比
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: '#6B6B6B' }}>
            同一决策问题，不同准则可能给出不同最优方案
          </p>

          <motion.div
            className="overflow-x-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#1B3A5F' }}>
                  <th className="px-3 py-3 text-left text-white text-xs font-medium min-w-[130px]">决策准则</th>
                  <th className="px-3 py-3 text-left text-white text-xs font-medium min-w-[120px]">计算方法</th>
                  <th className="px-3 py-3 text-center text-white text-xs font-medium">A1结果</th>
                  <th className="px-3 py-3 text-center text-white text-xs font-medium">A2结果</th>
                  <th className="px-3 py-3 text-center text-white text-xs font-medium">A3结果</th>
                  <th className="px-3 py-3 text-center text-white text-xs font-medium min-w-[90px]">最优方案</th>
                  <th className="px-3 py-3 text-center text-white text-xs font-medium min-w-[80px]">决策者类型</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <motion.tr
                    key={r.name}
                    variants={tableRowVariants}
                    className="transition-colors duration-200 hover:bg-[#F8F6F2]"
                    style={{
                      backgroundColor:
                        idx % 2 === 0 ? '#fff' : '#f8f6f3',
                    }}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="text-xs font-semibold" style={{ color: '#1B3A5F' }}>
                          {r.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: '#f8f6f3', color: '#2A4A73' }}
                      >
                        {r.formula}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs font-mono" style={{ color: '#1B3A5F' }}>
                      {r.a1Result}
                    </td>
                    <td className="px-3 py-3 text-center text-xs font-mono" style={{ color: '#1B3A5F' }}>
                      {r.a2Result}
                    </td>
                    <td className="px-3 py-3 text-center text-xs font-mono" style={{ color: '#1B3A5F' }}>
                      {r.a3Result}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {r.best.map((alt) => (
                          <span
                            key={alt}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: 'rgba(76,175,80,0.1)',
                              color: '#4CAF50',
                            }}
                          >
                            <Check size={12} />
                            {alt}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${r.color}15`,
                          color: r.color,
                        }}
                      >
                        {r.personality}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Tally summary */}
          <div
            className="mt-5 p-4 rounded-lg"
            style={{ backgroundColor: '#faf3e0' }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
              方案推荐统计：
            </h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(tally)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          name.startsWith('A1')
                            ? '#e74c3c'
                            : name.startsWith('A2')
                              ? '#3498db'
                              : '#2ecc71',
                      }}
                    />
                    <span className="text-xs font-medium" style={{ color: '#1B3A5F' }}>
                      {name} — 在 {count} 种准则中列为最优（含并列）
                    </span>
                  </div>
                ))}
            </div>
            <p className="text-xs mt-3" style={{ color: '#1B3A5F' }}>
              {(() => {
                const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
                if (sorted.length === 0) return '请编辑收益矩阵以查看推荐结果。';
                const details = sorted.map(([name, c]) => `${name}(${c})`).join('、');
                return `多数准则推荐结果仅作为稳健性参考，不代表严格意义上的综合最优。不同准则反映不同风险态度，最终选择仍需结合决策者偏好。统计：${details}。`;
              })()}
            </p>
          </div>
        </SectionCard>

        {/* ---- Section 4: Bar Chart ---- */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color: '#1B3A5F' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              各准则最优结果值对比
            </h2>
          </div>

          <div className="w-full" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B6B6B' }}
                  axisLine={{ stroke: '#E0DDD5' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B6B6B' }}
                  axisLine={{ stroke: '#E0DDD5' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number, _name: string, props: any) => [
                    `结果值: ${value}`,
                    `最优: ${props.payload.best}`,
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E0DDD5',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs mt-2" style={{ color: '#6B6B6B' }}>
            注：各准则结果值含义不同（收益 / 后悔值 / 期望值），柱状图仅展示各准则的数值输出，不代表方案优劣的绝对排序。
          </p>
        </SectionCard>

        {/* ---- Section 5: Decision Flow Chart ---- */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              如何选择决策准则？
            </h2>
          </div>

          {/* Flowchart built with HTML/CSS */}
          <motion.div
            className="flex flex-col items-center gap-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Root node */}
            <motion.div
              variants={itemVariants}
              className="px-6 py-3 rounded-lg text-sm font-semibold text-white text-center"
              style={{ backgroundColor: '#1B3A5F', minWidth: 180 }}
            >
              不确定型决策
            </motion.div>

            {/* Arrow down */}
            <motion.div variants={itemVariants} className="flex justify-center">
              <ChevronDown size={20} style={{ color: '#C8963E' }} />
            </motion.div>

            {/* Three branches */}
            <motion.div variants={itemVariants} className="w-full grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-full px-3 py-2 rounded-lg text-xs font-medium text-center"
                  style={{ backgroundColor: '#fff5e6', border: '1.5px solid #f0e6cc', color: '#1B3A5F' }}
                >
                  决策者态度
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-full px-3 py-2 rounded-lg text-xs font-medium text-center"
                  style={{ backgroundColor: '#e8f4fd', border: '1.5px solid #c5dff5', color: '#1B3A5F' }}
                >
                  风险态度
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-full px-3 py-2 rounded-lg text-xs font-medium text-center"
                  style={{ backgroundColor: '#f0f0ff', border: '1.5px solid #d0d0f0', color: '#1B3A5F' }}
                >
                  风险偏好
                </div>
              </div>
            </motion.div>

            {/* Second level */}
            <motion.div variants={itemVariants} className="w-full grid grid-cols-3 gap-3">
              {/* Optimistic branch */}
              <div className="flex flex-col gap-2">
                <div
                  className="px-3 py-2 rounded-lg text-xs font-medium text-center"
                  style={{ backgroundColor: '#ffeaea', borderLeft: '3px solid #e74c3c', color: '#1B3A5F' }}
                >
                  极度乐观
                  <br />
                  追求最大回报
                </div>
                <div className="flex justify-center">
                  <ChevronDown size={16} style={{ color: '#C8963E' }} />
                </div>
                <div
                  className="px-3 py-2.5 rounded-lg text-center"
                  style={{ backgroundColor: 'rgba(244,67,54,0.08)', border: '1.5px solid rgba(244,67,54,0.2)' }}
                >
                  <div className="text-xs font-semibold" style={{ color: '#e74c3c' }}>
                    乐观准则
                  </div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: '#6B6B6B' }}>
                    (Maximax)
                  </div>
                </div>
              </div>

              {/* Pessimistic / Info branch */}
              <div className="flex flex-col gap-2">
                <div
                  className="px-3 py-2 rounded-lg text-xs font-medium text-center"
                  style={{ backgroundColor: '#e8f4fd', borderLeft: '3px solid #3498db', color: '#1B3A5F' }}
                >
                  风险态度：
                  <br />
                  悲观 / 保守
                </div>
                <div className="flex justify-center">
                  <ChevronDown size={16} style={{ color: '#C8963E' }} />
                </div>
                <div
                  className="px-3 py-2.5 rounded-lg text-center"
                  style={{ backgroundColor: 'rgba(27,58,95,0.08)', border: '1.5px solid rgba(27,58,95,0.2)' }}
                >
                  <div className="text-xs font-semibold" style={{ color: '#3498db' }}>
                    悲观准则
                  </div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: '#6B6B6B' }}>
                    (Maximin)
                  </div>
                </div>
              </div>

              {/* Risk branch */}
              <div className="flex flex-col gap-2">
                <div
                  className="px-3 py-2 rounded-lg text-xs font-medium text-center"
                  style={{ backgroundColor: '#f0f0ff', borderLeft: '3px solid #9b59b6', color: '#1B3A5F' }}
                >
                  两者皆非
                  <br />
                  需进一步分析
                </div>
                <div className="flex justify-center">
                  <ChevronDown size={16} style={{ color: '#C8963E' }} />
                </div>
                <div
                  className="px-3 py-2.5 rounded-lg text-center"
                  style={{ backgroundColor: 'rgba(155,89,182,0.08)', border: '1.5px solid rgba(155,89,182,0.2)' }}
                >
                  <div className="text-xs font-semibold" style={{ color: '#9b59b6' }}>
                    折中/等概率准则
                  </div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: '#6B6B6B' }}>
                    (Hurwicz / Laplace)
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Additional row: Savage and intermediate paths */}
            <motion.div variants={itemVariants} className="w-full grid grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col items-center gap-1">
                <div className="flex justify-center">
                  <ChevronDown size={16} style={{ color: '#C8963E' }} />
                </div>
                <div
                  className="w-full px-3 py-2.5 rounded-lg text-center"
                  style={{ backgroundColor: 'rgba(76,175,80,0.08)', border: '1.5px solid rgba(76,175,80,0.2)' }}
                >
                  <div className="text-xs font-semibold" style={{ color: '#27ae60' }}>
                    后悔值准则 (Savage)
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#6B6B6B' }}>
                    关注机会损失最小化
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex justify-center">
                  <ChevronDown size={16} style={{ color: '#C8963E' }} />
                </div>
                <div
                  className="w-full px-3 py-2.5 rounded-lg text-center"
                  style={{ backgroundColor: 'rgba(200,150,62,0.08)', border: '1.5px solid rgba(200,150,62,0.2)' }}
                >
                  <div className="text-xs font-semibold" style={{ color: '#f39c12' }}>
                    等概率准则 (Laplace)
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#6B6B6B' }}>
                    完全无先验信息时采用
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </SectionCard>

        {/* ---- Section 6: Quick Reference Table ---- */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: '#1B3A5F' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              五种准则速查表
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#1B3A5F' }}>
                  <th className="px-3 py-3 text-left text-white text-xs font-medium">准则</th>
                  <th className="px-3 py-3 text-left text-white text-xs font-medium">别名</th>
                  <th className="px-3 py-3 text-left text-white text-xs font-medium min-w-[140px]">公式</th>
                  <th className="px-3 py-3 text-left text-white text-xs font-medium">决策者态度</th>
                  <th className="px-3 py-3 text-left text-white text-xs font-medium">风险特征</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: '乐观准则', alias: 'Maximax / 大中取大', formula: 'maxᵢ{maxⱼ(dᵢⱼ)}', attitude: '极度乐观', risk: '风险最大', color: '#e74c3c' },
                  { name: '悲观准则', alias: 'Maximin / Wald / 小中取大', formula: 'maxᵢ{minⱼ(dᵢⱼ)}', attitude: '极度悲观', risk: '风险最小', color: '#3498db' },
                  { name: '折中准则', alias: 'Hurwicz', formula: 'α×max+(1−α)×min', attitude: '可调节', risk: '取决于α', color: '#9b59b6' },
                  { name: '后悔值准则', alias: 'Savage / 最小最大后悔值', formula: 'minᵢ{maxⱼ(Rᵢⱼ)}', attitude: '机会损失最小', risk: '中等', color: '#2ecc71' },
                  { name: '等概率准则', alias: 'Laplace', formula: 'maxᵢ{avg(dᵢⱼ)}', attitude: '无先验信息', risk: '中等', color: '#f39c12' },
                ].map((row, i) => (
                  <tr
                    key={row.name}
                    className="transition-colors duration-200 hover:bg-[#F8F6F2]"
                    style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8f6f3' }}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="text-xs font-semibold" style={{ color: '#1B3A5F' }}>
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#2A4A73' }}>
                      {row.alias}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: '#f8f6f3', color: '#2A4A73' }}
                      >
                        {row.formula}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#1B3A5F' }}>
                      {row.attitude}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#1B3A5F' }}>
                      {row.risk}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* ---- Section 7: Knowledge Card ---- */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl p-6"
          style={{
            backgroundColor: '#faf3e0',
            border: '1px solid #f0e6cc',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              知识点：不确定型决策准则选择
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5"
                style={{ backgroundColor: '#1B3A5F' }}
              >
                1
              </div>
              <p className="text-sm" style={{ color: '#1B3A5F', lineHeight: 1.7 }}>
                <strong>没有"最好"的决策准则，只有"最适合"的决策准则。</strong>不同准则反映决策者不同的风险偏好和态度。
              </p>
            </div>

            <div className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5"
                style={{ backgroundColor: '#1B3A5F' }}
              >
                2
              </div>
              <div className="text-sm" style={{ color: '#1B3A5F', lineHeight: 1.7 }}>
                <strong>准则的选择取决于：</strong>
                <ul className="list-none mt-1 space-y-1">
                  <li className="flex items-start gap-1.5">
                    <span style={{ color: '#C8963E' }}>•</span>
                    <span>决策者的风险偏好（乐观 / 悲观 / 中性）</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span style={{ color: '#C8963E' }}>•</span>
                    <span>可获取的信息量</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span style={{ color: '#C8963E' }}>•</span>
                    <span>决策后果的严重程度</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span style={{ color: '#C8963E' }}>•</span>
                    <span>组织的承受能力和战略目标</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5"
                style={{ backgroundColor: '#1B3A5F' }}
              >
                3
              </div>
              <div className="text-sm" style={{ color: '#1B3A5F', lineHeight: 1.7 }}>
                <strong>实际决策建议：</strong>
                <ul className="list-none mt-1 space-y-1">
                  <li className="flex items-start gap-1.5">
                    <Check size={13} className="mt-1 flex-shrink-0" style={{ color: '#27ae60' }} />
                    <span>同时使用多种准则进行分析</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={13} className="mt-1 flex-shrink-0" style={{ color: '#27ae60' }} />
                    <span>若多种准则指向同一方案，可作为参考依据之一</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={13} className="mt-1 flex-shrink-0" style={{ color: '#27ae60' }} />
                    <span>若结果分歧大，需深入分析原因</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={13} className="mt-1 flex-shrink-0" style={{ color: '#27ae60' }} />
                    <span>结合定性分析（如 SWOT）辅助决策</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5"
                style={{ backgroundColor: '#1B3A5F' }}
              >
                4
              </div>
              <div className="text-sm" style={{ color: '#1B3A5F', lineHeight: 1.7 }}>
                <strong>本章准则的局限性：</strong>
                <ul className="list-none mt-1 space-y-1">
                  <li className="flex items-start gap-1.5">
                    <span style={{ color: '#F44336' }}>•</span>
                    <span>所有准则都只利用了收益矩阵的部分信息</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span style={{ color: '#F44336' }}>•</span>
                    <span>决策结果高度依赖决策者的主观态度</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span style={{ color: '#F44336' }}>•</span>
                    <span>无法像风险型决策那样量化信息价值</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span style={{ color: '#F44336' }}>•</span>
                    <span>建议尽量收集信息将不确定型转化为风险型</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Key Takeaway */}
          <div
            className="mt-5 p-4 rounded-lg"
            style={{ backgroundColor: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)' }}
          >
            <div className="flex items-start gap-2">
              <Lightbulb size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#4CAF50' }} />
              <p className="text-sm font-semibold" style={{ color: '#4CAF50' }}>
                不确定型决策没有绝对正确的答案，关键是理解决策逻辑并在实践中灵活运用。不同准则可能给出不同最优方案，决策者应根据自身态度、信息和风险偏好综合选择。
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
