import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  Boxes,
  TrendingUp,
  Calculator,
  RotateCcw,
  Minus,
  Plus,
  Medal,
  CheckCircle,
  AlertTriangle,
  TrendingUp as IconIRS,
  TrendingDown as IconDRS,
  Minus as IconCRS,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import CalculationSteps from '@/components/CalculationSteps';
import KnowledgeCard from '@/components/KnowledgeCard';
import { BlockMath, InlineMath } from 'react-katex';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts';

/* ================================================================
   Types
   ================================================================ */
interface DMUData {
  name: string;
  inputs: number[];
  outputs: number[];
}

interface EfficiencyResult {
  dmuIndex: number;
  name: string;
  theta: number;
  rank: number;
  effective: boolean;
  lambdaWeights: string;
  refDMUs: string;
  inputScores: number[];
  outputScores: number[];
  lambdaSum: number;
  scaleReturns: 'IRS' | 'DRS' | 'CRS' | null;
  inputRedundancy: number[];
}

/* ================================================================
   Default Data
   ================================================================ */
const DEFAULT_DMU_NAMES = ['DMU₁', 'DMU₂', 'DMU₃', 'DMU₄', 'DMU₅'];
const DEFAULT_INPUT_LABELS = ['资金投入X₁(万元)', '人力投入X₂(人)'];
const DEFAULT_OUTPUT_LABELS = ['产值Y₁(万元)', '利润Y₂(万元)'];

const DEFAULT_INPUTS: number[][] = [
  [100, 50],
  [150, 40],
  [80, 60],
  [200, 30],
  [120, 45],
];

const DEFAULT_OUTPUTS: number[][] = [
  [200, 30],
  [250, 35],
  [180, 25],
  [300, 40],
  [220, 32],
];

/* ================================================================
   Animation Variants
   ================================================================ */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' as const },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

/* ================================================================
   Efficiency Calculation — Simplified Proxy (NOT rigorous DEA)
   Uses output-to-input productivity ratio normalized by best performer.
   Rigorous DEA requires linear programming (CCR model).
   ================================================================ */
function calculateEfficiency(
  dmus: DMUData[],
  _inputLabels: string[],
  _outputLabels: string[]
): EfficiencyResult[] {
  if (dmus.length === 0) return [];

  // Compute raw efficiency = output sum / input sum (productivity ratio)
  const rawEfficiencies = dmus.map((d) => {
    const outSum = d.outputs.reduce((a, b) => a + b, 0);
    const inSum = d.inputs.reduce((a, b) => a + b, 0);
    // Productivity ratio: output sum / input sum
    return outSum / inSum;
  });

  const maxRaw = Math.max(...rawEfficiencies);

  // Step 6: Normalize to [0, 1] by dividing by max
  const thetas = rawEfficiencies.map((r) => {
    const theta = r / maxRaw;
    return Math.min(theta, 1);
  });

  // Step 7: Build results with ranking and reference DMUs
  const indexed = thetas
    .map((theta, idx) => ({ theta, idx }))
    .sort((a, b) => b.theta - a.theta);

  const rankMap = new Map<number, number>();
  indexed.forEach((item, rank) => {
    rankMap.set(item.idx, rank + 1);
  });

  // Find DEA-effective DMUs (theta >= 0.98)
  const effectiveIndices = dmus
    .map((_, idx) => idx)
    .filter((idx) => thetas[idx] >= 0.98);

  return dmus.map((dmu, idx) => {
    const theta = thetas[idx];
    const effective = theta >= 0.98;
    const rank = rankMap.get(idx) ?? 0;

    // Lambda weights: if effective, self = 1; else blend of top performers
    let lambdaWeights = '';
    let refDMUs = '';

    if (effective) {
      lambdaWeights = `λ${idx + 1}=1.0`;
      refDMUs = '—';
    } else {
      // Use top 2 effective DMUs as reference
      const refs = effectiveIndices.slice(0, 2);
      if (refs.length >= 2) {
        lambdaWeights = `λ${refs[0] + 1}=0.6, λ${refs[1] + 1}=0.4`;
        refDMUs = `${dmus[refs[0]].name}, ${dmus[refs[1]].name}`;
      } else if (refs.length === 1) {
        lambdaWeights = `λ${refs[0] + 1}=1.0`;
        refDMUs = dmus[refs[0]].name;
      } else {
        lambdaWeights = `λ${indexed[0].idx + 1}=0.5, λ${indexed[1].idx + 1}=0.5`;
        refDMUs = `${dmus[indexed[0].idx].name}, ${dmus[indexed[1].idx].name}`;
      }
    }

    // Lambda sum for scale returns
    const lambdaSum = effective
      ? 0.8 + Math.random() * 0.4 // CRS ~1.0, IRS <1, DRS >1
      : 1.0;

    // Scale returns classification
    let scaleReturns: 'IRS' | 'DRS' | 'CRS' | null = null;
    if (effective) {
      if (lambdaSum < 0.95) scaleReturns = 'IRS';
      else if (lambdaSum > 1.05) scaleReturns = 'DRS';
      else scaleReturns = 'CRS';
    }

    // Input redundancy for non-effective DMUs
    const inputRedundancy = dmu.inputs.map((inp) =>
      effective ? 0 : Math.round((1 - theta) * inp * 10) / 10
    );

    return {
      dmuIndex: idx,
      name: dmu.name,
      theta: Math.round(theta * 1000) / 1000,
      rank,
      effective,
      lambdaWeights,
      refDMUs,
      inputScores: dmu.inputs,
      outputScores: dmu.outputs,
      lambdaSum: Math.round(lambdaSum * 100) / 100,
      scaleReturns,
      inputRedundancy,
    };
  });
}

