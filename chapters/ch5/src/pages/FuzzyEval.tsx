import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  RotateCcw,
  BookOpen,
  Calculator,
  BarChart3,
  GitBranch,
  Info,
  CheckCircle,
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
import CalculationSteps from '@/components/CalculationSteps';
import KnowledgeCard from '@/components/KnowledgeCard';
import OptimalCard from '@/components/OptimalCard';
import FormulaBlock from '@/components/FormulaBlock';
import { SafeBlockMath as BlockMath, SafeInlineMath as InlineMath } from '@/components/SafeKatex';

/* ------------------------------------------------------------------ */
/*  Constants & Types                                                  */
/* ------------------------------------------------------------------ */

type OperatorType = 'min-max' | 'mul-max' | 'weighted';

interface OperatorInfo {
  key: OperatorType;
  label: string;
  formula: string;
  desc: string;
}

const OPERATORS: OperatorInfo[] = [
  {
    key: 'min-max',
    label: 'M(∧,∨) 取小取大',
    formula: 'b_j = \\bigvee_{i=1}^{n} (a_i \\wedge r_{ij}) = \\max_i \\min(a_i, r_{ij})',
    desc: '先取最小再取最大，信息损失较多',
  },
  {
    key: 'mul-max',
    label: 'M(·,∨) 乘取大',
    formula: 'b_j = \\bigvee_{i=1}^{n} (a_i \\cdot r_{ij}) = \\max_i (a_i \\cdot r_{ij})',
    desc: '先乘积再取最大，考虑了权重大小',
  },
  {
    key: 'weighted',
    label: 'M(·,+) 加权平均',
    formula: 'b_j = \\sum_{i=1}^{n} (a_i \\cdot r_{ij})',
    desc: '加权求和，保留信息最多，最常用',
  },
];

const DEFAULT_FACTORS = ['教学质量', '科研水平', '师资力量', '学生满意度'];
const DEFAULT_WEIGHTS = [0.3, 0.3, 0.2, 0.2];
const DEFAULT_GRADES = ['优秀', '良好', '一般', '较差'];

// Default fuzzy relation matrix R (n factors × m grades)
const DEFAULT_R: number[][] = [
  [0.4, 0.3, 0.2, 0.1],
  [0.3, 0.4, 0.2, 0.1],
  [0.2, 0.3, 0.3, 0.2],
  [0.5, 0.3, 0.15, 0.05],
];

/* ------------------------------------------------------------------ */
/*  Helper functions                                                   */
/* ------------------------------------------------------------------ */

const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** Normalize weights to sum=1 */
function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 1 / weights.length);
  return weights.map((w) => w / sum);
}

/** Compute fuzzy comprehensive evaluation B = A ∘ R */
function computeB(weights: number[], R: number[][], operator: OperatorType): number[] {
  const n = weights.length;
  const m = R[0]?.length ?? 0;
  const B: number[] = Array(m).fill(0);

  for (let j = 0; j < m; j++) {
    if (operator === 'min-max') {
      // M(∧,∨): b_j = max_i(min(a_i, r_ij))
      let maxVal = 0;
      for (let i = 0; i < n; i++) {
        maxVal = Math.max(maxVal, Math.min(weights[i], R[i][j]));
      }
      B[j] = maxVal;
    } else if (operator === 'mul-max') {
      // M(·,∨): b_j = max_i(a_i * r_ij)
      let maxVal = 0;
      for (let i = 0; i < n; i++) {
        maxVal = Math.max(maxVal, weights[i] * R[i][j]);
      }
      B[j] = maxVal;
    } else {
      // weighted: b_j = sum_i(a_i * r_ij)
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += weights[i] * R[i][j];
      }
      B[j] = sum;
    }
  }
  return B;
}

