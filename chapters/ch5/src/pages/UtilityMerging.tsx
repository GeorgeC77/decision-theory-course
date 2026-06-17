import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Combine, RotateCcw } from 'lucide-react';
import { SafeInlineMath as InlineMath, SafeBlockMath as BlockMath } from '@/components/SafeKatex';
import Layout from '@/components/Layout';
import FormulaBlock from '@/components/FormulaBlock';
import CalculationSteps from '@/components/CalculationSteps';
import type { CalcStep } from '@/components/CalculationSteps';
import OptimalCard from '@/components/OptimalCard';
import KnowledgeCard from '@/components/KnowledgeCard';
import UtilityContour from '@/components/UtilityContour';
import type { RuleType } from '@/components/UtilityContour';
import 'katex/dist/katex.min.css';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface RuleConfig {
  key: RuleType;
  label: string;
  shortLabel: string;
  formula: string;
  color: string;
  desc: string;
  paramDesc: string;
  applicable: string;
}

const RULES: RuleConfig[] = [
  {
    key: 'distance',
    label: '距离规则',
    shortLabel: '距离规则',
    formula: 'W(u_1,u_2) = 1 - \\sqrt{\\frac{1}{2}[(1-u_1)^2 + (1-u_2)^2]}',
    color: '#6366f1', // indigo
    desc: '二维演示：并合效用与距离理想点(1,1)的欧氏距离成反比。本页面表格与等高线仅展示前两个准则的并合效果。',
    paramDesc: '无参数，二维演示仅依赖u_1和u_2',
    applicable: '成本效益分析等需要衡量与理想点距离的场景',
  },
  {
    key: 'substitution',
    label: '代换规则',
    shortLabel: '代换规则',
    formula: 'W(u_1,u_2) = 1 - (1-u_1)(1-u_2)',
    color: '#3b82f6', // blue
    desc: '"一好遮百丑"，任一效用取最大值时并合效用即达最大。W(u₁,1)=1, W(1,u₂)=1。反映效用间完全可替代的特征。',
    paramDesc: '无参数，仅依赖u_1和u_2',
    applicable: '效用间可完全替代的场景，如设备可靠性（自身可靠性+维修保养）',
  },
  {
    key: 'additive',
    label: '加法规则（线性加权）',
    shortLabel: '加法规则',
    formula: 'W(u_1,u_2) = \\rho_1 u_1 + \\rho_2 u_2  \\quad (\\rho_1+\\rho_2=1)',
    color: '#4CAF50', // green
    desc: '准则间可互相线性补偿，一目标效用减少可由另一目标效用增加补偿。ρ₁,ρ₂为权系数，反映准则重要性。',
    paramDesc: '\\rho_i \\ge 0，\\sum \\rho_i = 1；u_i \\in {[0,1]}',
    applicable: '准则间可线性补偿的场景，如居民消费水平（吃+用）',
  },
  {
    key: 'multiplicative',
    label: '乘法规则',
    shortLabel: '乘法规则',
    formula: 'W(u_1,u_2) = u_1^{\\rho_1} \\cdot u_2^{\\rho_2}',
    color: '#a855f7', // purple
    desc: '不可偏废，任一效用为0则并合效用为0。强调"木桶效应"。当\\rho_1=\\rho_2=1时，W=u_1 u_2。',
    paramDesc: '\\rho_i > 0；u_i \\in {[0,1]}',
    applicable: '准则缺一不可的系统（如功能+可靠性）',
  },
  {
    key: 'mixed',
    label: '混合规则',
    shortLabel: '混合规则',
    formula: '1 + \\gamma W = (1 + \\gamma c_1 u_1)(1 + \\gamma c_2 u_2)',
    color: '#f59e0b', // amber
    desc: '\\gamma为形式因子。\\gamma=0时退化为加法规则；\\gamma<0时体现准则间的可代换性；\\gamma>0时体现互补性。计算结果截断至[0,1]。',
    paramDesc: '\\gamma \\ge -1；c_i \\ge 0，\\sum c_i = 1；u_i \\in {[0,1]}',
    applicable: '准则间关系复杂，不能确定选用哪种基本规则时',
  },
];

const CRITERIA = ['经济效益', '社会效益', '环境效益', '技术可行性'];
const CRITERIA_KEYS = ['g1', 'g2', 'g3', 'g4'];
const CRITERIA_COLORS = ['#3b82f6', '#4CAF50', '#a855f7', '#f59e0b'];

function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 1 / weights.length);
  return weights.map((w) => w / sum);
}

/* Note: g1-g4 are "standardized utility approximation values" (0-1 scale)
   representing dimensionless scores, not strict utility functions. */
