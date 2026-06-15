import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  RotateCcw,
  BookOpen,
  CheckCircle,
  XCircle,
  BarChart3,
  Scale,
  GitBranch,
  Pencil,
  Info,
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
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import CalculationSteps from '@/components/CalculationSteps';
import KnowledgeCard from '@/components/KnowledgeCard';
import OptimalCard from '@/components/OptimalCard';
import FormulaBlock from '@/components/FormulaBlock';

/* ------------------------------------------------------------------ */
/*  Constants & Types                                                  */
/* ------------------------------------------------------------------ */

const CRITERIA_LABELS = ['经济效益 C₁', '社会效益 C₂', '环境效益 C₃'];
const CRITERIA_SHORT = ['C₁', 'C₂', 'C₃'];
const ALT_LABELS = ['方案 A₁', '方案 A₂', '方案 A₃'];
const ALT_SHORT = ['A₁', 'A₂', 'A₃'];

const RI_MAP: Record<number, number> = {
  1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
};

const SCALE_OPTIONS = [
  { value: 1, label: '1', text: '同等重要' },
  { value: 2, label: '2', text: '中间值' },
  { value: 3, label: '3', text: '稍重要' },
  { value: 4, label: '4', text: '中间值' },
  { value: 5, label: '5', text: '明显重要' },
  { value: 6, label: '6', text: '中间值' },
  { value: 7, label: '7', text: '强烈重要' },
  { value: 8, label: '8', text: '中间值' },
  { value: 9, label: '9', text: '极端重要' },
  { value: 1 / 2, label: '1/2', text: '中间值' },
  { value: 1 / 3, label: '1/3', text: '稍不重要' },
  { value: 1 / 4, label: '1/4', text: '中间值' },
  { value: 1 / 5, label: '1/5', text: '明显不重要' },
  { value: 1 / 6, label: '1/6', text: '中间值' },
  { value: 1 / 7, label: '1/7', text: '强烈不重要' },
  { value: 1 / 8, label: '1/8', text: '中间值' },
  { value: 1 / 9, label: '1/9', text: '极端不重要' },
];

const DEFAULT_CRITERIA_MATRIX: number[][] = [
  [1, 3, 5],
  [1 / 3, 1, 2],
  [1 / 5, 1 / 2, 1],
];

const DEFAULT_ALT_MATRICES: number[][][] = [
  // C₁: 经济效益
  [
    [1, 2, 4],
    [1 / 2, 1, 2],
    [1 / 4, 1 / 2, 1],
  ],
  // C₂: 社会效益
  [
    [1, 1 / 2, 1 / 3],
    [2, 1, 1 / 2],
    [3, 2, 1],
  ],
  // C₃: 环境效益
  [
    [1, 1 / 3, 1 / 5],
    [3, 1, 1 / 2],
    [5, 2, 1],
  ],
];

/* ------------------------------------------------------------------ */
/*  Helper: round to 3 decimals                                        */
/* ------------------------------------------------------------------ */
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r4 = (v: number) => Math.round(v * 10000) / 10000;

/* ------------------------------------------------------------------ */
/*  AHP Math Utilities                                                 */
/* ------------------------------------------------------------------ */

/** Compute weights using the 和积法 (sum-product / approximate eigenvector) */
function computeWeights(matrix: number[][]): number[] {
  const n = matrix.length;
  // Step 1: column sums
  const colSums: number[] = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }
  // Step 2: normalize each column
  const normalized: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      normalized[i][j] = matrix[i][j] / colSums[j];
    }
  }
  // Step 3: row averages
  const weights: number[] = [];
  for (let i = 0; i < n; i++) {
    const rowSum = normalized[i].reduce((a, b) => a + b, 0);
    weights.push(rowSum / n);
  }
  return weights;
}

/** Compute consistency metrics */
function computeConsistency(matrix: number[][], weights: number[]) {
  const n = matrix.length;
  // AW = A * W
  const aw: number[] = [];
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += matrix[i][j] * weights[j];
    }
    aw.push(sum);
  }
  // λ_i = (AW)_i / w_i
  const lambdas = aw.map((val, i) => val / weights[i]);
  const lambdaMax = lambdas.reduce((a, b) => a + b, 0) / n;
  const ci = (lambdaMax - n) / (n - 1);
  const ri = RI_MAP[n] ?? 1.49;
  // CR only meaningful when n >= 3 (RI=0 for n=1,2)
  let cr: number;
  let crValid = true;
  if (n <= 2) {
    cr = 0; // CR not computable when RI=0
    crValid = false;
  } else {
    cr = ci / ri;
  }
  return { aw, lambdas, lambdaMax, ci, ri, cr, crValid, n };
}

/** Compute global ranking from criteria weights and alternative weights */
function computeGlobalRanking(
  criteriaWeights: number[],
  altWeights: number[][]
): number[] {
  const n = altWeights[0].length;
  const global: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < criteriaWeights.length; c++) {
      global[i] += criteriaWeights[c] * altWeights[c][i];
    }
  }
  return global;
}