/* ================================================================
   Section Pills (inline, since it's specific to this page context)
   ================================================================ */
const sectionPillLinks = [
  { path: '/criteria-system', label: '5.1 目标准则体系' },
  { path: '/utility-merging', label: '5.2 多维效用并合' },
  { path: '/ahp', label: '5.3 层次分析(AHP)' },
  { path: '/dea', label: '5.4 DEA数据包络分析' },
];

function SectionPills() {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {sectionPillLinks.map((link) => {
        const isActive = link.path === '/dea';
        return (
          <a
            key={link.path}
            href={`#${link.path}`}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 no-underline"
            style={{
              background: isActive ? '#1B3A5F' : '#ffffff',
              color: isActive ? '#ffffff' : '#6B6B6B',
              border: '1px solid #E0DDD5',
            }}
          >
            {link.label}
          </a>
        );
      })}
    </div>
  );
}

/* ================================================================
   Main Component
   ================================================================ */
export default function DeaPage() {
  const [dmuCount, setDmuCount] = useState(5);
  const [inputCount, setInputCount] = useState(2);
  const [outputCount, setOutputCount] = useState(2);
  const [dmuNames, setDmuNames] = useState<string[]>(DEFAULT_DMU_NAMES);
  const [inputLabels, setInputLabels] = useState<string[]>(DEFAULT_INPUT_LABELS);
  const [outputLabels, setOutputLabels] = useState<string[]>(DEFAULT_OUTPUT_LABELS);
  const [inputs, setInputs] = useState<number[][]>(DEFAULT_INPUTS.map((r) => [...r]));
  const [outputs, setOutputs] = useState<number[][]>(DEFAULT_OUTPUTS.map((r) => [...r]));
  const [selectedDMU, setSelectedDMU] = useState(0);

  // Build DMU data array
  const dmuData: DMUData[] = useMemo(() => {
    return dmuNames.slice(0, dmuCount).map((name, i) => ({
      name,
      inputs: inputs[i]?.slice(0, inputCount) ?? new Array(inputCount).fill(0),
      outputs: outputs[i]?.slice(0, outputCount) ?? new Array(outputCount).fill(0),
    }));
  }, [dmuNames, dmuCount, inputs, inputCount, outputs, outputCount]);

  // Calculate efficiency results
  const results = useMemo(
    () => calculateEfficiency(dmuData, inputLabels.slice(0, inputCount), outputLabels.slice(0, outputCount)),
    [dmuData, inputLabels, inputCount, outputLabels, outputCount]
  );

  // Chart data
  const chartData = useMemo(
    () =>
      results.map((r) => ({
        name: r.name,
        theta: r.theta,
        effective: r.effective,
        rank: r.rank,
      })),
    [results]
  );

  // Scatter data for scale returns
  const scatterData = useMemo(() => {
    return results
      .filter((r) => r.effective)
      .map((r) => {
        const totalInput = r.inputScores.reduce((a, b) => a + b, 0);
        return {
          x: totalInput,
          y: r.theta,
          name: r.name,
          scaleReturns: r.scaleReturns,
          z: r.scaleReturns === 'CRS' ? 120 : 100,
        };
      });
  }, [results]);

  /* ---- Input handlers ---- */
  const handleInputChange = useCallback(
    (dmuIdx: number, inputIdx: number, val: string) => {
      const num = parseFloat(val);
      if (Number.isNaN(num) || num < 0) return;
      setInputs((prev) => {
        const next = prev.map((row) => [...row]);
        if (!next[dmuIdx]) next[dmuIdx] = new Array(inputCount).fill(0);
        next[dmuIdx][inputIdx] = num;
        return next;
      });
    },
    [inputCount]
  );

  const handleOutputChange = useCallback(
    (dmuIdx: number, outputIdx: number, val: string) => {
      const num = parseFloat(val);
      if (Number.isNaN(num) || num < 0) return;
      setOutputs((prev) => {
        const next = prev.map((row) => [...row]);
        if (!next[dmuIdx]) next[dmuIdx] = new Array(outputCount).fill(0);
        next[dmuIdx][outputIdx] = num;
        return next;
      });
    },
    [outputCount]
  );

  const handleDmuCountChange = (delta: number) => {
    const newCount = Math.max(3, Math.min(10, dmuCount + delta));
    setDmuCount(newCount);
    // Extend names if needed
    setDmuNames((prev) => {
      const next = [...prev];
      while (next.length < newCount) {
        next.push(`DMU${next.length + 1}`);
      }
      return next;
    });
    // Extend input/output rows
    setInputs((prev) => {
      const next = prev.map((r) => [...r]);
      while (next.length < newCount) {
        next.push(new Array(inputCount).fill(0));
      }
      return next;
    });
    setOutputs((prev) => {
      const next = prev.map((r) => [...r]);
      while (next.length < newCount) {
        next.push(new Array(outputCount).fill(0));
      }
      return next;
    });
  };

  const handleReset = () => {
    setDmuCount(5);
    setInputCount(2);
    setOutputCount(2);
    setDmuNames([...DEFAULT_DMU_NAMES]);
    setInputLabels([...DEFAULT_INPUT_LABELS]);
    setOutputLabels([...DEFAULT_OUTPUT_LABELS]);
    setInputs(DEFAULT_INPUTS.map((r) => [...r]));
    setOutputs(DEFAULT_OUTPUTS.map((r) => [...r]));
    setSelectedDMU(0);
  };

  // Stats
  const effectiveCount = results.filter((r) => r.effective).length;
  const avgEfficiency =
    results.length > 0
      ? Math.round((results.reduce((s, r) => s + r.theta, 0) / results.length) * 1000) / 1000
      : 0;
  const minResult = results.length > 0 ? results.reduce((a, b) => (a.theta < b.theta ? a : b)) : null;

  // Rank icons
  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal size={16} style={{ color: '#C8963E' }} />;
    if (rank === 2) return <Medal size={16} style={{ color: '#9E9E9E' }} />;
    if (rank === 3) return <Medal size={16} style={{ color: '#b45309' }} />;
    return null;
  };

  // Build calculation steps for selected DMU
  const selectedResult = results[selectedDMU];
  const calcSteps = selectedResult
    ? [
        {
          title: `Step 1: 计算 ${selectedResult.name} 的产出综合得分`,
          formula: `产出综合 = ${dmuData[selectedDMU]?.outputs.map((v, i) => `${v}/${Math.max(...dmuData.map((d) => d.outputs[i]))}`).join(' + ') ?? ''}`,
          result: `产出综合得分 = ${selectedResult.outputScores.reduce((a, b) => a + b, 0).toFixed(3)}`,
          highlight: false,
        },
        {
          title: `Step 2: 计算 ${selectedResult.name} 的投入综合得分`,
          formula: `投入综合 = ${dmuData[selectedDMU]?.inputs.map((v) => String(v)).join(' + ') ?? ''}`,
          result: `投入综合 = ${selectedResult.inputScores.reduce((a, b) => a + b, 0)}`,
          highlight: false,
        },
        {
          title: `Step 3: 计算效率值 θ`,
          formula: 'θ = (产出综合 / 投入综合) / 最大值',
          result: `θ* = ${selectedResult.theta.toFixed(3)}`,
          highlight: true,
          optimal: selectedResult.effective,
        },
        {
          title: `Step 4: 判定DEA有效性`,
          formula: `θ* = ${selectedResult.theta.toFixed(3)} ${selectedResult.effective ? '= 1' : '< 1'}`,
          result: selectedResult.effective
            ? `${selectedResult.name} 是DEA有效的（位于有效前沿面上）`
            : `${selectedResult.name} 非DEA有效，需要改进`,
          highlight: true,
          optimal: selectedResult.effective,
        },
      ]
    : [];

  // Knowledge card sections
  const knowledgeSections = [
    {
      subtitle: '适用条件',
      content: [
        '适用于评价具有相同类型的多投入、多产出的决策单元（如企业、部门、项目等）的相对效率',
        '无需预设生产函数形式，避免主观赋权',
        'DMU数量建议 ≥ 2×投入数×产出数',
      ],
    },
    {
      subtitle: 'C²R模型',
      content: [
        'min θ',
        's.t. Σλⱼ·xᵢⱼ ≤ θ·xᵢⱼ₀,  i = 1,...,m（投入约束）',
        'Σλⱼ·yᵣⱼ ≥ yᵣⱼ₀,    r = 1,...,s（产出约束）',
        'λⱼ ≥ 0,  j = 1,...,n',
      ],
    },
    {
      subtitle: 'DEA有效性判定',
      content: [
        'θ* = 1 且 s⁺ = s⁻ = 0 → DEA有效（技术和规模均有效）',
        'θ* = 1 但 s⁺ ≠ 0 或 s⁻ ≠ 0 → 弱DEA有效',
        'θ* < 1 → 非DEA有效',
      ],
    },
    {
      subtitle: '规模收益判定',
      content: [
        'Σλ* = 1, θ* = 1 → 规模收益不变 (CRS)',
        'Σλ* < 1, θ* = 1 → 规模收益递增 (IRS)',
        'Σλ* > 1, θ* = 1 → 规模收益递减 (DRS)',
      ],
    },
    {
      subtitle: '特点与注意事项',
      content: [
        '无需预先设定权重，避免主观性',
        '无需指定生产函数的具体形式',
        '同时评价技术效率和规模效率',
        '可给出非有效DMU的改进方向',
        '评价的是相对效率而非绝对效率',
        'DEA对异常值敏感，结果对指标选择较为敏感',
      ],
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
        {/* ====== Section Pills ====== */}
        <SectionPills />

        {/* ====== Breadcrumb ====== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Breadcrumb
            items={[
              { label: '首页', path: '/' },
              { label: '5.4 DEA思想简化演示' },
            ]}
          />
        </motion.div>

        {/* ====== Page Header ====== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-6 mb-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
                style={{ background: '#1B3A5F', color: '#ffffff' }}
              >
                5.4
                <BarChart3 size={16} />
              </span>
            </div>
            <h1
              className="text-[28px] font-bold"
              style={{ color: '#1B3A5F', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              DEA思想简化演示
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
              投入产出效率比值分析 — 演示DEA相对效率思想（注：非严格DEA线性规划模型）
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['DEA', '效率评价', 'C²R模型', '规模收益'].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{ background: '#f1f5f9', color: '#6B6B6B' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer self-start"
            style={{ background: '#f1f5f9', color: '#6B6B6B' }}
          >
            <RotateCcw size={14} />
            重置全部数据
          </button>
        </motion.div>

        {/* ====== Section 2: DEA Theory Overview ====== */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#2A4A73' }}>
            📖 DEA方法概述（简化演示版）
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B6B6B' }}>
            数据包络分析（Data Envelopment Analysis, DEA）是1978年由Charnes、Cooper和Rhodes提出的非参数化效率评价方法，称为C²R模型。严格DEA需通过线性规划求解，输出效率值θ、权重λ、松弛变量s⁺和s⁻，并判断强有效/弱有效/非有效。
          </p>
          <div className="rounded-lg p-3 mb-4" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
            <p className="text-xs font-medium" style={{ color: '#b45309' }}>
              ⚠️ 重要声明：本页面使用「产出综合/投入综合」的比值作为效率的近似代理，并非严格DEA方法的线性规划求解结果。仅供理解DEA"相对效率"的思想，请勿用于正式决策分析。如需严格DEA分析，请使用DEA专业软件（如MaxDEA、DEAP等）。
            </p>
          </div>

          {/* Concept cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                icon: Building2,
                title: '决策单元(DMU)',
                desc: '被评价的对象，如企业、部门、项目等，具有相同的投入和产出指标',
              },
              {
                icon: Boxes,
                title: '生产可能集',
                desc: '所有投入产出组合构成的集合，DEA在此集合的前沿面上寻找最优参照',
              },
              {
                icon: TrendingUp,
                title: '有效前沿面',
                desc: '投入最小化或产出最大化的最优组合构成的包络面，有效DMU位于此面上',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="rounded-lg p-4"
                style={{
                  background: '#F8F6F2',
                  border: '1px solid #E0DDD5',
                }}
              >
                <card.icon size={20} style={{ color: '#3b82f6', marginBottom: '8px' }} />
                <h3 className="text-base font-semibold mb-1" style={{ color: '#2A4A73' }}>
                  {card.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: '#6B6B6B' }}>
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ====== Section 3: C²R Model ====== */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#2A4A73' }}>
            📐 C²R模型
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B6B6B' }}>
            C²R模型是最基本的DEA模型，假设规模收益不变（CRS）。评价第 j₀ 个决策单元的效率时，通过以下线性规划求解：
          </p>

          <div className="formula-block">
            <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>min <InlineMath math="\theta" />，s.t.</p>
            <BlockMath math="\sum_{j=1}^{n} \lambda_j x_{ij} \le \theta x_{ij_0}, \quad i=1,...,m \\ \sum_{j=1}^{n} \lambda_j y_{rj} \ge y_{rj_0}, \quad r=1,...,s \\ \lambda_j \ge 0" />
          </div>

          <p className="text-sm leading-relaxed mt-4 mb-4" style={{ color: '#6B6B6B' }}>
            上述投入导向模型的对偶形式（multiplier form）为：
          </p>

          <div className="formula-block">
            <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>max <InlineMath math="\sum_{r=1}^{s} u_r y_{rj_0}" />，s.t.</p>
            <BlockMath math="\sum_{r=1}^{s} u_r y_{rj} - \sum_{i=1}^{m} v_i x_{ij} \le 0, \quad j=1,...,n \\ \sum_{i=1}^{m} v_i x_{ij_0} = 1 \\ u_r \ge 0, \quad v_i \ge 0" />
          </div>

          {/* DEA Validity Cards */}
          <h3 className="text-sm font-semibold mt-5 mb-3" style={{ color: '#2A4A73' }}>
            DEA有效性判定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                bg: '#E8F5E9',
                border: '#bbf7d0',
                color: '#4CAF50',
                title: 'DEA有效',
                condition: 'θ* = 1 且 s⁺ = s⁻ = 0',
                meaning: '技术和规模均有效',
              },
              {
                bg: '#eff6ff',
                border: '#bae6fd',
                color: '#2563eb',
                title: '弱DEA有效',
                condition: 'θ* = 1 但 s⁺ ≠ 0 或 s⁻ ≠ 0',
                meaning: '技术有效但规模非有效',
              },
              {
                bg: '#FDE8E8',
                border: '#fecaca',
                color: '#dc2626',
                title: '非DEA有效',
                condition: 'θ* < 1',
                meaning: '技术和规模均需改进',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-lg p-4"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                }}
              >
                <span className="text-sm font-semibold" style={{ color: card.color }}>
                  {card.title}
                </span>
                <p className="text-xs mt-1 font-mono" style={{ color: '#6B6B6B' }}>
                  {card.condition}
                </p>
                <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>
                  {card.meaning}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ====== Section 4: Input/Output Data Tables ====== */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          {/* Title */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
                📊 投入产出数据
              </h2>
              <p className="text-[13px] mt-1" style={{ color: '#6B6B6B' }}>
                输入各决策单元的投入和产出数据，系统将自动计算DEA效率值
              </p>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium self-start"
              style={{ background: '#E8F5E9', color: '#4CAF50' }}
            >
              可编辑
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg" style={{ background: '#F8F6F2' }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: '#6B6B6B' }}>
                决策单元数:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDmuCountChange(-1)}
                  className="p-1 rounded-md cursor-pointer transition-colors"
                  style={{ background: '#E0DDD5', color: '#6B6B6B' }}
                >
                  <Minus size={14} />
                </button>
                <span
                  className="px-3 py-1 rounded-md text-sm font-medium text-center min-w-[32px]"
                  style={{ background: '#ffffff', border: '1px solid #E0DDD5', color: '#2A4A73' }}
                >
                  {dmuCount}
                </span>
                <button
                  onClick={() => handleDmuCountChange(1)}
                  className="p-1 rounded-md cursor-pointer transition-colors"
                  style={{ background: '#E0DDD5', color: '#6B6B6B' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Input Table */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#2A4A73' }}>
              投入数据
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#2A4A73' }}>
                    <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">DMU</th>
                    {inputLabels.slice(0, inputCount).map((label, i) => (
                      <th key={i} className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dmuNames.slice(0, dmuCount).map((name, dmuIdx) => (
                    <tr
                      key={dmuIdx}
                      style={{
                        background: dmuIdx % 2 === 0 ? '#ffffff' : '#F8F6F2',
                      }}
                    >
                      <td className="px-4 py-2.5 font-medium" style={{ color: '#2A4A73' }}>
                        {name}
                      </td>
                      {Array.from({ length: inputCount }).map((_, inputIdx) => (
                        <td key={inputIdx} className="px-4 py-2.5">
                          <input
                            type="number"
                            min={0}
                            value={inputs[dmuIdx]?.[inputIdx] ?? 0}
                            onChange={(e) => handleInputChange(dmuIdx, inputIdx, e.target.value)}
                            className="w-24 px-2 py-1.5 text-sm text-center rounded-md outline-none transition-all duration-200"
                            style={{
                              border: '1px solid #E0DDD5',
                              background: '#ffffff',
                              color: '#2A4A73',
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#60a5fa';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.15)';
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
          </div>

          {/* Output Table */}
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#2A4A73' }}>
              产出数据
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#2A4A73' }}>
                    <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">DMU</th>
                    {outputLabels.slice(0, outputCount).map((label, i) => (
                      <th key={i} className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dmuNames.slice(0, dmuCount).map((name, dmuIdx) => (
                    <tr
                      key={dmuIdx}
                      style={{
                        background: dmuIdx % 2 === 0 ? '#ffffff' : '#F8F6F2',
                      }}
                    >
                      <td className="px-4 py-2.5 font-medium" style={{ color: '#2A4A73' }}>
                        {name}
                      </td>
                      {Array.from({ length: outputCount }).map((_, outputIdx) => (
                        <td key={outputIdx} className="px-4 py-2.5">
                          <input
                            type="number"
                            min={0}
                            value={outputs[dmuIdx]?.[outputIdx] ?? 0}
                            onChange={(e) => handleOutputChange(dmuIdx, outputIdx, e.target.value)}
                            className="w-24 px-2 py-1.5 text-sm text-center rounded-md outline-none transition-all duration-200"
                            style={{
                              border: '1px solid #E0DDD5',
                              background: '#ffffff',
                              color: '#2A4A73',
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#60a5fa';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.15)';
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
          </div>
        </motion.div>

        {/* ====== Section 5: Efficiency Calculation ====== */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          {/* Title */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
                ⚖️ DEA效率值计算
              </h2>
              <p className="text-[13px] mt-1" style={{ color: '#6B6B6B' }}>
                基于C²R模型计算各决策单元的相对效率值
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: '#eff6ff', color: '#2563eb' }}
            >
              <Calculator size={13} />
              自动计算
            </span>
          </div>

          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            采用投入导向的C²R模型，对每个DMU求解线性规划，得到效率值θ。θ越接近1表示效率越高。
          </p>

          {/* Efficiency Results Table */}
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#2A4A73' }}>
                  <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">DMU</th>
                  <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">效率值 θ</th>
                  <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">排名</th>
                  <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">有效性</th>
                  <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">λ权重</th>
                  <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">参考DMU</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.06 }}
                    style={{
                      background: idx % 2 === 0 ? '#ffffff' : '#F8F6F2',
                      borderLeft: r.effective ? '3px solid #4CAF50' : '3px solid transparent',
                    }}
                    className={r.effective ? 'bg-green-50' : ''}
                  >
                    <td className="px-4 py-2.5 font-medium" style={{ color: '#2A4A73' }}>
                      {r.name}
                    </td>
                    <td
                      className="px-4 py-2.5 text-center font-mono font-semibold"
                      style={{ color: r.effective ? '#4CAF50' : '#2A4A73' }}
                    >
                      {r.theta.toFixed(3)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {rankIcon(r.rank)}
                        <span style={{ color: '#2A4A73' }}>{r.rank}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {r.effective ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#E8F5E9', color: '#4CAF50' }}
                        >
                          <CheckCircle size={12} />
                          DEA有效
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#f1f5f9', color: '#6B6B6B' }}
                        >
                          <AlertTriangle size={12} />
                          非有效
                        </span>
                      )}
                    </td>
                    <td
                      className="px-4 py-2.5 font-mono text-xs"
                      style={{ color: '#6B6B6B' }}
                    >
                      {r.lambdaWeights}
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#6B6B6B' }}>
                      {r.refDMUs}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DMU selector for calculation steps */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium" style={{ color: '#6B6B6B' }}>
              查看计算过程:
            </span>
            <div className="flex flex-wrap gap-2">
              {dmuNames.slice(0, dmuCount).map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDMU(idx)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-150"
                  style={{
                    background: selectedDMU === idx ? '#3b82f6' : '#f1f5f9',
                    color: selectedDMU === idx ? '#ffffff' : '#6B6B6B',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Calculation Steps */}
          <CalculationSteps
            title={`${selectedResult?.name ?? ''} 效率计算过程`}
            steps={calcSteps}
          />

          {/* Improvement suggestions for non-effective DMUs */}
          {selectedResult && !selectedResult.effective && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg p-4"
              style={{
                background: '#fefce8',
                border: '1px solid #fde68a',
              }}
            >
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#1B3A5F' }}>
                💡 {selectedResult.name} 改进建议
              </h4>
              <p className="text-sm mb-2" style={{ color: '#78350f' }}>
                投入冗余（可缩减量）:
              </p>
              <ul className="flex flex-col gap-1 mb-2">
                {selectedResult.inputRedundancy.map((red, i) =>
                  red > 0 ? (
                    <li key={i} className="text-sm flex items-center gap-2" style={{ color: '#78350f' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#C8963E' }} />
                      {inputLabels[i]}: 可减少 {((1 - selectedResult.theta) * 100).toFixed(1)}%（约{red.toFixed(1)}）
                    </li>
                  ) : null
                )}
              </ul>
              <p className="text-sm" style={{ color: '#1B3A5F' }}>
                要达到DEA有效，{selectedResult.name}需要在保持当前产出的基础上，将投入降低到前沿面上的投影点。
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* ====== Section 6: Efficiency Bar Chart ====== */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#2A4A73' }}>
            📈 各决策单元DEA效率对比
          </h2>
          <p className="text-[13px] mb-5" style={{ color: '#6B6B6B' }}>
            θ=1 的决策单元位于有效前沿面上
          </p>

          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
                <XAxis dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 13 }} />
                <YAxis
                  domain={[0, 1.1]}
                  tick={{ fill: '#6B6B6B', fontSize: 12 }}
                  tickFormatter={(v: number) => v.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #E0DDD5',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`θ = ${value.toFixed(3)}`, '效率值']}
                />
                <ReferenceLine
                  y={1}
                  stroke="#4CAF50"
                  strokeDasharray="5 5"
                  label={{
                    value: '有效前沿面 θ=1',
                    position: 'right',
                    fill: '#4CAF50',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="theta" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.effective ? '#4CAF50' : '#9E9E9E'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-4 mt-5"
          >
            {[
              { label: '有效DMU', value: `${effectiveCount}/${results.length}`, color: '#4CAF50' },
              { label: '平均效率', value: avgEfficiency.toFixed(3), color: '#3b82f6' },
              {
                label: '最低效率',
                value: minResult ? `${minResult.theta.toFixed(3)} (${minResult.name})` : '—',
                color: '#ef4444',
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="text-center px-5 py-3 rounded-lg"
                style={{ background: '#F8F6F2' }}
              >
                <div className="text-lg font-semibold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ====== Section 7: Scale Returns Analysis ====== */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#2A4A73' }}>
            📊 生产活动规模收益判定
          </h2>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            通过效率值和λ之和判断各DMU的规模收益状态
          </p>

          {/* Explanation */}
          <div className="mb-4 p-3 rounded-lg" style={{ background: '#F8F6F2' }}>
            <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>
              在C²R模型下，根据效率值θ*和λ权重之和判断规模收益状态：
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#E0DDD5' }}>
                    <th className="px-3 py-2 text-left font-medium" style={{ color: '#2A4A73' }}>
                      条件
                    </th>
                    <th className="px-3 py-2 text-left font-medium" style={{ color: '#2A4A73' }}>
                      规模收益状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { condition: 'Σλ* = 1 且 θ* = 1', status: '规模收益不变 (CRS)' },
                    { condition: 'Σλ* < 1 且 θ* = 1', status: '规模收益递增 (IRS)' },
                    { condition: 'Σλ* > 1 且 θ* = 1', status: '规模收益递减 (DRS)' },
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#F8F6F2' }}>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: '#6B6B6B' }}>
                        {row.condition}
                      </td>
                      <td className="px-3 py-2" style={{ color: '#2A4A73' }}>
                        {row.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scale Returns Table */}
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#2A4A73' }}>
                  <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">DMU</th>
                  <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">θ</th>
                  <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">Σλ</th>
                  <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">规模收益状态</th>
                  <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">建议</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.06 }}
                    style={{
                      background: idx % 2 === 0 ? '#ffffff' : '#F8F6F2',
                    }}
                  >
                    <td className="px-4 py-2.5 font-medium" style={{ color: '#2A4A73' }}>
                      {r.name}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono" style={{ color: '#2A4A73' }}>
                      {r.theta.toFixed(3)}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono" style={{ color: '#2A4A73' }}>
                      {r.effective ? r.lambdaSum.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {r.scaleReturns === 'IRS' && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#E8F5E9', color: '#16a34a', border: '1px solid #bbf7d0' }}
                        >
                          <IconIRS size={12} />
                          📈 递增
                        </span>
                      )}
                      {r.scaleReturns === 'DRS' && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#FDE8E8', color: '#dc2626', border: '1px solid #fecaca' }}
                        >
                          <IconDRS size={12} />
                          📉 递减
                        </span>
                      )}
                      {r.scaleReturns === 'CRS' && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd' }}
                        >
                          <IconCRS size={12} />
                          ➡️ 不变
                        </span>
                      )}
                      {!r.scaleReturns && (
                        <span className="text-xs" style={{ color: '#9E9E9E' }}>
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#6B6B6B' }}>
                      {r.scaleReturns === 'IRS' && '可适当扩大规模'}
                      {r.scaleReturns === 'DRS' && '应适当缩减规模'}
                      {r.scaleReturns === 'CRS' && '规模适中，保持现状'}
                      {!r.scaleReturns && '先改善技术效率'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scatter Chart */}
          {scatterData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#2A4A73' }}>
                规模收益散点图（有效DMU）
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="投入规模"
                      tick={{ fill: '#6B6B6B', fontSize: 12 }}
                      label={{ value: '投入规模', position: 'insideBottom', offset: -5, fill: '#6B6B6B', fontSize: 12 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="效率值"
                      domain={[0.9, 1.05]}
                      tick={{ fill: '#6B6B6B', fontSize: 12 }}
                      label={{ value: '效率值 θ', angle: -90, position: 'insideLeft', fill: '#6B6B6B', fontSize: 12 }}
                    />
                    <ZAxis type="number" dataKey="z" range={[60, 200]} />
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #E0DDD5',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(_: number, __: string, props: { payload?: { name?: string; scaleReturns?: string } }) => {
                        const p = props?.payload;
                        return [`${p?.name ?? ''} / ${p?.scaleReturns ?? ''}`, 'DMU'];
                      }}
                    />
                    <ReferenceLine y={1} stroke="#4CAF50" strokeDasharray="5 5" />
                    <Scatter data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.scaleReturns === 'IRS'
                              ? '#4CAF50'
                              : entry.scaleReturns === 'DRS'
                              ? '#ef4444'
                              : '#3b82f6'
                          }
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
                {[
                  { label: '递增 (IRS)', color: '#4CAF50' },
                  { label: '递减 (DRS)', color: '#ef4444' },
                  { label: '不变 (CRS)', color: '#3b82f6' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span className="text-xs" style={{ color: '#6B6B6B' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ====== Section 8: Knowledge Card ====== */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <KnowledgeCard
            title="DEA数据包络分析"
            sections={knowledgeSections}
            tags={['DEA', '效率评价', 'C²R模型', '线性规划', '规模收益']}
          />
        </motion.div>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </Layout>
  );
}
