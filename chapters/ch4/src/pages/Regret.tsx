import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  RotateCcw,
  Lightbulb,
  BookOpen,
  Check,
  CheckCircle,
  BarChart3,
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
import type { ReactNode } from 'react';

/* ─────────────────────── types ─────────────────────── */
interface MatrixData {
  values: number[][]; // 3×3
}

interface RegretResult {
  regretMatrix: number[][];
  maxRegret: number[];
  minMaxRegret: number;
  optimalIndices: number[];
}

/* ─────────────────────── default data ─────────────────────── */
const defaultMatrix: MatrixData = {
  values: [
    [500, 150, -50],
    [300, 200, 100],
    [200, 200, 150],
  ],
};

const alternatives = ['积极(A₁)', '稳健(A₂)', '保守(A₃)'];
const states = ['θ₁（景气）', 'θ₂（不变）', 'θ₃（不景气）'];


/* ─────────────────────── utility: compute regret ─────────────────────── */
function computeRegret(matrix: MatrixData): RegretResult {
  const vals = matrix.values;
  const rows = vals.length;
  const cols = vals[0].length;

  // Step 1: column maxima
  const colMax: number[] = [];
  for (let j = 0; j < cols; j++) {
    let max = vals[0][j];
    for (let i = 1; i < rows; i++) {
      if (vals[i][j] > max) max = vals[i][j];
    }
    colMax.push(max);
  }

  // Step 2: regret matrix
  const regretMatrix: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(colMax[j] - vals[i][j]);
    }
    regretMatrix.push(row);
  }

  // Step 3: max regret per row
  const maxRegret = regretMatrix.map((row) => Math.max(...row));

  // Step 4: min of max regrets
  const minMaxRegret = Math.min(...maxRegret);

  // Optimal rows
  const optimalIndices = maxRegret
    .map((v, i) => (v === minMaxRegret ? i : -1))
    .filter((i) => i !== -1);

  return { regretMatrix, maxRegret, minMaxRegret, optimalIndices };
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

