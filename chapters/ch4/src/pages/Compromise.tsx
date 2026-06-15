import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  SlidersHorizontal,
  ArrowLeft,
  RotateCcw,
  Pencil,
  Lightbulb,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Check,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

/* ─────────────────────── types ─────────────────────── */
interface MatrixRow {
  name: string;
  values: number[];
}

interface LineChartPoint {
  alpha: number;
  A1: number;
  A2: number;
  A3: number;
  [key: string]: number;
}

/* ─────────────────────── default data ─────────────────────── */
const DEFAULT_DATA: MatrixRow[] = [
  { name: 'A₁', values: [500, 150, -50] },
  { name: 'A₂', values: [300, 200, 100] },
  { name: 'A₃', values: [200, 200, 150] },
];

const STATE_LABELS = ['S₁(景气)', 'S₂(不变)', 'S₃(不景气)'];
const ALT_LABELS = ['积极(A₁)', '稳健(A₂)', '保守(A₃)'];
const ALT_KEYS = ['A1', 'A2', 'A3'];
const LINE_COLORS = ['#e74c3c', '#3498db', '#2ecc71'];

const TAB_ITEMS = [
  { label: '4.1', title: '基本概念', path: '/concept' },
  { label: '4.2', title: '乐观准则', path: '/optimistic' },
  { label: '4.3', title: '悲观准则', path: '/pessimistic' },
  { label: '4.4', title: '折中准则', path: '/compromise' },
  { label: '4.5', title: '后悔值', path: '/regret' },
  { label: '4.6', title: '等概率', path: '/laplace' },
  { label: '4.7', title: '案例分析', path: '/case-study' },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

/* ─────────────────────── component ─────────────────────── */
export default function Compromise() {
  const [matrix, setMatrix] = useState<MatrixRow[]>(DEFAULT_DATA.map((r) => ({ ...r, values: [...r.values] })));
  const [alpha, setAlpha] = useState(0.6);

  /* editable cell handler */
  const updateCell = useCallback((rowIdx: number, colIdx: number, raw: string) => {
    const val = raw === '' || raw === '-' ? 0 : Number(raw);
    if (raw !== '' && raw !== '-' && Number.isNaN(val)) return;
    setMatrix((prev) => {
      const next = prev.map((r) => ({ ...r, values: [...r.values] }));
      next[rowIdx].values[colIdx] = val;
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
    setMatrix(DEFAULT_DATA.map((r) => ({ ...r, values: [...r.values] })));
    setAlpha(0.6);
  }, []);

  /* calculations */
  const { maxs, mins, cvs, optimalIdxs, maxCV } = useMemo(() => {
    const maxsArr = matrix.map((row) => Math.max(...row.values));
    const minsArr = matrix.map((row) => Math.min(...row.values));
    const cvsArr = matrix.map((_, i) => alpha * maxsArr[i] + (1 - alpha) * minsArr[i]);
    const maxCvVal = Math.max(...cvsArr);
    const optIdxs = cvsArr.map((v, i) => (Math.abs(v - maxCvVal) < 1e-9 ? i : -1)).filter((i) => i !== -1);
    return { maxs: maxsArr, mins: minsArr, cvs: cvsArr, optimalIdxs: optIdxs, maxCV: maxCvVal };
  }, [matrix, alpha]);

  /* line chart data: precompute for alpha 0 to 1 step 0.1 */
  const lineData: LineChartPoint[] = useMemo(() => {
    const points: LineChartPoint[] = [];
    for (let a = 0; a <= 1.01; a += 0.05) {
      const aRounded = Math.round(a * 100) / 100;
      const pt: LineChartPoint = { alpha: aRounded, A1: 0, A2: 0, A3: 0 };
      matrix.forEach((row, i) => {
        const mx = Math.max(...row.values);
        const mn = Math.min(...row.values);
        pt[ALT_KEYS[i]] = +(aRounded * mx + (1 - aRounded) * mn).toFixed(2);
      });
      points.push(pt);
    }
    return points;
  }, [matrix]);

  /* slider background gradient */
  const sliderBg = `linear-gradient(to right, #1B3A5F 0%, #1B3A5F ${alpha * 100}%, #E0DDD5 ${alpha * 100}%, #E0DDD5 100%)`;

  return (
    <div style={{ backgroundColor: '#F8F6F2' }}>
      {/* ── Tab Navigation ── */}
      <div className="max-w-[960px] mx-auto px-5 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="flex items-center gap-1.5 text-sm" style={{ color: '#6B6B6B' }}>
            <ArrowLeft size={16} />
            <span>返回章节首页</span>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {TAB_ITEMS.map((tab) => {
            const isActive = tab.path === '/compromise';
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="px-4 py-2 text-[13px] font-medium rounded-full transition-all duration-250 flex items-center gap-1.5"
                style={{
                  backgroundColor: isActive ? '#1B3A5F' : '#ffffff',
                  color: isActive ? '#ffffff' : '#1B3A5F',
                  border: '1px solid #E0DDD5',
                }}
              >
                <span>{tab.label}</span>
                <span className="opacity-70">{tab.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Page Title ── */}
      <motion.div
        className="max-w-[960px] mx-auto px-5 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal size={20} style={{ color: '#C8963E' }} />
              <h1 className="text-2xl font-semibold" style={{ color: '#1B3A5F', fontFamily: "'Noto Sans SC', sans-serif" }}>
                折中决策准则 (Hurwicz)
              </h1>
            </div>
            <p className="mt-1.5 text-sm" style={{ color: '#6B6B6B' }}>
              引入乐观系数 α(0≤α≤1)，计算折中收益值 CV = α×max + (1−α)×min
            </p>
          </div>
          <button
            onClick={resetData}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#ffffff', color: '#1B3A5F', border: '1px solid #E0DDD5' }}
          >
            <RotateCcw size={14} />
            重置数据
          </button>
        </div>
      </motion.div>

      {/* ── Editable Payoff Matrix ── */}
      <motion.div
        className="max-w-[960px] mx-auto px-5 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div className="rounded-xl p-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
                决策收益矩阵
              </h2>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                style={{ backgroundColor: 'rgba(200,150,62,0.1)', color: '#C8963E' }}
              >
                <Pencil size={10} />
                可编辑
              </span>
            </div>
          </div>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            修改收益值，表格将自动重新计算各方案的 max、min 和折中值 CV
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1B3A5F' }}>
                  <th className="text-left px-4 py-3 text-white font-medium" style={{ borderRadius: '6px 0 0 0' }}>
                    方案 \ 状态
                  </th>
                  {STATE_LABELS.map((s) => (
                    <th key={s} className="text-center px-4 py-3 text-white font-medium">
                      {s}
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 text-white font-medium" style={{ backgroundColor: '#2A4A73' }}>
                    max
                  </th>
                  <th className="text-center px-3 py-3 text-white font-medium" style={{ backgroundColor: '#2A4A73' }}>
                    min
                  </th>
                  <th
                    className="text-center px-3 py-3 font-medium"
                    style={{ backgroundColor: '#C8963E', color: '#ffffff' }}
                  >
                    CV(α)
                  </th>
                  <th className="text-center px-4 py-3 text-white font-medium" style={{ borderRadius: '0 6px 0 0' }}>
                    结果
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => {
                  const isOptimal = optimalIdxs.includes(i);
                  return (
                    <tr
                      key={row.name}
                      style={{
                        backgroundColor: isOptimal ? '#f0faf3' : i % 2 === 1 ? '#f8f6f3' : '#ffffff',
                        borderLeft: isOptimal ? '3px solid #4CAF50' : '3px solid transparent',
                      }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: '#1B3A5F' }}>
                        {ALT_LABELS[i]}
                      </td>
                      {row.values.map((val, j) => (
                        <td key={j} className="px-2 py-2 text-center">
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => updateCell(i, j, e.target.value)}
                            className="w-20 text-center px-2 py-1.5 text-sm outline-none transition-all duration-200 focus:ring-2"
                            style={{
                              border: '1px solid #E0DDD5',
                              borderRadius: '6px',
                              backgroundColor: '#ffffff',
                              color: '#1B3A5F',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          />
                        </td>
                      ))}
                      <td
                        className="px-3 py-3 text-center font-medium"
                        style={{ backgroundColor: '#f8f6f3', fontFamily: "'JetBrains Mono', monospace", color: '#1B3A5F' }}
                      >
                        {maxs[i]}
                      </td>
                      <td
                        className="px-3 py-3 text-center font-medium"
                        style={{ backgroundColor: '#f8f6f3', fontFamily: "'JetBrains Mono', monospace", color: '#1B3A5F' }}
                      >
                        {mins[i]}
                      </td>
                      <td
                        className="px-3 py-3 text-center font-semibold"
                        style={{
                          backgroundColor: '#faf3e0',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: isOptimal ? '#4CAF50' : '#1B3A5F',
                          fontSize: '15px',
                        }}
                      >
                        {cvs[i].toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOptimal && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full"
                            style={{ backgroundColor: 'rgba(76,175,80,0.1)', color: '#4CAF50' }}
                          >
                            <Check size={12} />
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
        </div>
      </motion.div>

      {/* ── Alpha Slider ── */}
      <motion.div
        className="max-w-[960px] mx-auto px-5 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div className="rounded-xl p-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              乐观系数 α 控制器
            </h2>
          </div>

          {/* Slider */}
          <div className="mt-5">
            <div className="flex justify-between mb-2">
              <span className="text-[13px]" style={{ color: '#6B6B6B' }}>
                悲观 (α=0)
              </span>
              <span className="text-[13px]" style={{ color: '#6B6B6B' }}>
                乐观 (α=1)
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: sliderBg,
                height: '6px',
                borderRadius: '3px',
                outline: 'none',
              }}
            />

            {/* Current value display */}
            <div className="text-center mt-3">
              <span
                className="text-[28px] font-bold"
                style={{ color: '#1B3A5F', fontFamily: "'JetBrains Mono', monospace" }}
              >
                α = {alpha.toFixed(2)}
              </span>
              <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>
                当 α 增大时，决策趋向乐观；α 减小时，趋向悲观
              </p>
            </div>
          </div>

          {/* Scale markers */}
          <div className="flex justify-between mt-4 px-1">
            {[
              { a: 0, label: '完全悲观' },
              { a: 0.25, label: '' },
              { a: 0.5, label: '中性' },
              { a: 0.75, label: '' },
              { a: 1, label: '完全乐观' },
            ].map((mark) => (
              <div key={mark.a} className="flex flex-col items-center gap-1">
                <div className="w-px h-2" style={{ backgroundColor: '#C8963E' }} />
                <span className="text-xs" style={{ color: '#6B6B6B' }}>
                  α={mark.a}
                </span>
                {mark.label && (
                  <span className="text-[11px]" style={{ color: '#C8963E', fontWeight: 500 }}>
                    {mark.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Equivalence notes */}
          <div className="flex flex-wrap gap-3 mt-5">
            <span
              className="px-3 py-1.5 text-xs rounded-full"
              style={{ backgroundColor: alpha === 0 ? '#f0faf3' : 'rgba(27,58,95,0.06)', color: '#1B3A5F' }}
            >
              α=0 → 悲观准则 (Maximin)
            </span>
            <span
              className="px-3 py-1.5 text-xs rounded-full"
              style={{ backgroundColor: alpha === 1 ? '#f0faf3' : 'rgba(27,58,95,0.06)', color: '#1B3A5F' }}
            >
              α=1 → 乐观准则 (Maximax)
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Calculation Steps ── */}
      <motion.div
        className="max-w-[960px] mx-auto px-5 pb-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <div className="rounded-xl p-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              折中值 CV 计算过程
            </h2>
          </div>

          {/* Formula */}
          <div className="text-center mb-5">
            <div
              className="inline-block px-4 py-2.5 text-sm rounded-md mb-2"
              style={{
                backgroundColor: '#faf3e0',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#1B3A5F',
                fontSize: '15px',
              }}
            >
              CV<sub>i</sub> = α × max<sub>j</sub>(d<sub>ij</sub>) + (1−α) × min<sub>j</sub>(d<sub>ij</sub>)
            </div>
            <div className="text-sm font-semibold" style={{ color: '#C8963E' }}>
              当前 α = {alpha.toFixed(2)}
            </div>
          </div>

          {/* Per-alternative calculations */}
          <div className="flex flex-col gap-4 mt-5">
            {matrix.map((_r, i) => {
              const isOptimal = optimalIdxs.includes(i);
              const aPart = alpha * maxs[i];
              const bPart = (1 - alpha) * mins[i];
              return (
                <motion.div
                  key={i}
                  variants={staggerChild}
                  className="px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: isOptimal ? '#f0faf3' : '#f8f6f3',
                    borderLeft: isOptimal ? '3px solid #4CAF50' : '3px solid transparent',
                  }}
                >
                  <div className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#1B3A5F' }}>
                    <div>
                      CV<sub>{i + 1}</sub> = {alpha.toFixed(2)} × {maxs[i]} + {(1 - alpha).toFixed(2)} × {mins[i]}
                    </div>
                    <div className="mt-1">
                      CV<sub>{i + 1}</sub> = {aPart.toFixed(2)} + {bPart.toFixed(2)} ={' '}
                      <strong style={{ color: isOptimal ? '#4CAF50' : '#1B3A5F' }}>{cvs[i].toFixed(2)}</strong>
                      {isOptimal && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: 'rgba(76,175,80,0.1)', color: '#4CAF50' }}>
                          <Check size={10} />
                          最优
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Conclusion */}
          <motion.div variants={staggerChild} className="mt-4 pt-4" style={{ borderTop: '1px solid #E0DDD5' }}>
            <div
              className="text-sm px-3 py-2 rounded-md"
              style={{ backgroundColor: '#faf3e0', fontFamily: "'JetBrains Mono', monospace", color: '#1B3A5F' }}
            >
              Max CV = max&#123;{cvs.map((c) => c.toFixed(2)).join(', ')}&#125; = {maxCV.toFixed(2)}
            </div>
            <p className="mt-2 text-base font-semibold" style={{ color: '#4CAF50' }}>
              → 当 α={alpha.toFixed(2)} 时，最优方案为：{optimalIdxs.map((i) => ALT_LABELS[i]).join('、')}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Optimal Result ── */}
      <motion.div
        className="max-w-[960px] mx-auto px-5 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#f0faf3', borderLeft: '4px solid #4CAF50' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} style={{ color: '#4CAF50' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#4CAF50' }}>
              最优决策方案
            </h2>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#1B3A5F' }}>
            {optimalIdxs.map((i) => ALT_LABELS[i]).join('、')} {optimalIdxs.length > 1 ? '策略（并列最优）' : '策略'}
          </p>
          <p className="mt-1.5 text-base" style={{ color: '#C8963E' }}>
            CV = {maxCV.toFixed(2)} (α={alpha.toFixed(2)})
          </p>
          <p className="mt-3 text-sm" style={{ color: '#5d6d7e', lineHeight: 1.7 }}>
            在折中准则下(α={alpha.toFixed(2)})，决策者兼顾乐观与悲观因素，给予最好情况{(alpha * 100).toFixed(0)}%权重、最坏情况{((1 - alpha) * 100).toFixed(0)}%权重，选择综合得分最高的方案。
          </p>
        </div>
      </motion.div>

      {/* ── Line Chart ── */}
      <motion.div
        className="max-w-[960px] mx-auto px-5 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div className="rounded-xl p-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              α 变化对各方案折中值的影响
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            拖动滑块改变 α 值，观察三条线的交点变化。垂直虚线标记当前 α 位置。
          </p>

          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={lineData} margin={{ top: 40, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
              <XAxis
                dataKey="alpha"
                tick={{ fontSize: 12, fill: '#6B6B6B' }}
                axisLine={{ stroke: '#E0DDD5' }}
                tickFormatter={(v: number) => v.toFixed(2)}
                label={{ value: 'α (乐观系数)', position: 'insideBottomRight', offset: -5, style: { fill: '#6B6B6B', fontSize: 12 } }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B6B6B' }}
                axisLine={{ stroke: '#E0DDD5' }}
                label={{ value: 'CV 折中值', angle: -90, position: 'insideLeft', style: { fill: '#6B6B6B', fontSize: 12 } }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [`${value.toFixed(2)}`, ALT_LABELS[ALT_KEYS.indexOf(String(name))] || String(name)]}
                labelFormatter={(label: number) => `α = ${Number(label).toFixed(2)}`}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E0DDD5',
                  fontSize: '13px',
                }}
              />
              <Legend
                formatter={(value: string) => ALT_LABELS[ALT_KEYS.indexOf(value)] || value}
              />
              <ReferenceLine
                x={alpha}
                stroke="#C8963E"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `α=${alpha.toFixed(2)}`,
                  position: 'top',
                  fill: '#C8963E',
                  fontSize: 11,
                }}
              />
              {ALT_KEYS.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={LINE_COLORS[i]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Key observation points */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'α=0（悲观）', value: `${ALT_LABELS[mins.indexOf(Math.max(...mins))]}最优, CV=${Math.max(...mins)}` },
              { label: 'α=1（乐观）', value: `${ALT_LABELS[maxs.indexOf(Math.max(...maxs))]}最优, CV=${Math.max(...maxs)}` },
              { label: '当前 α', value: `${optimalIdxs.map((i) => ALT_LABELS[i]).join('、')}最优, CV=${maxCV.toFixed(2)}` },
            ].map((item, i) => (
              <div key={i} className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#f8f6f3' }}>
                <span className="text-xs font-medium" style={{ color: '#6B6B6B' }}>
                  {item.label}
                </span>
                <div className="text-sm font-medium" style={{ color: '#1B3A5F' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Knowledge Card ── */}
      <motion.div
        className="max-w-[960px] mx-auto px-5 pb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#faf3e0', border: '1px solid #f0e6cc' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: '#1B3A5F' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              知识点：Hurwicz 折中准则
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1B3A5F' }}>
                适用条件
              </h3>
              <p className="text-sm" style={{ color: '#5d6d7e', lineHeight: 1.7 }}>
                适用于决策者既非完全乐观也非完全悲观，希望在两者之间取得平衡的场景。
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1B3A5F' }}>
                公式
              </h3>
              <span
                className="inline-block px-3 py-2 text-sm rounded-md"
                style={{ backgroundColor: '#ffffff', fontFamily: "'JetBrains Mono', monospace", color: '#1B3A5F' }}
              >
                CV<sub>i</sub> = α × max<sub>j</sub>(d<sub>ij</sub>) + (1 − α) × min<sub>j</sub>(d<sub>ij</sub>)
              </span>
              <div className="text-sm mt-2" style={{ color: '#5d6d7e', lineHeight: 1.7 }}>
                其中 α ∈ [0,1] 为乐观系数：
                <ul className="mt-1 flex flex-col gap-0.5">
                  <li>• α = 0：退化为悲观准则 (Maximin)</li>
                  <li>• α = 1：退化为乐观准则 (Maximax)</li>
                  <li>• α = 0.5：乐观与悲观等权重</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1B3A5F' }}>
                特点
              </h3>
              <ul className="text-sm flex flex-col gap-1" style={{ color: '#5d6d7e', lineHeight: 1.7 }}>
                <li>• 通过 α 调节决策者的乐观程度</li>
                <li>• 同一个问题，不同 α 可能得到不同最优方案</li>
                <li>• 需要决策者主观确定 α 值</li>
                <li>• 比纯乐观或纯悲观更贴近实际决策心理</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1B3A5F' }}>
                注意事项
              </h3>
              <p className="text-sm" style={{ color: '#5d6d7e', lineHeight: 1.7 }}>
                Hurwicz准则有一个缺陷：只考虑了每个方案的最大和最小收益，忽略了中间状态的信息。改进方法是使用更一般的加权平均。
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['折中主义', '乐观系数', '赫尔维茨'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: 'rgba(27,58,95,0.08)',
                  color: '#1B3A5F',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