/** Normalize a row so values sum to 1 */
function normalizeRow(row: number[]): number[] {
  const sum = row.reduce((a, b) => a + b, 0);
  if (sum === 0) return row.map(() => 1 / row.length);
  return row.map((v) => v / sum);
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

/** SVG Triangular membership function */
function TriangularSVG() {
  const w = 320;
  const h = 140;
  const pad = 20;
  const gw = w - pad * 2;
  const gh = h - pad * 2;

  const a = 40, b = 100, c = 160;
  const scaleX = gw / 200;
  const scaleY = gh;

  const points = [];
  for (let x = 0; x <= 200; x += 2) {
    let y = 0;
    if (x <= a) y = 0;
    else if (x <= b) y = (x - a) / (b - a);
    else if (x <= c) y = (c - x) / (c - b);
    else y = 0;
    points.push(`${pad + x * scaleX},${pad + gh - y * scaleY}`);
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: 320, height: 140 }}>
      {/* Axes */}
      <line x1={pad} y1={pad + gh} x2={pad + gw} y2={pad + gh} stroke="#9E9E9E" strokeWidth={1} />
      <line x1={pad} y1={pad} x2={pad} y2={pad + gh} stroke="#9E9E9E" strokeWidth={1} />
      {/* Function */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2.5}
      />
      {/* Key points */}
      <circle cx={pad + a * scaleX} cy={pad + gh} r={4} fill="#3b82f6" />
      <circle cx={pad + b * scaleX} cy={pad} r={4} fill="#4CAF50" />
      <circle cx={pad + c * scaleX} cy={pad + gh} r={4} fill="#3b82f6" />
      {/* Labels */}
      <text x={pad + a * scaleX} y={pad + gh + 14} textAnchor="middle" fontSize={11} fill="#6B6B6B">a</text>
      <text x={pad + b * scaleX} y={pad - 6} textAnchor="middle" fontSize={11} fill="#4CAF50" fontWeight={600}>b=1</text>
      <text x={pad + c * scaleX} y={pad + gh + 14} textAnchor="middle" fontSize={11} fill="#6B6B6B">c</text>
      <text x={pad + gw / 2} y={h - 2} textAnchor="middle" fontSize={12} fill="#2A4A73" fontWeight={600}>三角形</text>
    </svg>
  );
}

/** SVG Trapezoidal membership function */
function TrapezoidalSVG() {
  const w = 320;
  const h = 140;
  const pad = 20;
  const gw = w - pad * 2;
  const gh = h - pad * 2;

  const a = 30, b = 80, c = 120, d = 180;
  const scaleX = gw / 200;
  const scaleY = gh;

  const points = [];
  for (let x = 0; x <= 200; x += 2) {
    let y = 0;
    if (x <= a) y = 0;
    else if (x <= b) y = (x - a) / (b - a);
    else if (x <= c) y = 1;
    else if (x <= d) y = (d - x) / (d - c);
    else y = 0;
    points.push(`${pad + x * scaleX},${pad + gh - y * scaleY}`);
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: 320, height: 140 }}>
      <line x1={pad} y1={pad + gh} x2={pad + gw} y2={pad + gh} stroke="#9E9E9E" strokeWidth={1} />
      <line x1={pad} y1={pad} x2={pad} y2={pad + gh} stroke="#9E9E9E" strokeWidth={1} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#C8963E"
        strokeWidth={2.5}
      />
      <circle cx={pad + a * scaleX} cy={pad + gh} r={4} fill="#C8963E" />
      <circle cx={pad + b * scaleX} cy={pad} r={4} fill="#4CAF50" />
      <circle cx={pad + c * scaleX} cy={pad} r={4} fill="#4CAF50" />
      <circle cx={pad + d * scaleX} cy={pad + gh} r={4} fill="#C8963E" />
      <text x={pad + a * scaleX} y={pad + gh + 14} textAnchor="middle" fontSize={11} fill="#6B6B6B">a</text>
      <text x={pad + b * scaleX} y={pad - 6} textAnchor="middle" fontSize={11} fill="#4CAF50" fontWeight={600}>b</text>
      <text x={pad + c * scaleX} y={pad - 6} textAnchor="middle" fontSize={11} fill="#4CAF50" fontWeight={600}>c</text>
      <text x={pad + d * scaleX} y={pad + gh + 14} textAnchor="middle" fontSize={11} fill="#6B6B6B">d</text>
      <text x={pad + gw / 2} y={h - 2} textAnchor="middle" fontSize={12} fill="#2A4A73" fontWeight={600}>梯形</text>
    </svg>
  );
}