/* ─────────────────────── main component ─────────────────────── */
export default function Regret() {
  const [matrix, setMatrix] = useState<MatrixData>(defaultMatrix);

  const regretResult = useMemo(() => computeRegret(matrix), [matrix]);

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      const num = parseFloat(value);
      if (Number.isNaN(num)) return;
      setMatrix((prev) => {
        const next = { values: prev.values.map((r) => [...r]) };
        next.values[row][col] = num;
        return next;
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    setMatrix(defaultMatrix);
  }, []);

  const chartData = useMemo(
    () =>
      alternatives.map((name, i) => ({
        name,
        maxRegret: regretResult.maxRegret[i],
        isOptimal: regretResult.optimalIndices.includes(i),
      })),
    [regretResult],
  );

  // Column maxima for step-by-step
  const colMaxima = useMemo(() => {
    const cm: number[] = [];
    for (let j = 0; j < matrix.values[0].length; j++) {
      let max = matrix.values[0][j];
      for (let i = 1; i < matrix.values.length; i++) {
        if (matrix.values[i][j] > max) max = matrix.values[i][j];
      }
      cm.push(max);
    }
    return cm;
  }, [matrix]);

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: '#F8F6F2' }}>
      {/* ── Title Section ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw size={20} style={{ color: '#C8963E' }} />
              <h1
                className="text-2xl font-semibold"
                style={{ fontFamily: "'Noto Sans SC', sans-serif", color: '#1B3A5F' }}
              >
                后悔值决策准则 (Savage)
              </h1>
            </div>
            <p className="text-sm" style={{ color: '#6B6B6B' }}>
              构建后悔值矩阵，选择最大后悔值中最小的方案，也称最小最大后悔值准则
            </p>
          </div>
          <div className="flex gap-2">
            {['最小最大后悔值', 'Savage准则', '机会损失'].map((t) => (
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

      {/* ── Original Payoff Matrix ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              原始收益矩阵
            </h2>
            <Tag text="可编辑" />
          </div>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            修改收益值，后悔值矩阵将自动重新计算
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#1B3A5F', color: '#ffffff' }}>
                  <th className="px-4 py-3 text-left text-sm font-medium">方案 \ 状态</th>
                  {states.map((s) => (
                    <th key={s} className="px-4 py-3 text-center text-sm font-medium">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.values.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8f6f3',
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Regret Matrix ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <motion.div
          className="bg-white rounded-xl p-6"
          style={{ border: '2px solid #C8963E' }}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{
            duration: 0.5,
            delay: 0.2,
            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} style={{ color: '#C8963E' }} />
              <h2
                className="text-lg font-semibold"
                style={{ color: '#1B3A5F' }}
              >
                后悔值矩阵
              </h2>
            </div>
            <span
              className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: '#e3f2fd',
                color: '#1B3A5F',
                borderRadius: '20px',
              }}
            >
              自动计算
            </span>
          </div>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            后悔值 R<sub>ij</sub> = max<sub>k</sub>(d<sub>kj</sub>) − d<sub>ij</sub>，表示选择方案A<sub>i</sub>而实际发生θ<sub>j</sub>时的机会损失
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#C8963E', color: '#ffffff' }}>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    方案 \ 状态
                  </th>
                  {states.map((s) => (
                    <th key={s} className="px-4 py-3 text-center text-sm font-medium">
                      {s}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    max(R<sub>ij</sub>)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">结果</th>
                </tr>
              </thead>
              <tbody>
                {regretResult.regretMatrix.map((row, i) => {
                  const isOptimal = regretResult.optimalIndices.includes(i);
                  return (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: isOptimal ? '#f0faf3' : i % 2 === 0 ? '#ffffff' : '#f8f6f3',
                        borderLeft: isOptimal ? '3px solid #4CAF50' : '3px solid transparent',
                      }}
                    >
                      <td
                        className="px-4 py-3 text-sm font-medium"
                        style={{ color: '#1B3A5F' }}
                      >
                        {alternatives[i]}
                      </td>
                      {row.map((val, j) => (
                        <td
                          key={j}
                          className="px-4 py-3 text-center text-sm font-semibold"
                          style={{
                            backgroundColor: val === 0 ? '#e8f5e9' : 'transparent',
                            color: val === 0 ? '#4CAF50' : '#1B3A5F',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {val}
                            {val === 0 && <Check size={12} strokeWidth={2.5} style={{ color: '#4CAF50' }} />}
                          </div>
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
                        {regretResult.maxRegret[i]}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOptimal ? <OptimalTag /> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            className="mt-4 p-3 text-sm font-semibold"
            style={{
              backgroundColor: '#f0faf3',
              borderRadius: '8px',
              color: '#4CAF50',
            }}
          >
            最优方案 = min<sub>i</sub>{' '}
            {'{'}max<sub>j</sub>(R<sub>ij</sub>){'}'} = {'{'}
            {regretResult.maxRegret.join(', ')}）= {regretResult.minMaxRegret}
            <br />
            →{' '}
            {regretResult.optimalIndices.length > 1
              ? `${regretResult.optimalIndices.map((i) => alternatives[i]).join(' 和 ')} 同为最优方案（后悔值并列最小）`
              : `${alternatives[regretResult.optimalIndices[0]]} 为最优方案`}
          </div>
        </motion.div>
      </div>

      {/* ── Calculation Steps ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              后悔值计算过程
            </h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            {/* Step 1 */}
            <motion.div variants={staggerStep}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                Step 1：找出每列的最大收益
              </h3>
              <div
                className="p-3 text-sm font-mono"
                style={{
                  backgroundColor: '#f8f6f3',
                  borderRadius: '6px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#1B3A5F',
                }}
              >
                {states.map((s, j) => (
                  <div key={j}>
                    max({s}) = max(
                    {matrix.values.map((row) => row[j]).join(', ')}) ={' '}
                    <span style={{ color: '#C8963E', fontWeight: 600 }}>{colMaxima[j]}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={staggerStep}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                Step 2：计算每个后悔值 R<sub>ij</sub> = 列最大值 − d<sub>ij</sub>
              </h3>
              <div
                className="p-3 text-sm"
                style={{
                  backgroundColor: '#f8f6f3',
                  borderRadius: '6px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#1B3A5F',
                }}
              >
                {states.map((s, j) => (
                  <div key={j} className="mb-2">
                    <div className="font-medium" style={{ color: '#2A4A73' }}>
                      {s}：
                    </div>
                    {alternatives.map((_a, i) => {
                      const regret = regretResult.regretMatrix[i][j];
                      return (
                        <div key={i} className="ml-2">
                          R<sub>{i + 1}</sub>
                          <sub>{j + 1}</sub> = {colMaxima[j]} − ({matrix.values[i][j]}) ={' '}
                          <span
                            style={{
                              color: regret === 0 ? '#4CAF50' : '#1B3A5F',
                              fontWeight: regret === 0 ? 600 : 400,
                            }}
                          >
                            {regret}
                            {regret === 0 && ' ✓'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={staggerStep}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                Step 3：找出每行最大后悔值
              </h3>
              <div
                className="p-3 text-sm"
                style={{
                  backgroundColor: '#f8f6f3',
                  borderRadius: '6px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#1B3A5F',
                }}
              >
                {alternatives.map((_a, i) => {
                  const row = regretResult.regretMatrix[i];
                  return (
                    <div key={i}>
                      max(R<sub>{i + 1}</sub>) = max({row.join(', ')}) ={' '}
                      <span
                        style={{
                          color: regretResult.optimalIndices.includes(i)
                            ? '#4CAF50'
                            : '#1B3A5F',
                          fontWeight: 600,
                        }}
                      >
                        {regretResult.maxRegret[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div variants={staggerStep}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                Step 4：选取最大后悔值中的最小值
              </h3>
              <div
                className="p-3 text-sm font-semibold"
                style={{
                  backgroundColor: '#faf3e0',
                  borderRadius: '6px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#1B3A5F',
                }}
              >
                min{'{'}
                {regretResult.maxRegret.join(', ')} ={' '}
                <span style={{ color: '#C8963E' }}>{regretResult.minMaxRegret}</span>
                <br />
                → 最优方案：
                {regretResult.optimalIndices.map((i) => alternatives[i]).join(' 和 ')}
                {regretResult.optimalIndices.length > 1 ? ' 并列' : ''}
              </div>
            </motion.div>
          </motion.div>
        </Card>
      </div>

      {/* ── Optimal Result ── */}
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
            {regretResult.optimalIndices.map((idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 flex-wrap"
              >
                <span className="text-xl font-semibold" style={{ color: '#1B3A5F' }}>
                  {alternatives[idx].replace(/\(.*?\)/, '')}策略 {alternatives[idx].match(/\(.*?\)/)?.[0]}
                </span>
                <span className="text-sm" style={{ color: '#C8963E' }}>
                  最大后悔值 = {regretResult.maxRegret[idx]}
                </span>
              </div>
            ))}
            {regretResult.optimalIndices.length > 1 && <TiedTag />}
          </div>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: '#5d6d7e' }}>
            在后悔值准则下，决策者希望最小化"事后后悔"的程度。
            {regretResult.optimalIndices.map((i) => alternatives[i]).join('和')}
            策略的最大后悔值均为{regretResult.minMaxRegret}，
            {regretResult.optimalIndices.length > 1 ? '并列最优。若需进一步抉择，可结合其他准则或决策者偏好。' : '为最优。'}
          </p>
        </motion.div>
      </div>

      {/* ── Bar Chart ── */}
      <div className="max-w-[1200px] mx-auto px-4 pb-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              最大后悔值对比
            </h2>
          </div>

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
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#1B3A5F' }} />
              <YAxis
                domain={[0, 350]}
                tick={{ fontSize: 12, fill: '#1B3A5F' }}
                label={{ value: '后悔值', angle: -90, position: 'insideLeft', offset: -5, style: { fill: '#6B6B6B', fontSize: 12 } }}
              />
              <Tooltip
                formatter={(value: number) => [value, '最大后悔值']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E0DDD5',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="maxRegret" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isOptimal ? '#4CAF50' : '#2A4A73'}
                  />
                ))}
              </Bar>
              <ReferenceLine
                y={regretResult.minMaxRegret}
                stroke="#C8963E"
                strokeDasharray="4 4"
                label={{
                  value: `最优 = ${regretResult.minMaxRegret}`,
                  position: 'right',
                  fill: '#C8963E',
                  fontSize: 12,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
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
              知识点：Savage 后悔值准则
            </h2>
          </div>

          <div className="flex flex-col gap-4 text-sm" style={{ color: '#1B3A5F', lineHeight: 1.7 }}>
            <div>
              <h3 className="font-semibold mb-1">适用条件</h3>
              <p style={{ color: '#5d6d7e' }}>
                适用于决策者关注"机会损失"（即事后后悔程度）的场景。决策者希望无论哪种状态发生，自己的后悔都不会太大。
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
                后悔值定义: R<sub>ij</sub> = max<sub>k</sub>(d<sub>kj</sub>) − d<sub>ij</sub>
                <br />
                决策准则: min<sub>i</sub>{' '}
                {'{'}max<sub>j</sub>(R<sub>ij</sub>){'}'}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-1">计算步骤</h3>
              <ol
                className="list-decimal list-inside flex flex-col gap-1"
                style={{ color: '#5d6d7e' }}
              >
                <li>对每一列（状态），找出最大收益</li>
                <li>用列最大值减去每个元素，得到后悔值</li>
                <li>对每一行（方案），找出最大后悔值</li>
                <li>选择最大后悔值中最小的方案</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-1">特点</h3>
              <ul
                className="list-disc list-inside flex flex-col gap-1"
                style={{ color: '#5d6d7e' }}
              >
                <li>关注机会损失而非绝对收益</li>
                <li>结果通常介于乐观和悲观之间</li>
                <li>可能出现多个方案并列最优的情况</li>
                <li>又称 Savage 准则、最小最大后悔值准则</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
