import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  RotateCcw,
  Pencil,
  Lightbulb,
  CheckCircle,
  BarChart3,
  BookOpen,
  Check,
  Scale,
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
  ReferenceLine,
} from 'recharts';

/* ─────────────────────── types ─────────────────────── */
interface MatrixRow {
  name: string;
  values: number[];
}

/* ─────────────────────── default data ─────────────────────── */
const DEFAULT_DATA: MatrixRow[] = [
  { name: 'A₁', values: [500, 150, -50] },
  { name: 'A₂', values: [300, 200, 100] },
  { name: 'A₃', values: [200, 200, 150] },
];

const STATE_LABELS = ['S₁(景气)', 'S₂(不变)', 'S₃(不景气)'];
const ALT_LABELS = ['积极(A₁)', '稳健(A₂)', '保守(A₃)'];


const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const staggerChild = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

/* ─────────────────────── component ─────────────────────── */
export default function Pessimistic() {
  const [matrix, setMatrix] = useState<MatrixRow[]>(DEFAULT_DATA.map((r) => ({ ...r, values: [...r.values] })));

  /* editable cell handler */
  const updateCell = useCallback((rowIdx: number, colIdx: number, raw: string) => {
    if (raw === '' || raw === '-') {
      setMatrix((prev) => {
        const next = prev.map((r) => ({ ...r, values: [...r.values] }));
        next[rowIdx].values[colIdx] = 0;
        return next;
      });
      return;
    }
    const val = Number(raw);
    if (Number.isNaN(val)) return;
    setMatrix((prev) => {
      const next = prev.map((r) => ({ ...r, values: [...r.values] }));
      next[rowIdx].values[colIdx] = val;
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
    setMatrix(DEFAULT_DATA.map((r) => ({ ...r, values: [...r.values] })));
  }, []);

  /* calculations */
  const mins = matrix.map((row) => Math.min(...row.values));
  const maxOfMins = Math.max(...mins);
  const optimalIdxs = mins.map((v, i) => (Math.abs(v - maxOfMins) < 1e-9 ? i : -1)).filter((i) => i !== -1);

  /* chart data */
  const chartData = matrix.map((_r, i) => ({
    name: ALT_LABELS[i],
    min: mins[i],
    isOptimal: optimalIdxs.includes(i),
    isNegative: mins[i] < 0,
  }));

  return (
    <div style={{ backgroundColor: '#F8F6F2' }}>
      {/* ── Page Title ── */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Shield size={20} style={{ color: '#C8963E' }} />
              <h1 className="text-2xl font-semibold" style={{ color: '#1B3A5F', fontFamily: "'Noto Sans SC', sans-serif" }}>
                悲观决策准则 (Maximin / Wald)
              </h1>
            </div>
            <p className="mt-1.5 text-sm" style={{ color: '#6B6B6B' }}>
              决策者持悲观态度，选择各方案最小收益中的最大值，也称小中取大准则
            </p>
          </div>
          <button
            onClick={resetData}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: '#ffffff',
              color: '#1B3A5F',
              border: '1px solid #E0DDD5',
            }}
          >
            <RotateCcw size={14} />
            重置数据
          </button>
        </div>
      </motion.div>

      {/* ── Editable Payoff Matrix ── */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px' }}
        >
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
            修改收益值，表格将自动重新计算各方案最小值并高亮最优方案
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
                  <th className="text-center px-4 py-3 text-white font-medium" style={{ backgroundColor: '#2A4A73' }}>
                    min(dᵢⱼ)
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
                        <td key={j} className="px-3 py-2 text-center">
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
                        className="px-4 py-3 text-center font-semibold"
                        style={{
                          backgroundColor: isOptimal ? 'rgba(76,175,80,0.08)' : '#f8f6f3',
                          color: isOptimal ? '#4CAF50' : '#1B3A5F',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {mins[i]}
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

      {/* ── Calculation Steps ── */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <div className="rounded-xl p-6" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px' }}>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              计算过程
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* Step 1 */}
            <motion.div variants={staggerChild}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                Step 1：找出各方案在不同状态下的最小收益
              </h3>
              <div className="flex flex-col gap-1.5">
                {matrix.map((row, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-md text-sm"
                    style={{
                      backgroundColor: optimalIdxs.includes(i) ? '#f0faf3' : '#f8f6f3',
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#1B3A5F',
                    }}
                  >
                    min({ALT_LABELS[i]}) = min&#123;{row.values.join(', ')}&#125; = <strong style={{ color: optimalIdxs.includes(i) ? '#4CAF50' : '#C8963E' }}>{mins[i]}</strong>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={staggerChild}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                Step 2：从各方案最小收益中选取最大值
              </h3>
              <div
                className="px-3 py-3 rounded-md text-sm"
                style={{
                  backgroundColor: '#faf3e0',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#1B3A5F',
                }}
              >
                <span className="text-base font-bold" style={{ color: '#C8963E' }}>
                  Maximin = max&#123;{mins.join(', ')}&#125; = {maxOfMins}
                </span>
              </div>
              <p className="mt-2 text-base font-semibold" style={{ color: '#4CAF50' }}>
                → 最优方案为：{optimalIdxs.map((i) => ALT_LABELS[i]).join('、')}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Optimal Result ── */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: '#f0faf3',
            borderLeft: '4px solid #4CAF50',
            borderRadius: '12px',
            padding: '24px',
          }}
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
            最小收益 = {maxOfMins}
          </p>
          <p className="mt-3 text-sm" style={{ color: '#5d6d7e', lineHeight: 1.7 }}>
            在悲观准则下，最优方案为：{optimalIdxs.map((i) => ALT_LABELS[i]).join('、')}。
            该方案在其最不利自然状态下仍能获得最高保底收益，保底收益为 {maxOfMins}。
          </p>
        </div>
      </motion.div>

      {/* ── Bar Chart ── */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div className="rounded-xl p-6" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px' }}>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              各方案最小收益对比
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            绿色柱子为最优方案，红色柱子表示最小收益为负值
          </p>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
              <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#1B3A5F' }} axisLine={{ stroke: '#E0DDD5' }} />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B6B6B' }}
                axisLine={{ stroke: '#E0DDD5' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: number) => [`最小收益: ${value}`, '']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E0DDD5',
                  fontSize: '13px',
                }}
              />
              <ReferenceLine y={0} stroke="#1B3A5F" strokeWidth={1} />
              <Bar dataKey="min" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isOptimal ? '#4CAF50' : entry.isNegative ? '#F44336' : '#2A4A73'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B6B6B' }}>
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#4CAF50' }} />
              最优方案
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B6B6B' }}>
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#2A4A73' }} />
              其他方案
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B6B6B' }}>
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#F44336' }} />
              负值
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Comparison Table: Optimistic vs Pessimistic ── */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div className="rounded-xl p-6" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px' }}>
          <div className="flex items-center gap-2 mb-4">
            <Scale size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              悲观 vs 乐观准则对比
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1B3A5F' }}>
                  <th className="text-left px-4 py-3 text-white font-medium" style={{ borderRadius: '6px 0 0 0' }}>
                    特征
                  </th>
                  <th className="text-center px-4 py-3 text-white font-medium">
                    乐观准则 (Maximax)
                  </th>
                  <th className="text-center px-4 py-3 text-white font-medium" style={{ borderRadius: '0 6px 0 0' }}>
                    悲观准则 (Maximin)
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['决策态度', '极度乐观', '极度悲观'],
                  ['考虑范围', '只考虑最好状态', '只考虑最坏状态'],
                  ['风险偏好', '高风险高回报', '低风险求稳定'],
                  ['当前最优方案', '见乐观准则页', `${optimalIdxs.map((i) => ALT_LABELS[i]).join('、')}, 保底收益 ${maxOfMins.toFixed(0)}`],
                  ['适用决策者', '实力雄厚、敢于冒险', '实力有限、风险厌恶'],
                ].map((row, i) => (
                  <tr
                    key={i}
                    className="transition-colors duration-200"
                    style={{
                      backgroundColor: i % 2 === 1 ? '#f8f6f3' : '#ffffff',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#F8F6F2';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 1 ? '#f8f6f3' : '#ffffff';
                    }}
                  >
                    <td className="px-4 py-2.5 font-medium" style={{ color: '#1B3A5F' }}>
                      {row[0]}
                    </td>
                    <td className="px-4 py-2.5 text-center" style={{ color: '#5d6d7e' }}>
                      {row[1]}
                    </td>
                    <td className="px-4 py-2.5 text-center" style={{ color: '#5d6d7e' }}>
                      {row[2]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ── Knowledge Card ── */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: '#faf3e0',
            border: '1px solid #f0e6cc',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: '#1B3A5F' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              知识点：悲观决策准则
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1B3A5F' }}>
                适用条件
              </h3>
              <p className="text-sm" style={{ color: '#5d6d7e', lineHeight: 1.7 }}>
                适用于决策者对未来形势持悲观态度，或决策者实力有限、无法承受较大损失的场景。追求"在最坏情况下也能获得最好结果"。
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1B3A5F' }}>
                公式
              </h3>
              <span
                className="inline-block px-3 py-2 text-sm rounded-md"
                style={{
                  backgroundColor: '#ffffff',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#1B3A5F',
                }}
              >
                Maximin = max<sub>i</sub>&#123; min<sub>j</sub>(d<sub>ij</sub>) &#125;
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1B3A5F' }}>
                特点
              </h3>
              <ul className="text-sm flex flex-col gap-1" style={{ color: '#5d6d7e', lineHeight: 1.7 }}>
                <li>• 先求每行最小值，再从这些最小值中取最大</li>
                <li>• 只考虑最坏情况，忽略有利状态</li>
                <li>• 风险最小但可能错过高回报机会</li>
                <li>• 适合保守型、风险厌恶型决策者</li>
                <li>• 又称 Wald 准则、小中取大准则</li>
              </ul>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['小中取大', '保守型', 'Wald准则'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: 'rgba(27,58,95,0.08)',
                  color: '#1B3A5F',
                  borderRadius: '20px',
                  padding: '4px 12px',
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
