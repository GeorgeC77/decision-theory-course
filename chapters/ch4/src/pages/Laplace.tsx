import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  RotateCcw,
  Lightbulb,
  BookOpen,
  Check,
  CheckCircle,
  BarChart3,
  AlertTriangle,
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
  LabelList,
} from 'recharts';
import type { ReactNode } from 'react';

/* ─────────────────────── types ─────────────────────── */
interface MatrixData {
  values: number[][]; // 3×3 payoff matrix
  probs: number[];    // 3 probabilities
}

interface LaplaceResult {
  expectedValues: number[];
  maxExpectedValue: number;
  optimalIndices: number[];
  probSum: number;
  probValid: boolean;
}

/* ─────────────────────── default data ─────────────────────── */
const defaultMatrix: MatrixData = {
  values: [
    [500, 150, -50],
    [300, 200, 100],
    [200, 200, 150],
  ],
  probs: [1 / 3, 1 / 3, 1 / 3],
};

const alternatives = ['积极(A₁)', '稳健(A₂)', '保守(A₃)'];
const states = ['θ₁（好）', 'θ₂（中）', 'θ₃（差）'];


/* ─────────────────────── utility: compute expected values ─────────────────────── */
function computeLaplace(matrix: MatrixData): LaplaceResult {
  const { values, probs } = matrix;
  const probSum = probs.reduce((a, b) => a + b, 0);
  const probValid = Math.abs(probSum - 1) < 0.0001 && probs.every((p) => p >= 0);

  // Expected value for each alternative
  const expectedValues = values.map((row) =>
    row.reduce((sum, val, j) => sum + val * probs[j], 0),
  );

  const maxExpectedValue = Math.max(...expectedValues);
  const optimalIndices = expectedValues
    .map((v, i) => (Math.abs(v - maxExpectedValue) < 0.001 ? i : -1))
    .filter((i) => i !== -1);

  return { expectedValues, maxExpectedValue, optimalIndices, probSum, probValid };
}

/* ─────────────────────── utility: smart number format ─────────────────────── */
function fmt(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

/* ─────────────────────── animation variants ─────────────────────── */
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const staggerStep = {
  hidden: { opacity: 0, x: -15 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
};

/* ─────────────────────── sub-components ─────────────────────── */
function Card({
  children,
  className = '',
  style = {},
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={`bg-white rounded-xl p-6 ${className}`}
      style={{ border: '1px solid #E0DDD5', ...style }}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
    >
      {children}
    </motion.div>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 text-xs font-medium"
      style={{
        backgroundColor: 'rgba(27,58,95,0.08)',
        color: '#1B3A5F',
        borderRadius: '20px',
      }}
    >
      {text}
    </span>
  );
}

function OptimalTag() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: 'rgba(76,175,80,0.1)',
        color: '#4CAF50',
        borderRadius: '20px',
      }}
    >
      <Check size={12} strokeWidth={2.5} />
      最优
    </span>
  );
}

function TiedTag() {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{
        backgroundColor: '#4CAF50',
        borderRadius: '20px',
      }}
    >
      并列最优
    </span>
  );
}

function EquiprobableTag() {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: '#faf3e0',
        color: '#C8963E',
        borderRadius: '20px',
      }}
    >
      等概率
    </span>
  );
}