const INITIAL_ALTERNATIVES = [
  { name: 'A₁', g1: 0.90, g2: 0.70, g3: 0.60, g4: 0.85 },
  { name: 'A₂', g1: 0.70, g2: 0.90, g3: 0.80, g4: 0.70 },
  { name: 'A₃', g1: 0.60, g2: 0.60, g3: 0.90, g4: 0.75 },
];

const INITIAL_WEIGHTS = [0.30, 0.25, 0.25, 0.20];
const INITIAL_RHO = [0.30, 0.25, 0.25, 0.20];

/* ─────────────────── animation variants ─────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

/* ─────────────────── UtilityMergingPage ─────────────────── */

export default function UtilityMergingPage() {
  const [activeRule, setActiveRule] = useState<RuleType>('distance');

  /* utility matrix */
  const [alternatives, setAlternatives] = useState(INITIAL_ALTERNATIVES);

  /* parameters per rule */
  const [weights, setWeights] = useState(INITIAL_WEIGHTS);
  const [rhos, setRhos] = useState(INITIAL_RHO);
  const [gamma, setGamma] = useState(1.0);
  const [mixedWeights, setMixedWeights] = useState(INITIAL_WEIGHTS);

  /* 3D surface parameters */
  const [surfC1, setSurfC1] = useState(0.5);
  const [surfC2, setSurfC2] = useState(0.5);
  const [surfRho1, setSurfRho1] = useState(1);
  const [surfRho2, setSurfRho2] = useState(1);
  const [surfGamma, setSurfGamma] = useState(0.5);

  const ruleConfig = RULES.find((r) => r.key === activeRule)!;

  /* Normalized weights for calculation to avoid misleading results
     when user inputs do not sum to 1. */
  const effectiveWeights = useMemo(() => normalizeWeights(weights), [weights]);
  const effectiveRhos = useMemo(() => normalizeWeights(rhos), [rhos]);
  const effectiveMixedWeights = useMemo(
    () => normalizeWeights(mixedWeights),
    [mixedWeights]
  );

  const weightSum = useMemo(() => weights.reduce((a, b) => a + b, 0), [weights]);
  const rhoSum = useMemo(() => rhos.reduce((a, b) => a + b, 0), [rhos]);
  const mixedWeightSum = useMemo(
    () => mixedWeights.reduce((a, b) => a + b, 0),
    [mixedWeights]
  );

  /* ────────────── calculations ────────────── */

  const results = useMemo(() => {
    return alternatives.map((alt) => {
      const u = [alt.g1, alt.g2, alt.g3, alt.g4];
      let W = 0;
      switch (activeRule) {
        case 'distance': {
          // Use u1 and u2 for 2D visualization, but for table use first two
          W = 1 - Math.sqrt(0.5 * ((1 - u[0]) ** 2 + (1 - u[1]) ** 2));
          break;
        }
        case 'substitution': {
          W = 1 - u.reduce((prod, ui) => prod * (1 - ui), 1);
          break;
        }
        case 'additive': {
          W = u.reduce((sum, ui, i) => sum + effectiveWeights[i] * ui, 0);
          break;
        }
        case 'multiplicative': {
          W = u.reduce((prod, ui, i) => prod * Math.pow(ui, effectiveRhos[i]), 1);
          break;
        }
        case 'mixed': {
          if (Math.abs(gamma) < 0.0001) {
            W = u.reduce((sum, ui, i) => sum + effectiveMixedWeights[i] * ui, 0);
          } else {
            const prod = u.reduce(
              (p, ui, i) => p * (1 + gamma * effectiveMixedWeights[i] * ui),
              1
            );
            W = (prod - 1) / gamma;
          }
          break;
        }
      }
      return { name: alt.name, W: Math.round(Math.max(0, Math.min(1, W)) * 1000) / 1000, utilities: u };
    });
  }, [alternatives, activeRule, effectiveWeights, effectiveRhos, gamma, effectiveMixedWeights]);

  const optimalIndex = useMemo(() => {
    let best = 0;
    results.forEach((r, i) => {
      if (r.W > results[best].W) best = i;
    });
    return best;
  }, [results]);

  /* ────────────── handlers ────────────── */

  const handleUtilityChange = useCallback(
    (altIdx: number, critIdx: number, val: string) => {
      const num = parseFloat(val);
      if (Number.isNaN(num)) return;
      const clamped = Math.max(0, Math.min(1, num));
      setAlternatives((prev) => {
        const next = prev.map((a) => ({ ...a }));
        const key = CRITERIA_KEYS[critIdx] as 'g1' | 'g2' | 'g3' | 'g4';
        next[altIdx] = { ...next[altIdx], [key]: clamped };
        return next;
      });
    },
    []
  );

  const handleWeightChange = useCallback(
    (idx: number, val: string, setter: React.Dispatch<React.SetStateAction<number[]>>) => {
      const num = parseFloat(val);
      if (Number.isNaN(num)) return;
      setter((prev) => {
        const next = [...prev];
        next[idx] = Math.max(0, Math.min(1, num));
        return next;
      });
    },
    []
  );

  const handleReset = () => {
    setAlternatives(INITIAL_ALTERNATIVES);
    setWeights(INITIAL_WEIGHTS);
    setRhos(INITIAL_RHO);
    setGamma(1.0);
    setMixedWeights(INITIAL_WEIGHTS);
  };

  /* ────────────── chart data ────────────── */

  const chartData = useMemo(() => {
    return alternatives.map((alt, idx) => ({
      name: `方案${alt.name}`,
      G1经济效益: alt.g1,
      G2社会效益: alt.g2,
      G3环境效益: alt.g3,
      G4技术可行性: alt.g4,
      综合效用: results[idx].W,
    }));
  }, [alternatives, results]);

  /* ────────────── calculation steps ────────────── */

  const calcSteps = useMemo<CalcStep[]>(() => {
    const steps: CalcStep[] = [];

    if (activeRule === 'distance') {
      steps.push({
        title: 'Step 1: 确认距离规则公式',
        formula: 'W = 1 − √{(1/2)[(1−u₁)² + (1−u₂)²]}（二维演示，仅使用前两个准则），理想点为(1,1)',
        highlight: true,
      });
      results.forEach((r, idx) => {
        const alt = alternatives[idx];
        const isOptimal = idx === optimalIndex;
        const d = Math.sqrt(0.5 * ((1 - alt.g1) ** 2 + (1 - alt.g2) ** 2));
        steps.push({
          title: `Step ${idx + 2}: 方案${alt.name} 综合效用计算`,
          formula: `W${idx + 1} = 1 − √{(1/2)[(1−${alt.g1.toFixed(2)})² + (1−${alt.g2.toFixed(2)})²]} = 1 − ${d.toFixed(4)} = ${r.W.toFixed(3)}${isOptimal ? '  ← 最优' : ''}`,
          result: isOptimal ? `最优方案: 方案${alt.name}，W = ${r.W.toFixed(3)}` : undefined,
          highlight: isOptimal,
          optimal: isOptimal,
        });
      });
    } else if (activeRule === 'substitution') {
      steps.push({
        title: 'Step 1: 确认代换规则公式',
        formula: 'W = 1 − (1−u₁)(1−u₂)...(1−uₙ)，"一好遮百丑"',
        highlight: true,
      });
      results.forEach((r, idx) => {
        const alt = alternatives[idx];
        const terms = [alt.g1, alt.g2, alt.g3, alt.g4].map(
          (u) => `(1−${u.toFixed(2)})`
        );
        const prod = (1 - alt.g1) * (1 - alt.g2) * (1 - alt.g3) * (1 - alt.g4);
        const isOptimal = idx === optimalIndex;
        steps.push({
          title: `Step ${idx + 2}: 方案${alt.name} 综合效用计算`,
          formula: `W${idx + 1} = 1 − ${terms.join('·')} = 1 − ${prod.toFixed(4)} = ${r.W.toFixed(3)}${isOptimal ? '  ← 最优' : ''}`,
          result: isOptimal ? `最优方案: 方案${alt.name}，W = ${r.W.toFixed(3)}` : undefined,
          highlight: isOptimal,
          optimal: isOptimal,
        });
      });
    } else if (activeRule === 'additive') {
      const sumInfo =
        Math.abs(weightSum - 1) < 0.01
          ? `Σ = ${weightSum.toFixed(2)} ✓`
          : `输入和 Σ = ${weightSum.toFixed(2)}，已按当前比例归一化为 (${effectiveWeights.map((w) => w.toFixed(2)).join(', ')}) 参与计算`;
      steps.push({
        title: 'Step 1: 确认权重系数',
        formula: `ρ₁=${weights[0].toFixed(2)}, ρ₂=${weights[1].toFixed(2)}, ρ₃=${weights[2].toFixed(2)}, ρ₄=${weights[3].toFixed(2)}  |  ${sumInfo}`,
        highlight: true,
      });
      results.forEach((r, idx) => {
        const alt = alternatives[idx];
        const terms = [alt.g1, alt.g2, alt.g3, alt.g4].map(
          (u, i) => `${effectiveWeights[i].toFixed(2)}×${u.toFixed(2)}`
        );
        const vals = [alt.g1, alt.g2, alt.g3, alt.g4].map(
          (u, i) => (effectiveWeights[i] * u).toFixed(3)
        );
        const isOptimal = idx === optimalIndex;
        steps.push({
          title: `Step ${idx + 2}: 方案${alt.name} 综合效用计算`,
          formula: `W${idx + 1} = ${terms.join(' + ')} = ${vals.join(' + ')} = ${r.W.toFixed(3)}${isOptimal ? '  ← 最优' : ''}`,
          result: isOptimal ? `最优方案: 方案${alt.name}，W = ${r.W.toFixed(3)}` : undefined,
          highlight: isOptimal,
          optimal: isOptimal,
        });
      });
    } else if (activeRule === 'multiplicative') {
      const sumInfo =
        Math.abs(rhoSum - 1) < 0.01
          ? `Σ = ${rhoSum.toFixed(2)} ✓`
          : `输入和 Σ = ${rhoSum.toFixed(2)}，已按当前比例归一化为 (${effectiveRhos.map((w) => w.toFixed(2)).join(', ')}) 参与计算`;
      steps.push({
        title: 'Step 1: 确认重要性指数',
        formula: `ρ₁=${rhos[0].toFixed(2)}, ρ₂=${rhos[1].toFixed(2)}, ρ₃=${rhos[2].toFixed(2)}, ρ₄=${rhos[3].toFixed(2)}  |  ${sumInfo}`,
        highlight: true,
      });
      results.forEach((r, idx) => {
        const alt = alternatives[idx];
        const terms = [alt.g1, alt.g2, alt.g3, alt.g4].map(
          (u, i) => `${u.toFixed(2)}^${effectiveRhos[i].toFixed(2)}`
        );
        const vals = [alt.g1, alt.g2, alt.g3, alt.g4].map((u, i) =>
          Math.pow(u, effectiveRhos[i]).toFixed(4)
        );
        const isOptimal = idx === optimalIndex;
        steps.push({
          title: `Step ${idx + 2}: 方案${alt.name} 综合效用计算`,
          formula: `W${idx + 1} = ${terms.join(' × ')} = ${vals.join(' × ')} ≈ ${r.W.toFixed(3)}${isOptimal ? '  ← 最优' : ''}`,
          result: isOptimal ? `最优方案: 方案${alt.name}，W = ${r.W.toFixed(3)}` : undefined,
          highlight: isOptimal,
          optimal: isOptimal,
        });
      });
    } else if (activeRule === 'mixed') {
      const sumInfo =
        Math.abs(mixedWeightSum - 1) < 0.01
          ? `Σcᵢ = ${mixedWeightSum.toFixed(2)} ✓`
          : `输入和 Σcᵢ = ${mixedWeightSum.toFixed(2)}，已按当前比例归一化为 (${effectiveMixedWeights.map((w) => w.toFixed(2)).join(', ')}) 参与计算`;
      steps.push({
        title: 'Step 1: 确认混合规则参数',
        formula: `γ = ${gamma.toFixed(2)}, c₁=${mixedWeights[0].toFixed(2)}, c₂=${mixedWeights[1].toFixed(2)}, c₃=${mixedWeights[2].toFixed(2)}, c₄=${mixedWeights[3].toFixed(2)}  |  ${sumInfo}`,
        highlight: true,
      });
      results.forEach((r, idx) => {
        const alt = alternatives[idx];
        const terms = [alt.g1, alt.g2, alt.g3, alt.g4].map(
          (u, i) => `(1 + ${gamma.toFixed(1)}×${effectiveMixedWeights[i].toFixed(2)}×${u.toFixed(2)})`
        );
        const vals = [alt.g1, alt.g2, alt.g3, alt.g4].map(
          (u, i) => (1 + gamma * effectiveMixedWeights[i] * u).toFixed(4)
        );
        const prod = vals.reduce((p, v) => p * parseFloat(v), 1);
        const isOptimal = idx === optimalIndex;
        if (Math.abs(gamma) < 0.0001) {
          steps.push({
            title: `Step ${idx + 2}: 方案${alt.name} 综合效用计算 (γ≈0，退化为加法规则)`,
            formula: `W${idx + 1} ≈ Σcᵢ·uᵢ = ${r.W.toFixed(3)}${isOptimal ? '  ← 最优' : ''}`,
            result: isOptimal ? `最优方案: 方案${alt.name}，W = ${r.W.toFixed(3)}` : undefined,
            highlight: isOptimal,
            optimal: isOptimal,
          });
        } else {
          steps.push({
            title: `Step ${idx + 2}: 方案${alt.name} 综合效用计算`,
            formula: `1 + ${gamma.toFixed(2)}W${idx + 1} = ${terms.join(' × ')} = ${vals.join(' × ')} = ${prod.toFixed(4)}  →  W${idx + 1} = ${r.W.toFixed(3)}${isOptimal ? '  ← 最优' : ''}`,
            result: isOptimal ? `最优方案: 方案${alt.name}，W = ${r.W.toFixed(3)}` : undefined,
            highlight: isOptimal,
            optimal: isOptimal,
          });
        }
      });
    }

    return steps;
  }, [activeRule, weights, effectiveWeights, weightSum, rhos, effectiveRhos, rhoSum, gamma, mixedWeights, effectiveMixedWeights, mixedWeightSum, results, alternatives, optimalIndex]);

  /* ────────────── optimal description ────────────── */

  const optimalAlt = alternatives[optimalIndex];
  const optimalDesc = useMemo(() => {
    const r = results[optimalIndex];
    const ruleNames: Record<RuleType, string> = {
      distance: '距离规则',
      substitution: '代换规则',
      additive: '加法规则',
      multiplicative: '乘法规则',
      mixed: '混合规则',
    };
    return `在${ruleNames[activeRule]}下，方案${optimalAlt.name}的综合效用最高（W = ${r.W.toFixed(3)}）。该方案在各准则上表现均衡，${CRITERIA.map((c, i) => `${c}(${optimalAlt[CRITERIA_KEYS[i] as 'g1' | 'g2' | 'g3' | 'g4'].toFixed(2)})`).join('、')}。`;
  }, [activeRule, optimalIndex, results, optimalAlt]);

  /* ────────────── render ────────────── */

  return (
    <Layout>
      <motion.div
        className=""
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Section Header ── */}
        <motion.div variants={itemVariants} className="mt-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-semibold"
                  style={{ background: '#1B3A5F', color: '#ffffff' }}
                >
                  5.2
                </span>
                <Combine size={20} style={{ color: '#9E9E9E' }} />
              </div>
              <h1 className="text-[28px] font-bold" style={{ color: '#2A4A73' }}>
                多维效用并合方法
              </h1>
              <p className="text-sm mt-1.5" style={{ color: '#6B6B6B' }}>
                多准则效用并合方法：距离、代换、加法、乘法与混合规则
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['效用并合', '距离规则', '代换规则', '加法规则', '乘法规则', '混合规则'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
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
              重置数据
            </button>
          </div>
        </motion.div>

        {/* ── Section 2: 2D Contour Visualization ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-6 mb-6 card-hover"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#2A4A73' }}>
            🔮 二维效用并合等高线图
          </h2>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            以两个准则为例，展示不同并合规则下的综合效用W的等高线分布。
            X轴=u₁，Y轴=u₂，颜色表示综合效用W的大小（蓝→绿→黄→红）。
          </p>

          {/* Parameter sliders */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {activeRule === 'distance' && (
              <p className="text-sm" style={{ color: '#6B6B6B' }}>距离规则无参数，二维演示直接由u₁和u₂决定</p>
            )}
            {activeRule === 'substitution' && (
              <p className="text-sm" style={{ color: '#6B6B6B' }}>代换规则无参数，直接由u₁和u₂决定</p>
            )}
            {activeRule === 'additive' && (
              <>
                <Slider3D label="c₁ (权重)" value={surfC1} onChange={setSurfC1} min={0} max={1} step={0.05} />
                <Slider3D label="c₂ (权重)" value={surfC2} onChange={setSurfC2} min={0} max={1} step={0.05} />
              </>
            )}
            {activeRule === 'multiplicative' && (
              <>
                <Slider3D label="ρ₁ (指数)" value={surfRho1} onChange={setSurfRho1} min={0.1} max={3} step={0.1} />
                <Slider3D label="ρ₂ (指数)" value={surfRho2} onChange={setSurfRho2} min={0.1} max={3} step={0.1} />
              </>
            )}
            {activeRule === 'mixed' && (
              <>
                <Slider3D label="γ (交互参数)" value={surfGamma} onChange={setSurfGamma} min={-1} max={5} step={0.1} />
                <Slider3D label="c₁ (权重)" value={surfC1} onChange={setSurfC1} min={0} max={1} step={0.05} />
                <Slider3D label="c₂ (权重)" value={surfC2} onChange={setSurfC2} min={0} max={1} step={0.05} />
              </>
            )}
          </div>

          {/* 2D Contour Canvas */}
          <UtilityContour
            rule={activeRule}
            c1={surfC1}
            c2={surfC2}
            rho1={surfRho1}
            rho2={surfRho2}
            gamma={surfGamma}
            k={0}
            altU1={[0.8, 0.6, 0.4]}
            altU2={[0.7, 0.9, 0.5]}
            altNames={['方案A₁', '方案A₂', '方案A₃']}
          />
        </motion.div>

        {/* ── Section 3: Theory Card ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#2A4A73' }}>
            📖 多维效用并合模型
          </h2>
          <div className="text-sm leading-relaxed mb-4" style={{ color: '#6B6B6B' }}>
            <p className="mb-3">
              设决策问题有 <InlineMath math="s" /> 个评价准则{' '}
              <InlineMath math="G_1, G_2, \\ldots, G_s" />，<InlineMath math="m" /> 个可行方案{' '}
              <InlineMath math="A_1, A_2, ..., A_m" />。每个方案在各准则下的效用值为{' '}
              <InlineMath math="u_i(A_k) \in {[0, 1]}" />，简记为 <InlineMath math="u_{ki}" />。
            </p>
            <p>
              多维效用并合就是根据一定的规则将这 <InlineMath math="s" />{' '}
              个准则效用值并合为一个综合效用值 <InlineMath math="W" />，用于评价和比较各方案的整体优劣。
            </p>
          </div>

          {/* General model formula */}
          <div className="formula-block">
            <BlockMath math="W = \mathcal{M}(u_1, u_2, \ldots, u_n)" />
            <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>s.t. <InlineMath math="u_i \in {[0,1]}" /></p>
          </div>

          {/* 5 rule mini-cards */}
          <h3 className="text-sm font-semibold mt-6 mb-3" style={{ color: '#2A4A73' }}>
            五种并合规则：
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {RULES.map((rule) => (
              <button
                key={rule.key}
                onClick={() => setActiveRule(rule.key)}
                className="text-left rounded-lg p-4 transition-all duration-200 cursor-pointer"
                style={{
                  border: `2px solid ${activeRule === rule.key ? rule.color : rule.color + '40'}`,
                  background: activeRule === rule.key ? rule.color + '08' : '#ffffff',
                  boxShadow: activeRule === rule.key ? `0 4px 12px ${rule.color}20` : undefined,
                }}
              >
                <div
                  className="h-1 w-full rounded-full mb-3"
                  style={{ background: rule.color }}
                />
                <h4 className="text-base font-semibold" style={{ color: rule.color }}>
                  {rule.shortLabel}
                </h4>
                <p className="text-xs font-mono mt-2" style={{ color: '#2A4A73' }}>
                  <InlineMath math={rule.formula} />
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Section 3: Rule Selector Tabs ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#2A4A73' }}>
            🔧 选择并合规则
          </h2>

          {/* Tabs */}
          <div className="flex flex-wrap">
            {RULES.map((rule, idx) => (
              <button
                key={rule.key}
                onClick={() => setActiveRule(rule.key)}
                className="flex-1 min-w-[140px] px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap"
                style={{
                  background: activeRule === rule.key ? '#1B3A5F' : '#ffffff',
                  color: activeRule === rule.key ? '#ffffff' : '#6B6B6B',
                  border: '1px solid #E0DDD5',
                  borderRightWidth: idx < RULES.length - 1 ? 0 : 1,
                  borderRadius:
                    idx === 0
                      ? '8px 0 0 8px'
                      : idx === RULES.length - 1
                        ? '0 8px 8px 0'
                        : 0,
                }}
              >
                {rule.label}
              </button>
            ))}
          </div>

          {/* Rule detail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-4 p-4 rounded-lg"
              style={{ background: '#F8F6F2' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: ruleConfig.color }}
                />
                <span className="text-sm font-semibold" style={{ color: '#2A4A73' }}>
                  {ruleConfig.shortLabel}
                </span>
              </div>
              <FormulaBlock formula={ruleConfig.formula} />
              <div className="mt-3 text-sm" style={{ color: '#6B6B6B' }}>
                <p className="mb-1">
                  <span className="font-medium" style={{ color: '#2A4A73' }}>
                    参数说明：
                  </span>
                  <InlineMath math={ruleConfig.paramDesc} />
                </p>
                <p>
                  <span className="font-medium" style={{ color: '#2A4A73' }}>
                    适用场景：
                  </span>
                  {ruleConfig.applicable}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── Section 4: Interactive Calculator ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              🧮 效用值输入与计算
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: '#6B6B6B' }}>
            输入各方案在各准则下的效用值(0-1)，系统将自动按选中规则计算综合效用
          </p>

          {/* Parameter inputs */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`params-${activeRule}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-5 p-4 rounded-lg"
              style={{ background: '#F8F6F2' }}
            >
              {/* Additive / Multiplicative / Mixed weights */}
              {(activeRule === 'additive' ||
                activeRule === 'multiplicative' ||
                activeRule === 'mixed') && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium" style={{ color: '#2A4A73' }}>
                      {activeRule === 'additive'
                        ? '权重 ρᵢ'
                        : activeRule === 'multiplicative'
                          ? '重要性指数 ρᵢ'
                          : '权重 cᵢ'}
                    </span>
                    {activeRule === 'additive' && (
                      <span
                        className="text-xs"
                        style={{
                          color: Math.abs(weightSum - 1) < 0.01 ? '#4CAF50' : '#f59e0b',
                        }}
                      >
                        {Math.abs(weightSum - 1) < 0.01
                          ? `Σ = ${weightSum.toFixed(2)} ✓`
                          : `Σ = ${weightSum.toFixed(2)}，已按当前比例归一化后计算`}
                      </span>
                    )}
                    {activeRule === 'multiplicative' && (
                      <span
                        className="text-xs"
                        style={{
                          color: Math.abs(rhoSum - 1) < 0.01 ? '#4CAF50' : '#f59e0b',
                        }}
                      >
                        {Math.abs(rhoSum - 1) < 0.01
                          ? `Σ = ${rhoSum.toFixed(2)} ✓`
                          : `Σ = ${rhoSum.toFixed(2)}，已按当前比例归一化后计算`}
                      </span>
                    )}
                    {activeRule === 'mixed' && (
                      <span
                        className="text-xs"
                        style={{
                          color: Math.abs(mixedWeightSum - 1) < 0.01 ? '#4CAF50' : '#f59e0b',
                        }}
                      >
                        {Math.abs(mixedWeightSum - 1) < 0.01
                          ? `Σcᵢ = ${mixedWeightSum.toFixed(2)} ✓`
                          : `Σcᵢ = ${mixedWeightSum.toFixed(2)}，已按当前比例归一化后计算`}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {CRITERIA.map((c, i) => (
                      <div key={c} className="flex items-center gap-2">
                        <label className="text-xs font-mono" style={{ color: '#6B6B6B' }}>
                          {activeRule === 'multiplicative' ? `ρ${i + 1}=` : `c${i + 1}=`}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={
                            activeRule === 'additive'
                              ? weights[i]
                              : activeRule === 'multiplicative'
                                ? rhos[i]
                                : mixedWeights[i]
                          }
                          onChange={(e) =>
                            handleWeightChange(
                              i,
                              e.target.value,
                              activeRule === 'additive'
                                ? setWeights
                                : activeRule === 'multiplicative'
                                  ? setRhos
                                  : setMixedWeights
                            )
                          }
                          className="w-20 px-2 py-1.5 text-sm text-center rounded-md outline-none transition-all duration-200"
                          style={{
                            border: '1px solid #E0DDD5',
                            background: '#ffffff',
                            color: '#2A4A73',
                            fontFamily: 'var(--font-mono)',
                          }}
                        />
                        <span className="text-xs" style={{ color: '#9E9E9E' }}>
                          {c}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mixed gamma slider */}
              {activeRule === 'mixed' && (
                <div className="flex items-center gap-4 flex-wrap mt-3">
                  <label className="text-sm font-medium" style={{ color: '#2A4A73' }}>
                    并合度 γ =
                  </label>
                  <input
                    type="range"
                    min={-1}
                    max={5}
                    step={0.1}
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    className="w-48"
                  />
                  <span
                    className="text-sm font-mono font-semibold px-2 py-1 rounded"
                    style={{ background: '#f1f5f9', color: '#2A4A73' }}
                  >
                    {gamma.toFixed(1)}
                  </span>
                  <span className="text-xs" style={{ color: '#9E9E9E' }}>
                    γ=0退化为加法规则；γ&gt;0强调互补性；γ&lt;0强调可替代性
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Editable utility table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#2A4A73' }}>
                  <th className="px-4 py-3 text-left text-white font-medium whitespace-nowrap">
                    方案
                  </th>
                  {CRITERIA.map((c, i) => (
                    <th
                      key={c}
                      className="px-4 py-3 text-center text-white font-medium whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: CRITERIA_COLORS[i] }}
                        />
                        准则G{i + 1}
                      </div>
                      <span className="text-xs font-normal" style={{ color: '#9E9E9E' }}>
                        ({c})
                      </span>
                    </th>
                  ))}
                  <th
                    className="px-4 py-3 text-center text-white font-medium whitespace-nowrap"
                  >
                    综合效用 W
                  </th>
                  <th className="px-4 py-3 text-center text-white font-medium whitespace-nowrap">
                    结果
                  </th>
                </tr>
              </thead>
              <tbody>
                {alternatives.map((alt, rowIdx) => {
                  const isOptimal = rowIdx === optimalIndex;
                  return (
                    <motion.tr
                      key={alt.name}
                      animate={
                        isOptimal
                          ? { backgroundColor: ['#ffffff', '#E8F5E9', '#E8F5E9'] }
                          : {}
                      }
                      transition={{ duration: 0.4 }}
                      style={{
                        background: isOptimal ? '#E8F5E9' : rowIdx % 2 === 0 ? '#ffffff' : '#F8F6F2',
                        borderLeft: isOptimal ? '3px solid #4CAF50' : '3px solid transparent',
                      }}
                    >
                      <td className="px-4 py-2.5 font-medium" style={{ color: '#2A4A73' }}>
                        方案{alt.name}
                      </td>
                      {CRITERIA_KEYS.map((key, ci) => (
                        <td key={key} className="px-4 py-2.5">
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            value={alt[key as 'g1' | 'g2' | 'g3' | 'g4']}
                            onChange={(e) => handleUtilityChange(rowIdx, ci, e.target.value)}
                            className="w-full px-2 py-1.5 text-sm text-center rounded-md outline-none transition-all duration-200"
                            style={{
                              border: '1px solid #E0DDD5',
                              background: '#ffffff',
                              color: '#2A4A73',
                              fontFamily: 'var(--font-mono)',
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
                      <td
                        className="px-4 py-2.5 text-center font-semibold font-mono"
                        style={{ color: isOptimal ? '#4CAF50' : '#2A4A73' }}
                      >
                        {results[rowIdx].W.toFixed(3)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {isOptimal ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: '#E8F5E9', color: '#4CAF50' }}
                          >
                            最优
                          </span>
                        ) : (
                          <span style={{ color: '#9E9E9E' }}>—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── Section 5: Calculation Steps ── */}
        <motion.div variants={itemVariants} className="mb-6">
          <CalculationSteps
            title="📝 计算过程"
            steps={calcSteps}
          />
        </motion.div>

        {/* ── Section 6: Bar Chart ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-6 mb-6"
          style={{ border: '1px solid #E0DDD5' }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              📊 各方案综合效用对比
            </h3>
            <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
              不同并合规则下各方案综合效用的柱状图对比（绿色柱状为最优方案）
            </p>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B6B6B' }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E0DDD5',
                    fontSize: '13px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                {CRITERIA.map((c, i) => (
                  <Bar
                    key={c}
                    dataKey={`G${i + 1}${c}`}
                    fill={CRITERIA_COLORS[i]}
                    radius={[4, 4, 0, 0]}
                    fillOpacity={0.85}
                  />
                ))}
                <Bar
                  dataKey="综合效用"
                  fill="#1B3A5F"
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.9}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Section 7: Optimal Card ── */}
        <motion.div variants={itemVariants} className="mb-6">
          <OptimalCard
            name={`方案${results[optimalIndex].name}`}
            value={`综合效用 W = ${results[optimalIndex].W.toFixed(3)} (${ruleConfig.shortLabel})`}
            description={optimalDesc}
          />
        </motion.div>

        {/* ── Section 8: Knowledge Card ── */}
        <motion.div variants={itemVariants}>
          <KnowledgeCard
            title="多维效用并合方法"
            sections={[
              {
                subtitle: '适用条件',
                content: [
                  '适用于多准则决策问题中，需要将多个准则效用值合并为单一综合效用值进行方案排序的场景。',
                ],
              },
              {
                subtitle: '五种并合规则对比',
                content: [
                  '【距离规则】W = 1 − √{(1/2)[(1−u₁)²+(1−u₂)²]} — 二维演示，与理想点(1,1)的欧氏距离成反比。适用：成本效益分析等需要衡量与理想点距离的场景',
                  '【代换规则】W = 1−Π(1−uᵢ) — "一好遮百丑"，任一效用取1则W=1。适用：效用间可完全替代的场景',
                  '【加法规则】W = Σρᵢuᵢ — 可互相线性补偿，加权求和。适用：准则间可线性补偿的场景（如居民消费水平）',
                  '【乘法规则】W = Πuᵢ^ρᵢ — 不可偏废，任一效用为0则W=0。适用：准则缺一不可的系统（木桶效应）',
                  '【混合规则】1+γW = Π(1+γcᵢuᵢ) — γ=−1时代换，γ=0时加法，γ>0时体现互补性（结果截断至[0,1]）。适用：准则间关系复杂的场景',
                ],
              },
              {
                subtitle: '特点',
                content: [
                  '距离规则通过距离理想点的远近衡量综合效用，适用于成本效益分析',
                  '代换规则体现"一好遮百丑"，任一准则最优即可使综合效用最大',
                  '加法规则准则间可线性补偿，是最常用的加权求和法',
                  '乘法规则强调"木桶效应"，任一准则低效会显著拉低综合效用',
                  '混合规则通过 γ 参数统一描述三种基本规则',
                  '不同规则可能产生不同的方案排序结果，建议多种规则分别计算后对比稳健性',
                ],
              },
              {
                subtitle: '注意事项',
                content: [
                  '各准则效用值须先标准化到 [0, 1] 区间',
                  '权重/参数的确定需要专家参与（如AHP法）',
                  '规则的选取应基于准则间的实际关系',
                  '建议用多种规则分别计算，对比结果的稳健性',
                ],
              },
            ]}
            tags={['效用并合', '距离规则', '代换规则', '加法规则', '乘法规则', '混合规则', '多准则决策']}
          />
        </motion.div>
      </motion.div>
    </Layout>
  );
}

/* ─────────────────── 3D Slider helper ─────────────────── */

function Slider3D({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: '#6B6B6B' }}>
        {label} = {value.toFixed(2)}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}