/** Format a matrix value nicely */
function formatValue(v: number): string {
  if (Math.abs(v - 1) < 1e-10) return '1';
  if (v < 1) {
    const recip = Math.round(1 / v);
    return `1/${recip}`;
  }
  return String(Math.round(v * 1000) / 1000);
}

/** Parse a select value string to number */
function parseScaleValue(val: string): number {
  if (val.startsWith('1/')) {
    return 1 / parseInt(val.split('/')[1], 10);
  }
  return parseInt(val, 10);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Section wrapper with animation */
function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className={`bg-white rounded-xl p-6 mb-6 ${className}`}
      style={{ border: '1px solid #E0DDD5' }}
    >
      {children}
    </motion.div>
  );
}

/** SVG Hierarchy Diagram */
function HierarchyDiagram() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const isHighlighted = (node: string) => {
    if (!hoveredNode) return false;
    if (hoveredNode === node) return true;
    // Lines from criteria to hovered alternatives
    if (hoveredNode.startsWith('alt') && node.startsWith('crit')) return true;
    if (hoveredNode.startsWith('crit') && node.startsWith('alt')) return true;
    return false;
  };

  const isLineHighlighted = (from: string, to: string) => {
    if (!hoveredNode) return false;
    return from === hoveredNode || to === hoveredNode;
  };

  return (
    <div className="w-full flex justify-center overflow-x-auto">
      <svg viewBox="0 0 600 300" className="w-full max-w-[600px]" style={{ minHeight: 280 }}>
        {/* Target layer label */}
        <text x="300" y="18" textAnchor="middle" fontSize="12" fill="#6B6B6B">
          目标层
        </text>
        {/* Goal node */}
        <rect
          x="190"
          y="28"
          width="220"
          height="38"
          rx="8"
          fill="#1B3A5F"
          stroke={isHighlighted('goal') ? '#C8963E' : '#1B3A5F'}
          strokeWidth={isHighlighted('goal') ? 3 : 1}
          className="cursor-pointer"
          onMouseEnter={() => setHoveredNode('goal')}
          onMouseLeave={() => setHoveredNode(null)}
        />
        <text x="300" y="53" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="600">
          选择最佳投资项目
        </text>

        {/* Lines: Goal → Criteria */}
        {[100, 300, 500].map((cx, i) => (
          <line
            key={`gl${i}`}
            x1="300"
            y1="66"
            x2={cx}
            y2="140"
            stroke={isLineHighlighted('goal', `crit${i}`) ? '#3b82f6' : '#9E9E9E'}
            strokeWidth={isLineHighlighted('goal', `crit${i}`) ? 3 : 2}
          />
        ))}

        {/* Criteria layer label */}
        <text x="300" y="92" textAnchor="middle" fontSize="12" fill="#6B6B6B">
          准则层
        </text>
        {/* Criteria nodes */}
        {[
          { x: 100, label: '经济效益 C₁', id: 'crit0' },
          { x: 300, label: '社会效益 C₂', id: 'crit1' },
          { x: 500, label: '环境效益 C₃', id: 'crit2' },
        ].map((c) => (
          <g key={c.id}>
            <rect
              x={c.x - 80}
              y="140"
              width="160"
              height="34"
              rx="8"
              fill="#3b82f6"
              stroke={isHighlighted(c.id) ? '#f59e0b' : '#3b82f6'}
              strokeWidth={isHighlighted(c.id) ? 3 : 1}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(c.id)}
              onMouseLeave={() => setHoveredNode(null)}
            />
            <text x={c.x} y="162" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="600">
              {c.label}
            </text>
          </g>
        ))}

        {/* Lines: Criteria → Alternatives */}
        {[100, 300, 500].map((cx, ci) =>
          [130, 300, 470].map((ax, ai) => (
            <line
              key={`ca${ci}-${ai}`}
              x1={cx}
              y1="174"
              x2={ax}
              y2="248"
              stroke={isLineHighlighted(`crit${ci}`, `alt${ai}`) ? '#4CAF50' : '#E0DDD5'}
              strokeWidth={isLineHighlighted(`crit${ci}`, `alt${ai}`) ? 2.5 : 1.5}
            />
          ))
        )}

        {/* Alternatives layer label */}
        <text x="300" y="200" textAnchor="middle" fontSize="12" fill="#6B6B6B">
          方案层
        </text>
        {/* Alternative nodes */}
        {[
          { x: 130, label: '方案 A₁', id: 'alt0' },
          { x: 300, label: '方案 A₂', id: 'alt1' },
          { x: 470, label: '方案 A₃', id: 'alt2' },
        ].map((a) => (
          <g key={a.id}>
            <rect
              x={a.x - 60}
              y="248"
              width="120"
              height="34"
              rx="8"
              fill="#fff"
              stroke={isHighlighted(a.id) ? '#4CAF50' : '#4CAF50'}
              strokeWidth={isHighlighted(a.id) ? 3 : 2}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(a.id)}
              onMouseLeave={() => setHoveredNode(null)}
            />
            <text x={a.x} y="270" textAnchor="middle" fill="#2A4A73" fontSize="13" fontWeight="600">
              {a.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Editable judgment matrix (upper triangular) */
function JudgmentMatrixInput({
  matrix,
  onChange,
  labels,
  shortLabels,
}: {
  matrix: number[][];
  onChange: (matrix: number[][]) => void;
  labels: string[];
  shortLabels: string[];
}) {
  void labels; // labels available for display context

  const handleUpperChange = useCallback(
    (row: number, col: number, val: string) => {
      const num = parseScaleValue(val);
      const newMatrix = matrix.map((r) => [...r]);
      newMatrix[row][col] = num;
      newMatrix[col][row] = 1 / num; // reciprocal
      onChange(newMatrix);
    },
    [matrix, onChange]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] border-collapse">
        <thead>
          <tr style={{ background: '#2A4A73' }}>
            <th className="px-3 py-2.5 text-white text-sm font-medium text-center" style={{ minWidth: 70 }}>
              —
            </th>
            {shortLabels.map((l, i) => (
              <th
                key={i}
                className="px-3 py-2.5 text-white text-sm font-medium text-center"
                style={{ minWidth: 90 }}
              >
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr
              key={i}
              style={{ background: i % 2 === 0 ? '#fff' : '#F8F6F2' }}
            >
              <td
                className="px-3 py-2 text-sm font-medium text-center"
                style={{ color: '#1B3A5F', background: '#f1f5f9' }}
              >
                {shortLabels[i]}
              </td>
              {row.map((val, j) => {
                if (i === j) {
                  return (
                    <td key={j} className="px-2 py-2 text-center">
                      <div
                        className="flex items-center justify-center h-9 text-sm font-medium rounded-md"
                        style={{ background: '#f1f5f9', color: '#9E9E9E' }}
                      >
                        1
                      </div>
                    </td>
                  );
                }
                if (i < j) {
                  // Upper triangle - editable
                  return (
                    <td key={j} className="px-2 py-2 text-center">
                      <select
                        value={val < 1 ? formatValue(val) : String(Math.round(val))}
                        onChange={(e) => handleUpperChange(i, j, e.target.value)}
                        className="w-full h-9 px-1 text-sm text-center border rounded-md outline-none transition-all duration-200"
                        style={{
                          borderColor: '#E0DDD5',
                          background: '#fff',
                          color: '#2A4A73',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,58,95,0.15)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E0DDD5';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {SCALE_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                }
                // Lower triangle - auto-filled reciprocal
                return (
                  <td key={j} className="px-2 py-2 text-center">
                    <div
                      className="flex items-center justify-center h-9 text-sm font-medium rounded-md"
                      style={{ background: '#F8F6F2', color: '#6B6B6B' }}
                    >
                      {formatValue(val)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Weight progress bar */
function WeightBar({
  label,
  weight,
  color,
  index,
}: {
  label: string;
  weight: number;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.35 }}
      className="flex items-center gap-3 mb-3"
    >
      <span className="text-sm font-medium w-28 text-right" style={{ color: '#2A4A73' }}>
        {label}
      </span>
      <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: '#f1f5f9' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${weight * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.15 }}
          className="h-full rounded-md flex items-center justify-end pr-2"
          style={{ background: color }}
        >
          <span className="text-xs font-semibold text-white">
            {(weight * 100).toFixed(1)}%
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

/** Consistency result badge */
function ConsistencyBadge({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
      style={{
        background: highlight ? '#dbeafe' : '#fff',
        border: '1px solid #E0DDD5',
      }}
    >
      <span style={{ color: '#6B6B6B' }}>{label} =</span>
      <span className="font-semibold font-mono" style={{ color: '#1B3A5F' }}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function AhpPage() {
  /* State */
  const [criteriaMatrix, setCriteriaMatrix] = useState<number[][]>(
    DEFAULT_CRITERIA_MATRIX.map((r) => [...r])
  );
  const [altMatrices, setAltMatrices] = useState<number[][][]>(
    DEFAULT_ALT_MATRICES.map((m) => m.map((r) => [...r]))
  );
  const [activeAltTab, setActiveAltTab] = useState(0);

  /* Computed: Criteria weights & consistency */
  const criteriaWeights = useMemo(() => computeWeights(criteriaMatrix), [criteriaMatrix]);
  const criteriaConsistency = useMemo(
    () => computeConsistency(criteriaMatrix, criteriaWeights),
    [criteriaMatrix, criteriaWeights]
  );

  /* Computed: Alternative weights per criterion */
  const altWeightsPerCriterion = useMemo(
    () => altMatrices.map((m) => computeWeights(m)),
    [altMatrices]
  );

  /* Computed: Global ranking */
  const globalWeights = useMemo(
    () => computeGlobalRanking(criteriaWeights, altWeightsPerCriterion),
    [criteriaWeights, altWeightsPerCriterion]
  );

  /* Consistency for each alternative matrix (computed but displayed per-tab) */
  useMemo(
    () =>
      altMatrices.map((m, i) => computeConsistency(m, altWeightsPerCriterion[i])),
    [altMatrices, altWeightsPerCriterion]
  );

  /* Global ranking sorted */
  const ranked = useMemo(() => {
    const entries = globalWeights.map((w, i) => ({
      name: ALT_LABELS[i],
      short: ALT_SHORT[i],
      weight: w,
      originalIndex: i,
    }));
    entries.sort((a, b) => b.weight - a.weight);
    return entries;
  }, [globalWeights]);

  const bestAltIndex = ranked[0]?.originalIndex ?? 0;

  /* Tab colors */
  const tabColors = ['#3b82f6', '#4CAF50', '#a855f7'];

  /* Reset handler */
  const handleReset = () => {
    setCriteriaMatrix(DEFAULT_CRITERIA_MATRIX.map((r) => [...r]));
    setAltMatrices(DEFAULT_ALT_MATRICES.map((m) => m.map((r) => [...r])));
    setActiveAltTab(0);
  };

  /* Update alternative matrix */
  const updateAltMatrix = (criterionIndex: number, matrix: number[][]) => {
    const next = altMatrices.map((m, i) => (i === criterionIndex ? matrix : m));
    setAltMatrices(next);
  };

  /* Scale reference cards */
  const scaleRefCards = [
    { value: 1, text: '同等重要', bg: '#fff' },
    { value: 2, text: '中间值', bg: '#F8F6F2' },
    { value: 3, text: '稍重要', bg: '#f1f5f9' },
    { value: 4, text: '中间值', bg: '#E0DDD5' },
    { value: 5, text: '明显重要', bg: '#9E9E9E' },
    { value: 6, text: '中间值', bg: '#E0DDD5' },
    { value: 7, text: '强烈重要', bg: '#f1f5f9' },
    { value: 8, text: '中间值', bg: '#F8F6F2' },
    { value: 9, text: '极端重要', bg: '#fff' },
  ];

  /* Calculation steps for criteria weight */
  const weightCalcSteps = useMemo(() => {
    // Column normalization
    const n = criteriaMatrix.length;
    const colSums: number[] = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        colSums[j] += criteriaMatrix[i][j];
      }
    }
    const normalized: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        normalized[i][j] = r3(criteriaMatrix[i][j] / colSums[j]);
      }
    }

    return [
      {
        title: 'Step 1: 列归一化 — 将判断矩阵每列除以列和',
        formula: `列和 = [${colSums.map(r3).join(', ')}]`,
        result: `归一化矩阵:\n  [${normalized[0].join(', ')}]\n  [${normalized[1].join(', ')}]\n  [${normalized[2].join(', ')}]`,
        highlight: true,
      },
      {
        title: 'Step 2: 行平均 — 对归一化矩阵每行求平均',
        formula: `w₁ = (${normalized[0].join(' + ')}) / 3 = ${r3(criteriaWeights[0])}\nw₂ = (${normalized[1].join(' + ')}) / 3 = ${r3(criteriaWeights[1])}\nw₃ = (${normalized[2].join(' + ')}) / 3 = ${r3(criteriaWeights[2])}`,
        result: `权重向量 W = [${criteriaWeights.map((w) => r3(w)).join(', ')}]ᵀ`,
        highlight: true,
      },
    ];
  }, [criteriaMatrix, criteriaWeights]);

  /* Consistency steps */
  const consistencySteps = useMemo(() => {
    const { aw, lambdas, lambdaMax, ci, ri, cr } = criteriaConsistency;
    return [
      {
        title: 'Step 1: 计算 AW = A × W',
        formula: `AW = [${aw.map((v) => r3(v)).join(', ')}]ᵀ`,
        highlight: true,
      },
      {
        title: 'Step 2: 计算 λᵢ = (AW)ᵢ / wᵢ',
        formula: lambdas.map((v, i) => `λ${i + 1} = ${r3(aw[i])} / ${r3(criteriaWeights[i])} = ${r3(v)}`).join('\n'),
        result: `λ_max = (${lambdas.map(r3).join(' + ')}) / 3 = ${r3(lambdaMax)}`,
        highlight: true,
      },
      {
        title: 'Step 3: 计算 CI = (λ_max - n) / (n - 1)',
        formula: `CI = (${r3(lambdaMax)} - 3) / (3 - 1) = ${r3(ci)}`,
        highlight: true,
      },
      {
        title: 'Step 4: 查表得 RI',
        formula: 'n = 3 时，RI = 0.58',
        highlight: true,
      },
      {
        title: 'Step 5: 计算 CR = CI / RI',
        formula: `CR = ${r3(ci)} / ${ri} = ${r4(cr)}`,
        result: cr < 0.1 ? 'CR < 0.10 ✅ 通过一致性检验' : 'CR ≥ 0.10 ❌ 未通过一致性检验',
        optimal: cr < 0.1,
      },
    ];
  }, [criteriaConsistency, criteriaWeights]);

  /* Global ranking calculation steps */
  const globalCalcSteps = useMemo(() => {
    return [
      {
        title: '综合权重计算: Σ(准则权重 × 方案在该准则下的权重)',
        formula: ALT_SHORT.map((alt, i) => {
          const terms = CRITERIA_SHORT.map((_, ci) => `${r3(criteriaWeights[ci])}×${r3(altWeightsPerCriterion[ci][i])}`);
          return `${alt}: ${terms.join(' + ')} = ${r3(globalWeights[i])}`;
        }).join('\n'),
        result: `排序: ${ranked.map((r) => r.short).join(' > ')}`,
        highlight: true,
        optimal: false,
      },
    ];
  }, [criteriaWeights, altWeightsPerCriterion, globalWeights, ranked]);

  /* Recharts data for global ranking */
  const chartData = useMemo(
    () =>
      ALT_SHORT.map((name, i) => ({
        name,
        weight: r3(globalWeights[i]),
        fill: i === bestAltIndex ? '#4CAF50' : i === ranked[1]?.originalIndex ? '#3b82f6' : '#a855f7',
      })),
    [globalWeights, bestAltIndex, ranked]
  );

  /* Section pills */
  const pills = [
    { label: '5.1', path: '/criteria-system', text: '目标准则体系' },
    { label: '5.2', path: '/utility-merging', text: '多维效用并合' },
    { label: '5.3', path: '/ahp', text: 'AHP' },
    { label: '5.4', path: '/dea', text: 'DEA' },
  ];

  /* Knowledge sections */
  const knowledgeSections = [
    {
      subtitle: '适用条件',
      content: [
        '适用于定性因素与定量因素相结合的复杂多准则决策问题',
        '涉及多个层次、多个准则和多个方案的系统化决策场景',
        '需要领域专家对准则间相对重要性进行判断',
      ],
    },
    {
      subtitle: '1-9 标度法',
      content: [
        '1: 两个因素同等重要',
        '3: 前者比后者稍重要',
        '5: 前者比后者明显重要',
        '7: 前者比后者强烈重要',
        '9: 前者比后者极端重要',
        '2,4,6,8: 上述相邻判断的中间值',
        '倒数: 后者相对于前者的比较值',
      ],
    },
    {
      subtitle: '一致性检验公式',
      content: [
        'CI = (λ_max - n) / (n - 1)',
        'CR = CI / RI',
        '当 CR < 0.10 时，判断矩阵通过一致性检验',
        '当 CR ≥ 0.10 时，需要重新调整判断矩阵',
      ],
    },
    {
      subtitle: '特点',
      content: [
        '系统化、层次化的分析框架',
        '将定性判断定量化，便于计算和比较',
        '通过一致性检验保证判断的逻辑合理性',
        '适用于目标结构复杂、准则较多的决策问题',
      ],
    },
    {
      subtitle: '注意事项',
      content: [
        '判断矩阵的构建需要领域专家参与',
        '准则数不宜过多(建议不超过9个)，否则一致性难以保证',
        '1-9标度法是一种近似方法，存在一定主观性',
        '当CR≥0.10时，需要找出矛盾最大的元素进行调整',
        '层次总排序也需要进行一致性检验',
      ],
    },
  ];

  /* AHP steps for theory card */
  const ahpSteps = [
    { num: '①', text: '建立递阶层次结构(目标层→准则层→方案层)' },
    { num: '②', text: '构建两两比较判断矩阵(1-9标度法)' },
    { num: '③', text: '计算权重向量(特征向量法)' },
    { num: '④', text: '一致性检验(CI、RI、CR)' },
    { num: '⑤', text: '层次总排序与决策' },
  ];

  return (
    <Layout>
      <div className="px-4 md:px-6 py-6 max-w-[1200px] mx-auto">
        {/* Section Pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {pills.map((p) => (
            <a
              key={p.label}
              href={`/#${p.path}`}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 no-underline"
              style={{
                background: p.label === '5.3' ? '#1B3A5F' : '#fff',
                color: p.label === '5.3' ? '#fff' : '#6B6B6B',
                border: p.label === '5.3' ? '1px solid #1B3A5F' : '1px solid #E0DDD5',
              }}
            >
              {p.label} {p.text}
            </a>
          ))}
        </div>

        {/* Breadcrumb */}
        <Breadcrumb
          items={[{ label: '首页', path: '/' }, { label: '5.3 层次分析(AHP)' }]}
        />

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: '#1B3A5F', color: '#fff' }}
              >
                <Layers size={14} />
                5.3
              </span>
              <span className="text-xs font-medium" style={{ color: '#9E9E9E' }}>
                多目标决策分析
              </span>
            </div>
            <h1 className="text-[28px] font-bold leading-tight" style={{ color: '#1B3A5F' }}>
              层次分析方法
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
              Analytic Hierarchy Process (AHP) — 构建递阶层次结构进行系统化决策分析
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['AHP', '判断矩阵', '一致性检验', '层次排序'].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-xs font-medium"
                  style={{ background: '#f1f5f9', color: '#6B6B6B' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer self-start"
            style={{
              background: '#f1f5f9',
              color: '#6B6B6B',
              border: '1px solid #E0DDD5',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E0DDD5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
            }}
          >
            <RotateCcw size={14} />
            重置数据
          </button>
        </motion.div>

        {/* Section 1: Theory Card */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              层次分析法概述
            </h2>
          </div>
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
            层次分析法(Analytic Hierarchy Process, AHP)是由美国运筹学家T.L. Saaty于1970年代提出的一种定性与定量相结合的决策分析方法。
            它将复杂的决策问题分解为递阶层次结构，通过构建判断矩阵、计算权重向量和一致性检验，实现对方案的系统排序。
          </p>
          <div className="flex flex-col gap-2">
            {ahpSteps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="flex items-center gap-4 px-4 py-3 rounded-lg"
                style={{ background: '#F8F6F2' }}
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06 + 0.1, type: 'spring', stiffness: 300 }}
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white flex-shrink-0"
                  style={{ background: '#1B3A5F' }}
                >
                  {s.num}
                </motion.span>
                <span className="text-sm" style={{ color: '#2A4A73' }}>
                  {s.text}
                </span>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* Section 2: Hierarchy Diagram */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              递阶层次结构
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            AHP将决策问题分解为目标层、准则层和方案层三个层次
          </p>
          <HierarchyDiagram />
        </SectionCard>

        {/* Section 3: Judgment Matrix */}
        <SectionCard>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Pencil size={18} style={{ color: '#3b82f6' }} />
              <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
                判断矩阵构建
              </h2>
            </div>
            <span
              className="px-2 py-0.5 rounded-md text-xs font-medium"
              style={{ background: '#E8F5E9', color: '#4CAF50' }}
            >
              可编辑
            </span>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            使用1-9标度法进行准则间两两比较，输入判断矩阵（下方三角自动对称填充倒数）
          </p>

          {/* 1-9 Scale Reference */}
          <div className="flex flex-wrap gap-2 mb-5 overflow-x-auto pb-2">
            {scaleRefCards.map((s) => (
              <div
                key={s.value}
                className="flex flex-col items-center min-w-[60px] px-2 py-1.5 rounded-md border text-center"
                style={{ background: s.bg, borderColor: '#E0DDD5' }}
              >
                <span className="text-sm font-semibold" style={{ color: '#2A4A73' }}>
                  {s.value}
                </span>
                <span className="text-[11px]" style={{ color: '#6B6B6B' }}>
                  {s.text}
                </span>
              </div>
            ))}
          </div>

          {/* Criteria judgment matrix */}
          <JudgmentMatrixInput
            matrix={criteriaMatrix}
            onChange={setCriteriaMatrix}
            labels={CRITERIA_LABELS}
            shortLabels={CRITERIA_SHORT}
          />

          <div className="mt-4 p-3 rounded-lg" style={{ background: '#fefce8' }}>
            <p className="text-sm" style={{ color: '#854d0e' }}>
              <Info size={14} className="inline mr-1" />
              判断矩阵满足: a<sub>ij</sub> &gt; 0, a<sub>ii</sub> = 1, a<sub>ji</sub> = 1/a<sub>ij</sub>
            </p>
          </div>
        </SectionCard>

        {/* Section 4: Weight Calculation */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <Scale size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              层次单排序 — 权重向量计算
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            使用特征向量法(和积法)计算各准则的相对权重
          </p>

          <CalculationSteps title="权重计算过程" steps={weightCalcSteps} />

          <div className="mt-5">
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#2A4A73' }}>
              权重可视化
            </h4>
            {CRITERIA_LABELS.map((label, i) => (
              <WeightBar
                key={i}
                label={label}
                weight={criteriaWeights[i]}
                color={tabColors[i]}
                index={i}
              />
            ))}
          </div>

          {/* Formula */}
          <div className="mt-4">
            <FormulaBlock
              formula="W = \frac{1}{n} \sum_{j=1}^{n} \frac{a_{ij}}{\sum_{k=1}^{n} a_{kj}}"
            />
          </div>
        </SectionCard>

        {/* Section 5: Consistency Check */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              一致性检验
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            验证判断矩阵的逻辑一致性，确保决策者判断不矛盾
          </p>

          <CalculationSteps title="一致性检验计算过程" steps={consistencySteps} />

          {/* Consistency Result Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-5 rounded-lg p-5"
            style={{
              background: !criteriaConsistency.crValid
                ? '#eff6ff'
                : criteriaConsistency.cr < 0.1
                  ? '#E8F5E9'
                  : '#FDE8E8',
              borderLeft: `4px solid ${!criteriaConsistency.crValid ? '#3b82f6' : criteriaConsistency.cr < 0.1 ? '#4CAF50' : '#ef4444'}`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              {!criteriaConsistency.crValid ? (
                <Info size={18} style={{ color: '#3b82f6' }} />
              ) : criteriaConsistency.cr < 0.1 ? (
                <CheckCircle size={18} style={{ color: '#4CAF50' }} />
              ) : (
                <XCircle size={18} style={{ color: '#ef4444' }} />
              )}
              <span
                className="text-sm font-semibold"
                style={{
                  color: !criteriaConsistency.crValid
                    ? '#2563eb'
                    : criteriaConsistency.cr < 0.1
                      ? '#4CAF50'
                      : '#dc2626',
                }}
              >
                一致性检验结果
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <ConsistencyBadge
                label="λ_max"
                value={r3(criteriaConsistency.lambdaMax).toString()}
              />
              <ConsistencyBadge
                label="CI"
                value={r4(criteriaConsistency.ci).toString()}
              />
              <ConsistencyBadge
                label="RI"
                value={String(criteriaConsistency.ri)}
                highlight
              />
              {criteriaConsistency.crValid && (
                <ConsistencyBadge
                  label="CR"
                  value={r4(criteriaConsistency.cr).toString()}
                />
              )}
            </div>
            <div
              className="text-sm font-semibold"
              style={{
                color: !criteriaConsistency.crValid
                  ? '#2563eb'
                  : criteriaConsistency.cr < 0.1
                    ? '#4CAF50'
                    : '#dc2626',
              }}
            >
              {!criteriaConsistency.crValid ? (
                <>
                  n = {criteriaConsistency.n} ≤ 2，此时 RI = 0，CR 无定义。
                  二阶及以下矩阵天然满足一致性，无需检验。
                </>
              ) : (
                <>
                  CR = {r4(criteriaConsistency.cr)} {criteriaConsistency.cr < 0.1 ? '<' : '≥'} 0.10
                  {criteriaConsistency.cr < 0.1
                    ? '，判断矩阵通过一致性检验'
                    : '，判断矩阵未通过一致性检验，请调整判断矩阵'}
                </>
              )}
            </div>
            {!criteriaConsistency.crValid ? (
              <p className="text-xs mt-2" style={{ color: '#6B6B6B' }}>
                当阶数 n ≤ 2 时，RI = 0，一致性比率 CR 无定义。此时判断矩阵恒为一致矩阵。
              </p>
            ) : criteriaConsistency.cr >= 0.1 ? (
              <div className="mt-3 rounded-lg p-3" style={{ background: '#FDE8E8', border: '1px solid #fecaca' }}>
                <p className="text-xs font-medium" style={{ color: '#dc2626' }}>
                  ⚠️ 一致性未通过！建议按以下步骤修改判断矩阵：
                </p>
                <ol className="text-xs mt-1 ml-4" style={{ color: '#b91c1c', listStyleType: 'decimal' }}>
                  <li>找出使一致性最差的因素对（CI最大的元素）</li>
                  <li>重新审视该因素对的相对重要性判断</li>
                  <li>优先调整逻辑矛盾最明显的比值（如 A&gt;B, B&gt;C, 但 A&lt;C）</li>
                  <li>调整后重新计算 CR，直至 CR &lt; 0.10</li>
                </ol>
              </div>
            ) : (
              <p className="text-xs mt-2" style={{ color: '#6B6B6B' }}>
                当 CR &lt; 0.10 时，认为判断矩阵具有满意的一致性；否则需要重新调整判断矩阵。
              </p>
            )}
          </motion.div>

          {/* RI Table */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#2A4A73' }}>
              RI 随机一致性指标参考值
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: '#2A4A73' }}>
                    {['n', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(
                      (h, i) => (
                        <th
                          key={i}
                          className="px-2 py-1.5 text-white text-xs font-medium text-center"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      className="px-2 py-1.5 text-xs font-medium text-center"
                      style={{ background: '#f1f5f9', color: '#2A4A73' }}
                    >
                      RI
                    </td>
                    {[0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49].map(
                      (v, i) => (
                        <td
                          key={i}
                          className="px-2 py-1.5 text-xs text-center"
                          style={{
                            background: i + 1 === 3 ? '#dbeafe' : '#fff',
                            color: '#2A4A73',
                          }}
                        >
                          {v}
                        </td>
                      )
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

        {/* Section 6: Level Ranking */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              层次总排序
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            计算各方案对总目标的综合权重，确定最优方案
          </p>

          {/* Alternative judgment matrices — tabs */}
          <p className="text-sm mb-3" style={{ color: '#6B6B6B' }}>
            分别对每个准则构建方案层的两两比较矩阵:
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {CRITERIA_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => setActiveAltTab(i)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  background: activeAltTab === i ? tabColors[i] : '#fff',
                  color: activeAltTab === i ? '#fff' : tabColors[i],
                  border: `1px solid ${tabColors[i]}`,
                }}
              >
                {CRITERIA_SHORT[i]}: {label.replace(' C', '')}
              </button>
            ))}
          </div>

          <motion.div
            key={activeAltTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <JudgmentMatrixInput
              matrix={altMatrices[activeAltTab]}
              onChange={(m) => updateAltMatrix(activeAltTab, m)}
              labels={ALT_LABELS}
              shortLabels={ALT_SHORT}
            />
          </motion.div>

          {/* Combined weights table */}
          <div className="mt-6 overflow-x-auto">
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#2A4A73' }}>
              层次总排序计算
            </h4>
            <table className="w-full min-w-[480px] border-collapse">
              <thead>
                <tr style={{ background: '#2A4A73' }}>
                  <th className="px-3 py-2.5 text-white text-sm font-medium text-center">方案</th>
                  {CRITERIA_SHORT.map((c, i) => (
                    <th key={i} className="px-3 py-2.5 text-white text-sm font-medium text-center">
                      {c} ({r3(criteriaWeights[i])})
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-white text-sm font-medium text-center">综合权重</th>
                  <th className="px-3 py-2.5 text-white text-sm font-medium text-center">排序</th>
                </tr>
              </thead>
              <tbody>
                {ALT_SHORT.map((alt, ai) => {
                  const rankPos = ranked.findIndex((r) => r.originalIndex === ai) + 1;
                  return (
                    <motion.tr
                      key={ai}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ai * 0.08, duration: 0.3 }}
                      style={{
                        background: ai % 2 === 0 ? '#fff' : '#F8F6F2',
                        borderLeft: rankPos === 1 ? '3px solid #4CAF50' : '3px solid transparent',
                      }}
                    >
                      <td
                        className="px-3 py-2.5 text-sm font-medium text-center"
                        style={{ color: '#1B3A5F' }}
                      >
                        {alt}
                      </td>
                      {CRITERIA_SHORT.map((_, ci) => (
                        <td
                          key={ci}
                          className="px-3 py-2.5 text-sm text-center font-mono"
                          style={{ color: '#6B6B6B' }}
                        >
                          {r3(altWeightsPerCriterion[ci][ai])}
                        </td>
                      ))}
                      <td
                        className="px-3 py-2.5 text-sm text-center font-semibold font-mono"
                        style={{
                          color: rankPos === 1 ? '#4CAF50' : '#1B3A5F',
                          background: rankPos === 1 ? '#E8F5E9' : 'transparent',
                        }}
                      >
                        {r3(globalWeights[ai])}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                          style={{
                            background: rankPos === 1 ? '#4CAF50' : rankPos === 2 ? '#3b82f6' : '#a855f7',
                            color: '#fff',
                          }}
                        >
                          {rankPos}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Global ranking bar chart */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#2A4A73' }}>
              综合权重柱状图
            </h4>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={13}
                    fontWeight={600}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, '综合权重']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E0DDD5' }}
                  />
                  <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={28}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Global ranking calculation steps */}
          <div className="mt-5">
            <CalculationSteps title="层次总排序计算过程" steps={globalCalcSteps} />
          </div>

          {/* Optimal Card */}
          <div className="mt-5">
            <OptimalCard
              title="最优决策方案"
              name={ALT_LABELS[bestAltIndex]}
              value={`W = ${r3(globalWeights[bestAltIndex])}`}
              description={(() => {
                const contributions = criteriaWeights.map((cw, i) => ({
                  name: CRITERIA_LABELS[i],
                  value: cw * altWeightsPerCriterion[i][bestAltIndex],
                }));
                const top = contributions.reduce((a, b) => (a.value > b.value ? a : b));
                return `在层次分析法下，${ALT_LABELS[bestAltIndex]}综合权重为 ${r3(globalWeights[bestAltIndex])}，排序第一。其中${top.name.replace(/ C\d/, '')}贡献最大（${r3(top.value)}），是综合排序的主要决定因素。`;
              })()}
            />
          </div>
        </SectionCard>

        {/* Section 7: Knowledge Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <KnowledgeCard
            title="层次分析法(AHP)"
            sections={knowledgeSections}
            tags={['AHP', '判断矩阵', '特征向量', '一致性检验', '层次排序']}
          />
        </motion.div>
      </div>
    </Layout>
  );
}