/* ─────────────────────── main component ─────────────────────── */
export default function Laplace() {
  const [matrix, setMatrix] = useState<MatrixData>(defaultMatrix);

  const result = useMemo(() => computeLaplace(matrix), [matrix]);

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      const num = parseFloat(value);
      if (Number.isNaN(num)) return;
      setMatrix((prev) => {
        const next = {
          values: prev.values.map((r) => [...r]),
          probs: [...prev.probs],
        };
        next.values[row][col] = num;
        return next;
      });
    },
    [],
  );

  const handleProbChange = useCallback((col: number, value: string) => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return;
    setMatrix((prev) => {
      const next = {
        values: prev.values.map((r) => [...r]),
        probs: [...prev.probs],
      };
      next.probs[col] = num;
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setMatrix(defaultMatrix);
  }, []);

  const chartData = useMemo(
    () =>
      alternatives.map((name, i) => ({
        name,
        expectedValue: result.expectedValues[i],
        isOptimal: result.optimalIndices.includes(i),
      })),
    [result],
  );

  const allEqualThird = useMemo(
    () => matrix.probs.every((p) => Math.abs(p - 1 / 3) < 0.0001),
    [matrix.probs],
  );

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: '#F8F6F2' }}>
      {/* ── Title Section ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale size={20} style={{ color: '#C8963E' }} />
              <h1
                className="text-2xl font-semibold"
                style={{ fontFamily: "'Noto Sans SC', sans-serif", color: '#1B3A5F' }}
              >
                等概率决策准则 (Laplace)
              </h1>
            </div>
            <p className="text-sm" style={{ color: '#6B6B6B' }}>
              假设各自然状态等概率发生，计算期望收益并选择最大者
            </p>
          </div>
          <div className="flex gap-2">
            {['等可能性', '拉普拉斯', '期望收益'].map((t) => (
              <Tag key={t} text={t} />
            ))}
          </div>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: 'rgba(27,58,95,0.06)',
              color: '#1B3A5F',
              border: 'none',
            }}
          >
            <RotateCcw size={14} />
            重置数据
          </button>
        </div>
      </div>

      {/* ── Editable Payoff Matrix with Probability Row ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              决策收益矩阵
            </h2>
            <Tag text="可编辑" />
          </div>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            等概率准则假设各状态概率相等(1/n)，修改收益值将自动重新计算期望收益。也可自定义概率探索不同场景。
          </p>

          {/* Mode indication */}
          <div className="mb-4">
            {result.probValid ? (
              allEqualThird ? (
                <div
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                  style={{
                    backgroundColor: '#f0faf3',
                    borderRadius: '6px',
                    color: '#4CAF50',
                  }}
                >
                  <CheckCircle size={16} />
                  当前为 Laplace 等概率准则（各状态概率均为 1/n）。
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                  style={{
                    backgroundColor: '#fffbeb',
                    borderRadius: '6px',
                    color: '#b45309',
                  }}
                >
                  <AlertTriangle size={16} />
                  当前概率不相等，因此本计算属于风险型期望值准则，不再是严格的 Laplace 等概率准则。
                </div>
              )
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm"
                style={{
                  backgroundColor: '#fdf2f2',
                  borderRadius: '6px',
                  color: '#F44336',
                }}
              >
                <AlertTriangle size={16} />
                各概率须非负且概率之和必须等于 1，才能进行期望收益计算。
              </div>
            )}
          </div>

          {/* Probability validation warning */}
          {!result.probValid && (
            <div
              className="flex items-center gap-2 mb-4 px-3 py-2 text-sm"
              style={{
                backgroundColor: '#fdf2f2',
                borderRadius: '6px',
                color: '#F44336',
              }}
            >
              <AlertTriangle size={16} />
              各概率须非负且概率之和为 {result.probSum.toFixed(4)}，必须等于 1.0 才能正确计算期望收益
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#1B3A5F', color: '#ffffff' }}>
                  <th className="px-4 py-3 text-left text-sm font-medium">方案 \ 状态</th>
                  {states.map((s, _j) => (
                    <th key={s} className="px-4 py-3 text-center text-sm font-medium">
                      {s}
                      {allEqualThird && (
                        <span className="ml-1 text-xs" style={{ opacity: 0.8 }}>
                          (p=1/3)
                        </span>
                      )}
                    </th>
                  ))}
                  <th
                    className="px-4 py-3 text-center text-sm font-medium"
                    style={{ backgroundColor: '#faf3e0', color: '#1B3A5F' }}
                  >
                    E(A<sub>i</sub>)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">结果</th>
                </tr>
              </thead>
              <tbody>
                {/* Probability row */}
                <tr style={{ backgroundColor: '#f0f7ff' }}>
                  <td
                    className="px-4 py-3 text-sm font-medium"
                    style={{ color: '#1B3A5F' }}
                  >
                    <div className="flex items-center gap-1.5">
                      P(θ<sub>j</sub>)
                      {allEqualThird && <EquiprobableTag />}
                    </div>
                  </td>
                  {matrix.probs.map((p, j) => (
                    <td key={j} className="px-4 py-2 text-center">
                      <input
                        type="number"
                        value={p}
                        step={0.01}
                        min={0}
                        max={1}
                        onChange={(e) => handleProbChange(j, e.target.value)}
                        className="w-20 px-2 py-1.5 text-sm text-center outline-none transition-all duration-200 focus:ring-2"
                        style={{
                          borderRadius: '6px',
                          border: '1px solid #E0DDD5',
                          backgroundColor: '#ffffff',
                          color: '#1B3A5F',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      />
                    </td>
                  ))}
                  <td style={{ backgroundColor: '#faf3e0' }} />
                  <td />
                </tr>

                {/* Payoff rows */}
                {matrix.values.map((row, i) => {
                  const isOptimal = result.optimalIndices.includes(i);
                  return (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: isOptimal
                          ? '#f0faf3'
                          : i % 2 === 0
                            ? '#ffffff'
                            : '#f8f6f3',
                        borderLeft: isOptimal
                          ? '3px solid #4CAF50'
                          : '3px solid transparent',
                      }}
                    >
                      <td
                        className="px-4 py-3 text-sm font-medium"
                        style={{ color: '#1B3A5F' }}
                      >
                        {alternatives[i]}
                      </td>
                      {row.map((val, j) => (
                        <td key={j} className="px-4 py-2 text-center">
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => handleCellChange(i, j, e.target.value)}
                            className="w-20 px-2 py-1.5 text-sm text-center outline-none transition-all duration-200 focus:ring-2"
                            style={{
                              borderRadius: '6px',
                              border: '1px solid #E0DDD5',
                              backgroundColor: '#ffffff',
                              color: '#1B3A5F',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          />
                        </td>
                      ))}
                      <td
                        className="px-4 py-3 text-center text-sm font-bold"
                        style={{
                          backgroundColor: '#faf3e0',
                          color: '#C8963E',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {result.probValid
                          ? fmt(result.expectedValues[i])
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOptimal && result.probValid ? <OptimalTag /> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Calculation Steps ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              期望收益计算过程
            </h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            {/* Probability explanation */}
            <motion.div variants={staggerStep}>
              <div
                className="p-3 text-sm"
                style={{
                  backgroundColor: '#f0f7ff',
                  borderRadius: '6px',
                  color: '#1B3A5F',
                  lineHeight: 1.7,
                }}
              >
                <p>
                  等概率准则假设有 <strong>n</strong> 个自然状态，则每个状态的概率 P(θ<sub>j</sub>) = 1/n
                </p>
                <p>
                  本题 <strong>n = {matrix.values[0].length}</strong>，因此{' '}
                  {matrix.probs.map((p, j) => (
                    <span key={j}>
                      P({states[j]}) = {p.toFixed(4)}
                      {j < matrix.probs.length - 1 ? '，' : ''}
                    </span>
                  ))}
                </p>
              </div>
            </motion.div>

            {/* Formula */}
            <motion.div variants={staggerStep}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                计算公式
              </h3>
              <div
                className="px-4 py-3 text-center text-base"
                style={{
                  backgroundColor: '#f8f6f3',
                  borderRadius: '6px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#1B3A5F',
                }}
              >
                E(A<sub>i</sub>) = Σ<sub>j</sub> P(θ<sub>j</sub>) × d<sub>ij</sub>
              </div>
            </motion.div>

            {/* Per-alternative calculations */}
            {alternatives.map((alt, i) => {
              const ev = result.expectedValues[i];
              const isOptimal = result.optimalIndices.includes(i);
              return (
                <motion.div key={i} variants={staggerStep}>
                  <h3
                    className="text-sm font-semibold mb-1"
                    style={{ color: isOptimal ? '#4CAF50' : '#1B3A5F' }}
                  >
                    {alt} {isOptimal && result.probValid && '✓'}
                  </h3>
                  <div
                    className="p-3 text-sm"
                    style={{
                      backgroundColor: isOptimal ? '#f0faf3' : '#f8f6f3',
                      borderRadius: '6px',
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#1B3A5F',
                    }}
                  >
                    <div>
                      E({alt}) ={' '}
                      {matrix.values[i].map((v, j) => (
                        <span key={j}>
                          {matrix.probs[j].toFixed(4)} × ({v})
                          {j < matrix.values[i].length - 1 ? ' + ' : ''}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1">
                      E({alt}) ={' '}
                      {matrix.values[i]
                        .map((v, j) => fmt(v * matrix.probs[j]))
                        .join(' + ')} ={' '}
                      <span
                        style={{
                          color: isOptimal && result.probValid ? '#4CAF50' : '#C8963E',
                          fontWeight: 600,
                        }}
                      >
                        {fmt(ev)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Conclusion */}
            {result.probValid ? (
              <motion.div
                variants={staggerStep}
                className="p-3 text-sm font-semibold"
                style={{
                  backgroundColor: '#f0faf3',
                  borderRadius: '6px',
                  color: '#4CAF50',
                }}
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  max E(A<sub>i</sub>) = max
                  {'{'}
                  {result.expectedValues.map((v) => fmt(v)).join(', ')} ={' '}
                  {result.maxExpectedValue.toFixed(2)}
                </div>
                <div className="mt-1">
                  → 最优方案：
                  {result.optimalIndices.map((i) => alternatives[i]).join(' 和 ')}
                  {result.optimalIndices.length > 1 ? ' 并列' : ''}
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerStep}
                className="p-3 text-sm font-semibold"
                style={{
                  backgroundColor: '#fdf2f2',
                  borderRadius: '6px',
                  color: '#F44336',
                }}
              >
                概率无效，无法给出最优方案。请先使各概率非负且和为1。
              </motion.div>
            )}
          </motion.div>
        </Card>
      </div>

      {/* ── Optimal Result ── */}
      {result.probValid && (
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <motion.div
          className="p-6"
          style={{
            backgroundColor: '#f0faf3',
            borderLeft: '4px solid #4CAF50',
            borderRadius: '12px',
          }}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} style={{ color: '#4CAF50' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#4CAF50' }}>
              最优决策方案
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {result.optimalIndices.map((idx) => (
              <div key={idx} className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-xl font-semibold"
                  style={{ color: '#1B3A5F' }}
                >
                  {alternatives[idx].replace(/\(.*?\)/, '')}策略{' '}
                  {alternatives[idx].match(/\(.*?\)/)?.[0]}
                </span>
                <span className="text-sm" style={{ color: '#C8963E' }}>
                  期望收益 = {fmt(result.expectedValues[idx])}
                </span>
              </div>
            ))}
            {result.optimalIndices.length > 1 && <TiedTag />}
          </div>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: '#5d6d7e' }}>
            {allEqualThird
              ? '在等概率准则下，假设各自然状态出现的可能性相同。'
              : '当前概率不相等，计算结果为风险型期望值准则下的最优方案。'}
            {result.optimalIndices.map((i) => alternatives[i]).join('和')}
            策略的期望收益均为{fmt(result.maxExpectedValue)}，
            {result.optimalIndices.length > 1 ? '并列最优。' : '为最优。'}
          </p>
        </motion.div>
      </div>
      )}

      {/* ── Bar Chart ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              各方案期望收益对比
            </h2>
          </div>

          {result.probValid ? (
          <>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: '#4CAF50' }}
              />
              <span className="text-xs" style={{ color: '#5d6d7e' }}>
                最优方案
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: '#2A4A73' }}
              />
              <span className="text-xs" style={{ color: '#5d6d7e' }}>
                其他方案
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#1B3A5F' }} />
              <YAxis
                domain={[0, 250]}
                tick={{ fontSize: 12, fill: '#1B3A5F' }}
                label={{
                  value: '期望收益',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  style: { fill: '#6B6B6B', fontSize: 12 },
                }}
              />
              <Tooltip
                formatter={(value: number) => [fmt(value), '期望收益']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E0DDD5',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="expectedValue" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isOptimal ? '#4CAF50' : '#2A4A73'}
                  />
                ))}
                <LabelList dataKey="expectedValue" position="top" formatter={(v: number) => fmt(v)} style={{ fill: '#1B3A5F', fontSize: 13, fontWeight: 600 }} />
              </Bar>
              <ReferenceLine
                y={result.maxExpectedValue}
                stroke="#C8963E"
                strokeDasharray="4 4"
                label={{
                  value: `最优期望收益 = ${fmt(result.maxExpectedValue)}`,
                  position: 'right',
                  fill: '#C8963E',
                  fontSize: 12,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
          </>
          ) : (
            <div
              className="flex items-center gap-2 px-3 py-4 text-sm"
              style={{
                backgroundColor: '#fdf2f2',
                borderRadius: '6px',
                color: '#F44336',
              }}
            >
              <AlertTriangle size={16} />
              各概率须非负且概率之和必须等于 1，才能显示期望收益对比图。
            </div>
          )}
        </Card>
      </div>

      {/* ── Significance Card ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Scale size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              等概率准则的特殊意义
            </h2>
          </div>

          <p className="text-sm leading-relaxed mb-4" style={{ color: '#5d6d7e' }}>
            等概率准则实质上是将不确定型决策转化为风险型决策——通过假设等概率，就可以计算期望值，使用风险型决策的方法。当决策者确实没有任何信息判断各状态可能性时，"没有理由认为某个状态更可能发生"（不充分理由原则），等概率是一种合理的默认假设。
          </p>

          {/* Comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr style={{ backgroundColor: '#1B3A5F', color: '#ffffff' }}>
                  <th className="px-4 py-2.5 text-left font-medium">特征</th>
                  <th className="px-4 py-2.5 text-center font-medium">
                    Laplace等概率
                  </th>
                  <th className="px-4 py-2.5 text-center font-medium">
                    风险型期望值
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['概率来源', '主观假设(1/n)', '客观估计或历史数据'],
                  ['计算方法', '简单平均', '加权平均'],
                  ['适用场景', '信息极度缺乏', '有一定概率信息'],
                  ['本质', '不确定→风险 的桥梁', '标准的概率决策'],
                ].map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8f6f3',
                    }}
                  >
                    <td
                      className="px-4 py-2.5 font-medium"
                      style={{ color: '#1B3A5F' }}
                    >
                      {row[0]}
                    </td>
                    <td
                      className="px-4 py-2.5 text-center"
                      style={{ color: '#5d6d7e' }}
                    >
                      {row[1]}
                    </td>
                    <td
                      className="px-4 py-2.5 text-center"
                      style={{ color: '#5d6d7e' }}
                    >
                      {row[2]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Knowledge Card ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-8">
        <motion.div
          className="p-6"
          style={{
            backgroundColor: '#faf3e0',
            border: '1px solid #f0e6cc',
            borderRadius: '12px',
          }}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              知识点：Laplace 等概率准则
            </h2>
          </div>

          <div
            className="flex flex-col gap-4 text-sm"
            style={{ color: '#1B3A5F', lineHeight: 1.7 }}
          >
            <div>
              <h3 className="font-semibold mb-1">适用条件</h3>
              <p style={{ color: '#5d6d7e' }}>
                适用于决策者对各自然状态没有任何先验信息，无法判断哪种状态更可能发生的场景。基于"不充分理由原则"(Principle of Insufficient Reason)。
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">公式</h3>
              <div
                className="inline-block px-3 py-2 text-sm"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#1B3A5F',
                }}
              >
                假设 n 个状态等概率: P(θ<sub>j</sub>) = 1/n, j = 1, 2, ..., n
                <br />
                期望收益: E(d<sub>i</sub>) = (1/n) × Σ<sub>j</sub> d<sub>ij</sub>
                <br />
                决策准则: max<sub>i</sub>
                {'{'}E(d<sub>i</sub>){'}'}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-1">特点</h3>
              <ul
                className="list-disc list-inside flex flex-col gap-1"
                style={{ color: '#5d6d7e' }}
              >
                <li>将不确定型问题转化为风险型问题处理</li>
                <li>计算简单直观</li>
                <li>假设等概率可能与现实不符</li>
                <li>当状态数差异大时结果可能偏差</li>
                <li>又称 Laplace 准则、等可能性准则</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-1">注意</h3>
              <p style={{ color: '#5d6d7e' }}>
                等概率假设是一个"无信息"情况下的折中策略。如果决策者有任何状态可能性的信息，都应该使用风险型决策的期望值方法而非等概率假设。
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