/** SVG Gaussian membership function */
function GaussianSVG() {
  const w = 320;
  const h = 140;
  const pad = 20;
  const gw = w - pad * 2;
  const gh = h - pad * 2;

  const mu = 100;
  const sigma = 35;
  const scaleX = gw / 200;
  const scaleY = gh;

  const points = [];
  for (let x = 0; x <= 200; x += 2) {
    const y = Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    points.push(`${pad + x * scaleX},${pad + gh - y * scaleY}`);
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: 320, height: 140 }}>
      <line x1={pad} y1={pad + gh} x2={pad + gw} y2={pad + gh} stroke="#9E9E9E" strokeWidth={1} />
      <line x1={pad} y1={pad} x2={pad} y2={pad + gh} stroke="#9E9E9E" strokeWidth={1} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#a855f7"
        strokeWidth={2.5}
      />
      {/* Center line */}
      <line
        x1={pad + mu * scaleX}
        y1={pad}
        x2={pad + mu * scaleX}
        y2={pad + gh}
        stroke="#a855f7"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.5}
      />
      <circle cx={pad + mu * scaleX} cy={pad} r={4} fill="#4CAF50" />
      <text x={pad + mu * scaleX} y={pad - 6} textAnchor="middle" fontSize={11} fill="#4CAF50" fontWeight={600}>μ</text>
      <text x={pad + gw / 2} y={h - 2} textAnchor="middle" fontSize={12} fill="#2A4A73" fontWeight={600}>高斯型</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function FuzzyEvalPage() {
  /* State */
  const [factors, setFactors] = useState<string[]>([...DEFAULT_FACTORS]);
  const [weights, setWeights] = useState<number[]>([...DEFAULT_WEIGHTS]);
  const [grades, setGrades] = useState<string[]>([...DEFAULT_GRADES]);
  const [R, setR] = useState<number[][]>(DEFAULT_R.map((r) => [...r]));
  const [operator, setOperator] = useState<OperatorType>('weighted');

  /* Computed: normalized weights */
  const normalizedWeights = useMemo(() => normalizeWeights(weights), [weights]);

  /* Computed: B = A ∘ R */
  const B = useMemo(
    () => computeB(normalizedWeights, R, operator),
    [normalizedWeights, R, operator]
  );

  /* Computed: max membership grade */
  const maxBIndex = useMemo(() => {
    let maxIdx = 0;
    for (let i = 1; i < B.length; i++) {
      if (B[i] > B[maxIdx]) maxIdx = i;
    }
    return maxIdx;
  }, [B]);

  /* Computed: weighted average grade score */
  const weightedScore = useMemo(() => {
    // Score each grade by index (0=best to m-1=worst), then weighted average
    let score = 0;
    const totalB = B.reduce((a, b) => a + b, 0);
    if (totalB === 0) return 0;
    for (let j = 0; j < B.length; j++) {
      score += j * B[j];
    }
    return score / totalB;
  }, [B]);

  /* Chart data */
  const chartData = useMemo(
    () =>
      grades.map((g, i) => ({
        name: g,
        value: r3(B[i]),
        fill: i === maxBIndex ? '#4CAF50' : '#3b82f6',
      })),
    [grades, B, maxBIndex]
  );

  /* Handlers */
  const handleFactorChange = useCallback((index: number, value: string) => {
    setFactors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleWeightChange = useCallback((index: number, value: string) => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return;
    setWeights((prev) => {
      const next = [...prev];
      next[index] = Math.max(0, num);
      return next;
    });
  }, []);

  const handleGradeChange = useCallback((index: number, value: string) => {
    setGrades((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleRChange = useCallback((i: number, j: number, value: string) => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return;
    setR((prev) => {
      const next = prev.map((row) => [...row]);
      next[i][j] = Math.max(0, Math.min(1, num));
      return next;
    });
  }, []);

  const normalizeRowHandler = useCallback((i: number) => {
    setR((prev) => {
      const next = prev.map((row) => [...row]);
      next[i] = normalizeRow(next[i]);
      return next;
    });
  }, []);

  const handleReset = () => {
    setFactors([...DEFAULT_FACTORS]);
    setWeights([...DEFAULT_WEIGHTS]);
    setGrades([...DEFAULT_GRADES]);
    setR(DEFAULT_R.map((r) => [...r]));
    setOperator('weighted');
  };

  

  /* Calculation steps */
  const calcSteps = useMemo(() => {
    const op = OPERATORS.find((o) => o.key === operator)!;
    const bStr = B.map((v) => r3(v)).join(', ');
    const wStr = normalizedWeights.map((v) => r3(v)).join(', ');

    const detailLines = B.map((bj, j) => {
      if (operator === 'weighted') {
        const terms = normalizedWeights.map((wi, i) => `${r3(wi)}·${r3(R[i][j])}`);
        return `b_${j + 1} = ${terms.join(' + ')} = ${r3(bj)}`;
      } else if (operator === 'min-max') {
        const terms = normalizedWeights.map((wi, i) => `min(${r3(wi)}, ${r3(R[i][j])})`);
        return `b_${j + 1} = max(${terms.join(', ')}) = ${r3(bj)}`;
      } else {
        const terms = normalizedWeights.map((wi, i) => `${r3(wi)}·${r3(R[i][j])}`);
        return `b_${j + 1} = max(${terms.join(', ')}) = ${r3(bj)}`;
      }
    });

    return [
      {
        title: `Step 1: 确定权重向量 A = (${wStr})`,
        formula: `权重和 = ${r3(normalizedWeights.reduce((a, b) => a + b, 0))} (已归一化)`,
        highlight: true,
      },
      {
        title: `Step 2: 使用算子 ${op.label} 计算 B = A ∘ R`,
        formula: `${detailLines.join('\n')}`,
        highlight: true,
      },
      {
        title: 'Step 3: 综合评判结果',
        formula: `B = (${bStr})`,
        result: `最大隶属度: ${grades[maxBIndex]} (b_${maxBIndex + 1} = ${r3(B[maxBIndex])})`,
        highlight: true,
        optimal: true,
      },
    ];
  }, [operator, B, normalizedWeights, R, grades, maxBIndex]);

  /* Knowledge sections */
  const knowledgeSections = [
    {
      subtitle: '适用条件',
      content: [
        '评价因素具有模糊性，难以精确量化',
        '评价边界不清晰，适合用隶属度描述',
        '多因素、多层次复杂评价问题',
        '需要综合考虑多种不确定性',
      ],
    },
    {
      subtitle: '关键公式',
      content: [
        'B = A ∘ R，其中 A = (a₁, a₂, ..., aₙ) 为权重向量',
        'R 为 n×m 模糊关系矩阵，r_ij 表示因素 i 对评语 j 的隶属度',
        'M(·,+): b_j = Σ(aᵢ · rᵢⱼ) — 保留信息最多，最常用',
        'M(∧,∨): b_j = ∨(aᵢ ∧ rᵢⱼ) — 取小取大，信息损失较多',
        'M(·,∨): b_j = ∨(aᵢ · rᵢⱼ) — 乘取大，折中方案',
      ],
    },
    {
      subtitle: '算子选择',
      content: [
        'M(·,+) 加权平均：保留信息最多，最常用，适合一般评价场景',
        'M(∧,∨) 取小取大：强调主要因素，信息损失大',
        'M(·,∨) 乘取大：兼顾权重和隶属度，折中选择',
        '实际应用中优先选择 M(·,+)',
      ],
    },
    {
      subtitle: '注意事项',
      content: [
        '权重向量 A 必须归一化（和为 1）',
        '模糊矩阵 R 的行和不一定为 1',
        '每个 r_ij 的取值范围必须在 [0, 1] 之间',
        '隶属度函数的选取应结合实际问题',
        '评价结果可采用最大隶属度原则或加权平均原则',
      ],
    },
  ];

  /* Four steps for theory */
  const fourSteps = [
    { num: '①', text: '建立因素集 U = {u₁, u₂, ..., uₙ}' },
    { num: '②', text: '建立评语集 V = {v₁, v₂, ..., vₘ}' },
    { num: '③', text: '建立模糊关系矩阵 R（隶属度 r_ij）' },
    { num: '④', text: '模糊综合评价 B = A ∘ R' },
  ];

  return (
    <Layout>
      <div className="">
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
                5.5
              </span>
              <span className="text-xs font-medium" style={{ color: '#9E9E9E' }}>
                多目标决策分析
              </span>
            </div>
            <h1 className="text-[28px] font-bold leading-tight" style={{ color: '#1B3A5F' }}>
              模糊综合评价
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
              Fuzzy Comprehensive Evaluation — 运用模糊数学对受多因素影响的对象进行综合评价
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['模糊数学', '隶属度', '综合评价', '模糊矩阵'].map((tag) => (
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

        {/* Section 1: Theory Overview */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              模糊综合评价基本原理
            </h2>
          </div>
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
            模糊综合评价(Fuzzy Comprehensive Evaluation)是一种基于模糊数学的综合评价方法。
            它根据模糊数学的隶属度理论，把定性评价转化为定量评价，即用模糊数学对受到多种因素制约的事物或对象做出一个总体的评价。
            其基本模型为：<strong>B = A ∘ R</strong>，其中 A 为权重向量，R 为模糊关系矩阵，∘ 为模糊算子。
          </p>
          <div className="formula-block">
            <BlockMath math="B = A \circ R" />
            <p className="text-sm mt-2" style={{ color: '#6B6B6B' }}>
              其中{' '}
              <InlineMath math="A = (a_1, a_2, \ldots, a_n)" />，
              <InlineMath math="R = (r_{ij})_{n \times m}" />
            </p>
          </div>
        </SectionCard>

        {/* Section 2: Four Steps */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              四个基本步骤
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {fourSteps.map((s, i) => (
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

        {/* Section 3: Operator Types */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              算子类型
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            模糊综合评价中，合成算子 ∘ 的选取直接影响评价结果。常用的三种算子如下：
          </p>
          <div className="flex flex-col gap-4">
            {OPERATORS.map((op) => (
              <motion.div
                key={op.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg p-4"
                style={{
                  background: operator === op.key ? '#eff6ff' : '#F8F6F2',
                  border: operator === op.key ? '2px solid #3b82f6' : '1px solid #E0DDD5',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: '#2A4A73' }}>
                    {op.label}
                  </span>
                  {operator === op.key && (
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-medium"
                      style={{ background: '#dbeafe', color: '#2563eb' }}
                    >
                      当前选择
                    </span>
                  )}
                </div>
                <FormulaBlock formula={op.formula} />
                <p className="text-xs mt-2" style={{ color: '#6B6B6B' }}>
                  {op.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* Section 4: Membership Functions SVG */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              常见隶属度函数
            </h2>
          </div>
          <p className="text-sm mb-5" style={{ color: '#6B6B6B' }}>
            隶属度函数是模糊综合评价的核心，用于将模糊概念量化为 [0,1] 之间的数值。以下为三种典型隶属度函数：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <TriangularSVG />
              <p className="text-xs mt-2 text-center" style={{ color: '#6B6B6B' }}>
                由三个参数 (a, b, c) 定义，在 b 点达到峰值 1
              </p>
            </div>
            <div className="flex flex-col items-center">
              <TrapezoidalSVG />
              <p className="text-xs mt-2 text-center" style={{ color: '#6B6B6B' }}>
                由四个参数 (a, b, c, d) 定义，在 [b, c] 区间保持 1
              </p>
            </div>
            <div className="flex flex-col items-center">
              <GaussianSVG />
              <p className="text-xs mt-2 text-center" style={{ color: '#6B6B6B' }}>
                高斯函数，由中心值 μ 和宽度 σ 决定形状
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Section 5: Interactive Factor Set Builder */}
        <SectionCard>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <GitBranch size={18} style={{ color: '#3b82f6' }} />
              <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
                因素集 U 构建
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
            定义评价因素集合 U，默认包含四个评价维度
          </p>
          <div className="flex flex-col gap-2">
            {factors.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white flex-shrink-0"
                  style={{ background: '#1B3A5F' }}
                >
                  u{i + 1}
                </span>
                <input
                  type="text"
                  value={f}
                  onChange={(e) => handleFactorChange(i, e.target.value)}
                  className="flex-1 max-w-xs h-9 px-3 text-sm border rounded-md outline-none transition-all duration-200"
                  style={{ borderColor: '#E0DDD5', color: '#2A4A73' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,58,95,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0DDD5';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* Section 6: Weight Vector Editor */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              权重向量 A 编辑
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            编辑各因素权重，系统将自动归一化使其和为 1
          </p>
          <div className="flex flex-col gap-3">
            {factors.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3"
              >
                <span className="text-sm font-medium w-28 text-right" style={{ color: '#2A4A73' }}>
                  {f}
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={weights[i]}
                  onChange={(e) => handleWeightChange(i, e.target.value)}
                  className="w-24 h-9 px-3 text-sm text-center border rounded-md outline-none transition-all duration-200 font-mono"
                  style={{ borderColor: '#E0DDD5', color: '#2A4A73' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,58,95,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0DDD5';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: '#f1f5f9' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${normalizedWeights[i] * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-md flex items-center justify-end pr-2"
                    style={{
                      background: ['#3b82f6', '#4CAF50', '#C8963E', '#a855f7'][i % 4],
                    }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {(normalizedWeights[i] * 100).toFixed(1)}%
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: '#fefce8' }}>
            <Info size={14} style={{ color: '#854d0e', flexShrink: 0 }} />
            <span className="text-xs" style={{ color: '#854d0e' }}>
              归一化后权重和 = {r3(normalizedWeights.reduce((a, b) => a + b, 0))}
            </span>
          </div>
        </SectionCard>

        {/* Section 7: Evaluation Grade Set */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              评语集 V 编辑
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            定义评价等级集合 V（如：优秀、良好、一般、较差）
          </p>
          <div className="flex flex-wrap gap-3">
            {grades.map((g, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2"
              >
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white flex-shrink-0"
                  style={{ background: '#C8963E' }}
                >
                  v{i + 1}
                </span>
                <input
                  type="text"
                  value={g}
                  onChange={(e) => handleGradeChange(i, e.target.value)}
                  className="w-24 h-9 px-3 text-sm text-center border rounded-md outline-none transition-all duration-200"
                  style={{ borderColor: '#E0DDD5', color: '#2A4A73' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,58,95,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E0DDD5';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* Section 8: Fuzzy Relation Matrix R */}
        <SectionCard>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} style={{ color: '#3b82f6' }} />
              <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
                模糊关系矩阵 R
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
            R 为 n×m 矩阵，r_ij 表示因素 u_i 对评语 v_j 的隶属度（0~1）
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] border-collapse">
              <thead>
                <tr style={{ background: '#2A4A73' }}>
                  <th className="px-3 py-2.5 text-white text-sm font-medium text-center" style={{ minWidth: 100 }}>
                    因素 \\ 评语
                  </th>
                  {grades.map((g, j) => (
                    <th
                      key={j}
                      className="px-3 py-2.5 text-white text-sm font-medium text-center"
                      style={{ minWidth: 80 }}
                    >
                      {g}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-white text-sm font-medium text-center" style={{ minWidth: 100 }}>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {factors.map((f, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ background: i % 2 === 0 ? '#fff' : '#F8F6F2' }}
                  >
                    <td
                      className="px-3 py-2 text-sm font-medium text-center"
                      style={{ color: '#1B3A5F', background: '#f1f5f9' }}
                    >
                      {f}
                    </td>
                    {grades.map((_, j) => (
                      <td key={j} className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={r3(R[i][j])}
                          onChange={(e) => handleRChange(i, j, e.target.value)}
                          className="w-16 h-8 px-1 text-sm text-center border rounded-md outline-none transition-all duration-200 font-mono"
                          style={{ borderColor: '#E0DDD5', color: '#2A4A73' }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,58,95,0.15)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#E0DDD5';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => normalizeRowHandler(i)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer"
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #dbeafe',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dbeafe';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#eff6ff';
                        }}
                      >
                        行归一化
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Section 9: Operator Selector + Real-time Calculation */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              算子选择与实时计算
            </h2>
          </div>

          {/* Operator radio buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <span className="text-sm font-medium" style={{ color: '#2A4A73' }}>
              选择合成算子：
            </span>
            <div className="flex flex-wrap gap-3">
              {OPERATORS.map((op) => (
                <label
                  key={op.key}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200"
                  style={{
                    background: operator === op.key ? '#eff6ff' : '#fff',
                    border: operator === op.key ? '2px solid #3b82f6' : '1px solid #E0DDD5',
                    color: operator === op.key ? '#2563eb' : '#6B6B6B',
                  }}
                >
                  <input
                    type="radio"
                    name="operator"
                    value={op.key}
                    checked={operator === op.key}
                    onChange={() => setOperator(op.key)}
                    className="cursor-pointer"
                  />
                  {op.label}
                </label>
              ))}
            </div>
          </div>

          {/* Current operator formula */}
          <div className="mb-6">
            <FormulaBlock formula={OPERATORS.find((o) => o.key === operator)!.formula} />
          </div>

          {/* Calculation steps */}
          <CalculationSteps title="综合评价计算过程" steps={calcSteps} />

          {/* Result bar chart */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#2A4A73' }}>
              综合评价结果 B 的分布
            </h4>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ left: 20, right: 30, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
                  <XAxis dataKey="name" fontSize={13} fontWeight={600} />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number) => [r3(value), '隶属度']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E0DDD5' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Result table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: '#2A4A73' }}>
                  {grades.map((g, j) => (
                    <th key={j} className="px-3 py-2.5 text-white text-sm font-medium text-center">
                      {g}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {B.map((bj, j) => (
                    <td
                      key={j}
                      className="px-3 py-2.5 text-sm text-center font-mono font-semibold"
                      style={{
                        background: j === maxBIndex ? '#E8F5E9' : '#fff',
                        color: j === maxBIndex ? '#4CAF50' : '#2A4A73',
                      }}
                    >
                      {r3(bj)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Section 10: Final Grade Determination */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              最终等级评定
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Max membership principle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg p-4"
              style={{ background: '#E8F5E9', borderLeft: '4px solid #4CAF50' }}
            >
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#4CAF50' }}>
                最大隶属度原则
              </h4>
              <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>
                Grade = argmaxⱼ(bⱼ)
              </p>
              <div className="text-lg font-bold" style={{ color: '#1B3A5F' }}>
                {grades[maxBIndex]}
              </div>
              <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>
                b_{maxBIndex + 1} = {r3(B[maxBIndex])} 为最大值
              </p>
            </motion.div>

            {/* Weighted average principle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-lg p-4"
              style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6' }}
            >
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#2563eb' }}>
                加权平均原则
              </h4>
              <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>
                Score = Σ(j · bⱼ) / Σbⱼ
              </p>
              <div className="text-lg font-bold" style={{ color: '#1B3A5F' }}>
                {r3(weightedScore)}
              </div>
              <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>
                对应等级偏向：{weightedScore < maxBIndex + 0.5 ? grades[Math.floor(weightedScore)] || grades[0] : grades[Math.ceil(weightedScore)] || grades[grades.length - 1]}
              </p>
            </motion.div>
          </div>

          {/* Optimal Card */}
          <OptimalCard
            title="综合评价结果"
            name={grades[maxBIndex]}
            value={`B = (${B.map((v) => r3(v)).join(', ')})`}
            description={`根据最大隶属度原则，该评价对象的综合评定等级为「${grades[maxBIndex]}」，其隶属度为 ${r3(B[maxBIndex])}，在所有评语等级中最高。使用${OPERATORS.find((o) => o.key === operator)?.label}算子进行计算。`}
          />
        </SectionCard>

        {/* Section 11: Knowledge Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <KnowledgeCard
            title="模糊综合评价"
            sections={knowledgeSections}
            tags={['模糊综合评价', '隶属度', '模糊矩阵', 'M(·,+)', '最大隶属度原则']}
          />
        </motion.div>
      </div>
    </Layout>
  );
}
