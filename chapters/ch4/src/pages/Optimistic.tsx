import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import {
  BookOpen,
  Pencil,
  Lightbulb,
  CheckCircle,
  BarChart3,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Tab data                                                            */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */
const scrollReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

/* ------------------------------------------------------------------ */
/*  Default matrix data                                                 */
/* ------------------------------------------------------------------ */
const defaultMatrix = [
  [500, 150, -50],
  [300, 200, 100],
  [200, 200, 150],
];

const altLabels = ['积极(A₁)', '稳健(A₂)', '保守(A₃)'];
const stateLabels = ['S₁(景气)', 'S₂(不变)', 'S₃(不景气)'];
const altShortLabels = ['A₁', 'A₂', 'A₃'];

/* ------------------------------------------------------------------ */
/*  Custom Bar Label component                                          */
/* ------------------------------------------------------------------ */
function BarLabel(props: { x?: number; y?: number; width?: number; value?: number }) {
  const { x = 0, y = 0, width = 0, value = 0 } = props;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="#1B3A5F"
      textAnchor="middle"
      fontSize={13}
      fontWeight={600}
      fontFamily="'JetBrains Mono', monospace"
    >
      {value}
    </text>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export default function Optimistic() {
  const [matrix, setMatrix] = useState<number[][]>(
    defaultMatrix.map((row) => [...row])
  );

  /* ---- Reset to defaults ---- */
  const handleReset = useCallback(() => {
    setMatrix(defaultMatrix.map((row) => [...row]));
  }, []);

  /* ---- Edit cell ---- */
  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      const num = value === '' ? 0 : Number(value);
      if (Number.isNaN(num)) return;
      setMatrix((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = num;
        return next;
      });
    },
    []
  );

  /* ---- Computed values ---- */
  const rowMaxes = useMemo(
    () => matrix.map((row) => Math.max(...row)),
    [matrix]
  );

  const overallMax = useMemo(
    () => Math.max(...rowMaxes),
    [rowMaxes]
  );

  const optimalRows = useMemo(
    () => rowMaxes.map((v, i) => (Math.abs(v - overallMax) < 1e-9 ? i : -1)).filter((i) => i !== -1),
    [rowMaxes, overallMax]
  );

  /* ---- Chart data ---- */
  const chartData = useMemo(
    () =>
      altLabels.map((label, i) => ({
        name: label,
        value: rowMaxes[i],
        isOptimal: optimalRows.includes(i),
      })),
    [rowMaxes, optimalRows]
  );

  /* ---- Input style ---- */
  const inputBaseStyle: React.CSSProperties = {
    width: '72px',
    padding: '6px',
    textAlign: 'center',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    border: '1px solid #E0DDD5',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#1B3A5F',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div style={{ backgroundColor: '#F8F6F2' }}>
      {/* ==================== TAB NAVIGATION ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
      </motion.div>

      {/* ==================== PAGE TITLE ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={20} style={{ color: '#C8963E' }} />
              <h1
                className="text-2xl font-semibold"
                style={{ color: '#1B3A5F', letterSpacing: '0.02em', fontFamily: "'Noto Serif SC', serif" }}
              >
                乐观决策准则
              </h1>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full ml-1 font-medium"
                style={{ backgroundColor: '#e8f5e9', color: '#4CAF50' }}
              >
                大中取大
              </span>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#fff3e0', color: '#e67e22' }}
              >
                冒险型
              </span>
            </div>
            <p className="text-sm" style={{ color: '#6B6B6B' }}>
              决策者持乐观态度，选择各方案最大收益中的最大值
            </p>
          </div>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-lg border transition-all duration-200 shrink-0"
            style={{ color: '#6B6B6B', borderColor: '#E0DDD5', backgroundColor: '#ffffff' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#1B3A5F';
              (e.currentTarget as HTMLElement).style.borderColor = '#1B3A5F';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#6B6B6B';
              (e.currentTarget as HTMLElement).style.borderColor = '#E0DDD5';
            }}
          >
            <RotateCcw size={14} />
            <span>重置数据</span>
          </button>
        </div>
      </motion.div>

      {/* ==================== KNOWLEDGE CARD ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div
          className="rounded-xl p-5 mb-6"
          style={{ backgroundColor: '#faf3e0', border: '1px solid #f0e6cc' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} style={{ color: '#C8963E' }} />
            <h3 className="text-base font-semibold" style={{ color: '#1B3A5F' }}>
              乐观准则 (Maximax)
            </h3>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: '#5d6d7e' }}>
            乐观决策者相信未来会出现最有利的自然状态，因此先求出每个方案在各种状态下的最大收益，
            再从这些最大值中选择最大的那个方案。
          </p>
          <div
            className="mt-3 px-3 py-2 rounded-md inline-block"
            style={{
              backgroundColor: '#ffffff',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              color: '#1B3A5F',
            }}
          >
            u(Aᵢ*) = maxᵢ{'{'} maxⱼ aᵢⱼ {'}'}
          </div>
        </div>
      </motion.div>

      {/* ==================== EDITABLE PAYOFF MATRIX ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div
          className="rounded-xl p-6 mb-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid #E0DDD5' }}
        >
          {/* Title row */}
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              决策收益矩阵
            </h2>
            <span
              className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: '#e8f5e9', color: '#4CAF50' }}
            >
              <Pencil size={12} />
              可编辑
            </span>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            修改收益值，表格将自动重新计算各方案最大值并高亮最优方案
          </p>

          {/* Matrix table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: '#1B3A5F' }}>
                  <th className="text-left text-white px-3 py-3 font-medium rounded-tl-lg whitespace-nowrap">
                    方案 \ 状态
                  </th>
                  {stateLabels.map((s) => (
                    <th key={s} className="text-center text-white px-3 py-3 font-medium whitespace-nowrap">
                      {s}
                    </th>
                  ))}
                  <th className="text-center text-white px-3 py-3 font-medium whitespace-nowrap">
                    max(aᵢⱼ)
                  </th>
                  <th className="text-center text-white px-3 py-3 font-medium rounded-tr-lg whitespace-nowrap">
                    结果
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => {
                  const isOptimal = optimalRows.includes(i);
                  return (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: isOptimal ? '#f0faf3' : i % 2 === 0 ? '#ffffff' : '#f8f6f3',
                        borderLeft: isOptimal ? '3px solid #4CAF50' : '3px solid transparent',
                      }}
                    >
                      {/* Alt label */}
                      <td
                        className="px-3 py-3 font-medium whitespace-nowrap"
                        style={{ color: '#1B3A5F' }}
                      >
                        {altLabels[i]}
                      </td>

                      {/* Editable cells */}
                      {row.map((val, j) => (
                        <td key={j} className="text-center px-2 py-2">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleCellChange(i, j, e.target.value)}
                            className="focus:border-[#1B3A5F]"
                            style={{
                              ...inputBaseStyle,
                              boxShadow: undefined,
                            }}
                            onFocus={(e) => {
                              (e.target as HTMLInputElement).style.borderColor = '#1B3A5F';
                              (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(27,58,95,0.1)';
                            }}
                            onBlur={(e) => {
                              (e.target as HTMLInputElement).style.borderColor = '#E0DDD5';
                              (e.target as HTMLInputElement).style.boxShadow = 'none';
                            }}
                          />
                        </td>
                      ))}

                      {/* Max value */}
                      <td
                        className="text-center px-3 py-3 font-semibold"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: isOptimal ? '#4CAF50' : '#1B3A5F',
                          fontSize: '15px',
                        }}
                      >
                        {rowMaxes[i]}
                      </td>

                      {/* Result badge */}
                      <td className="text-center px-3 py-3">
                        {isOptimal ? (
                          <span
                            className="text-[12px] px-2.5 py-1 rounded-full font-medium"
                            style={{ backgroundColor: 'rgba(76,175,80,0.1)', color: '#4CAF50' }}
                          >
                            最优
                          </span>
                        ) : (
                          <span className="text-[12px]" style={{ color: '#6B6B6B' }}>
                            —
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

      {/* ==================== CALCULATION PROCESS ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div
          className="rounded-xl p-6 mb-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid #E0DDD5' }}
        >
          {/* Title */}
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} style={{ color: '#C8963E' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              计算过程
            </h2>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-5">
            {/* Step 1 */}
            <motion.div
              custom={0}
              variants={stepVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                Step 1：找出各方案在不同状态下的最大收益
              </h4>
              <div className="flex flex-col gap-1">
                {matrix.map((row, i) => (
                  <div
                    key={i}
                    className="text-sm"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: '#5d6d7e' }}
                  >
                    <span style={{ color: '#1B3A5F' }}>max({altShortLabels[i]})</span>
                    {' = max('}
                    {row.join(', ')}
                    {') = '}
                    <span
                      className="font-semibold"
                      style={{ color: optimalRows.includes(i) ? '#4CAF50' : '#C8963E' }}
                    >
                      {rowMaxes[i]}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              custom={1}
              variants={stepVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                Step 2：从各方案最大收益中选取最大值
              </h4>
              <div
                className="text-sm"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: '#5d6d7e' }}
              >
                <span style={{ color: '#1B3A5F' }}>Maximax</span>
                {' = max{'}
                {rowMaxes.join(', ')}
                {'} = '}
                <span className="font-semibold text-base" style={{ color: '#C8963E' }}>
                  {overallMax}
                </span>
              </div>
              <div
                className="mt-2 text-base font-semibold"
                style={{ color: '#4CAF50' }}
              >
                → 最优方案为：{optimalRows.map((i) => altLabels[i]).join('、')}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ==================== OPTIMAL RESULT CARD ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div
          className="rounded-xl p-6 mb-6"
          style={{
            backgroundColor: '#f0faf3',
            borderLeft: '4px solid #4CAF50',
            borderRadius: '0 12px 12px 0',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={20} style={{ color: '#4CAF50' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#4CAF50' }}>
              最优决策方案
            </h2>
          </div>

          <div className="flex flex-col gap-1">
            <span
              className="text-2xl font-bold"
              style={{ color: '#1B3A5F', fontFamily: "'Noto Serif SC', serif" }}
            >
              {optimalRows.map((i) => altLabels[i]).join('、')}
              {optimalRows.length > 1 ? '（并列最优）' : ''}
            </span>
            <span className="text-base font-semibold" style={{ color: '#C8963E' }}>
              最大收益 = {overallMax}
            </span>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: '#5d6d7e' }}>
              在乐观准则下，最优方案为：{optimalRows.map((i) => altLabels[i]).join('、')}。
              该方案在其最有利自然状态下可获得最大收益，最大收益为 {overallMax}。
            </p>
          </div>
        </div>
      </motion.div>

      {/* ==================== BAR CHART ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div
          className="rounded-xl p-6 mb-6"
          style={{ backgroundColor: '#ffffff', border: '1px solid #E0DDD5' }}
        >
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} style={{ color: '#1B3A5F' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              各方案最大收益对比
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            绿色柱子为最优方案，蓝色为其他方案
          </p>

          {/* Chart */}
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 13, fill: '#1B3A5F', fontFamily: "'Noto Sans SC', sans-serif" }}
                  axisLine={{ stroke: '#E0DDD5' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 'auto']}
                  tick={{ fontSize: 12, fill: '#6B6B6B', fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: '收益值',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12, fill: '#6B6B6B' },
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [value, '最大收益']}
                  contentStyle={{
                    fontSize: 13,
                    fontFamily: "'Noto Sans SC', sans-serif",
                    border: '1px solid #E0DDD5',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} label={<BarLabel />}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isOptimal ? '#4CAF50' : '#2A4A73'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#4CAF50' }}
              />
              <span className="text-[12px]" style={{ color: '#6B6B6B' }}>最优方案</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#2A4A73' }}
              />
              <span className="text-[12px]" style={{ color: '#6B6B6B' }}>其他方案</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ==================== KNOWLEDGE CARD ==================== */}
      <motion.div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mb-12"
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#faf3e0', border: '1px solid #f0e6cc' }}
        >
          {/* Title */}
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} style={{ color: '#1B3A5F' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#1B3A5F' }}>
              知识点：乐观决策准则
            </h3>
          </div>

          {/* Content */}
          <div className="text-sm leading-relaxed" style={{ color: '#5d6d7e' }}>
            <p className="mb-2">
              <span className="font-semibold" style={{ color: '#1B3A5F' }}>适用条件：</span>
              适用于决策者对未来形势持乐观态度，相信会出现最有利的自然状态的场景。
            </p>

            <div
              className="my-3 px-3 py-2 rounded-md inline-block"
              style={{
                backgroundColor: '#ffffff',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                color: '#1B3A5F',
              }}
            >
              Maximax = maxᵢ{'{'} maxⱼ(dᵢⱼ) {'}'}
            </div>

            <p className="mb-3 text-[13px]">
              其中 dᵢⱼ 为方案 Aᵢ 在状态 θⱼ 下的收益值。
              先求每行最大值，再从这些最大值中取最大。
            </p>

            <p className="mb-3 text-[13px]">
              <span className="font-semibold" style={{ color: '#1B3A5F' }}>示例说明：</span>
              当前收益矩阵下，{optimalRows.map((i) => altLabels[i]).join('、')} 在最有利状态下的收益最大（最大收益为 {overallMax}），因此乐观准则选择{optimalRows.length > 1 ? '这些方案' : '该方案'}。修改矩阵后，最优方案会随之动态变化。
            </p>

            <p className="font-semibold mb-1.5" style={{ color: '#1B3A5F' }}>特点：</p>
            <ul className="flex flex-col gap-1 text-[13px]">
              <li className="flex items-start gap-1.5">
                <span style={{ color: '#C8963E' }}>●</span>
                <span>只考虑最好情况，忽略其他状态</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span style={{ color: '#C8963E' }}>●</span>
                <span>风险最大但潜在收益最高</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span style={{ color: '#C8963E' }}>●</span>
                <span>适合实力强、抗风险能力强的决策者</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span style={{ color: '#C8963E' }}>●</span>
                <span>结果极度依赖"最有利状态"是否出现</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
