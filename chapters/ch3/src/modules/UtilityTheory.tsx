import { useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  RotateCcw,
  TrendingDown,
  Minus,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

/* ── types ── */
type RiskType = 'averse' | 'neutral' | 'seeking';

interface RiskOption {
  key: RiskType;
  label: string;
  icon: typeof TrendingDown;
  desc: string;
  formula: string;
  formulaParts: string[];
}

/* ── constants ── */
const RISK_OPTIONS: RiskOption[] = [
  {
    key: 'averse',
    label: '风险厌恶',
    icon: TrendingDown,
    desc: '递增凹函数，边际效用递减，U"(x) < 0',
    formula: 'U(x)=√(x/100)',
    formulaParts: ['U(x) = √(x/100)'],
  },
  {
    key: 'neutral',
    label: '风险中性',
    icon: Minus,
    desc: '线性函数，收益与效成正比，U"(x) = 0',
    formula: 'U(x)=x/100',
    formulaParts: ['U(x) = x / 100'],
  },
  {
    key: 'seeking',
    label: '风险偏好',
    icon: TrendingUp,
    desc: '递增凸函数，边际效用递增，U"(x) > 0',
    formula: 'U(x)=(x/100)²',
    formulaParts: ['U(x) = (x/100)²'],
  },
];

const DEFAULT_P1 = 0.5;
const DEFAULT_P2 = 0.5;
const DEFAULT_A1 = 100;
const DEFAULT_A2 = 0;
const DEFAULT_B1 = 50;
const DEFAULT_B2 = 10;

/* ── animation ── */
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

/* ── SVG Chart constants ── */
const CHART_PADDING = { top: 30, right: 30, bottom: 50, left: 55 };
const CHART_WIDTH = 700;
const CHART_HEIGHT = 340;
const X_MIN = 0;
const X_MAX = 100;
const Y_MIN = 0;
const Y_MAX = 1;

/* ── utility functions (all map [0,100] → [0,1]) ── */
function calcUtility(x: number, riskType: RiskType): number {
  switch (riskType) {
    case 'averse':
      return Math.sqrt(x / 100);
    case 'neutral':
      return x / 100;
    case 'seeking':
      return (x / 100) * (x / 100);
    default:
      return 0;
  }
}

function getStrokeColor(riskType: RiskType): string {
  switch (riskType) {
    case 'averse': return '#1B3A5F';
    case 'neutral': return '#C8963E';
    case 'seeking': return '#4CAF50';
    default: return '#1B3A5F';
  }
}

function getFillColor(riskType: RiskType): string {
  switch (riskType) {
    case 'averse': return 'rgba(43, 65, 98, 0.1)';
    case 'neutral': return 'rgba(201, 158, 90, 0.1)';
    case 'seeking': return 'rgba(74, 140, 111, 0.1)';
    default: return 'rgba(43, 65, 98, 0.1)';
  }
}

export default function UtilityTheory() {
  /* ── state ── */
  const [riskType, setRiskType] = useState<RiskType>('averse');
  const [p1, setP1] = useState(DEFAULT_P1);
  const [p2, setP2] = useState(DEFAULT_P2);
  const [a1, setA1] = useState(DEFAULT_A1);
  const [a2, setA2] = useState(DEFAULT_A2);
  const [b1, setB1] = useState(DEFAULT_B1);
  const [b2, setB2] = useState(DEFAULT_B2);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [accordionOpen, setAccordionOpen] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  /* ── auto-normalize probabilities ── */
  const handleP1Change = useCallback((v: number) => {
    setP1(v);
    setP2(Math.max(0, Math.min(1, 1 - v)));
  }, []);

  const handleP2Change = useCallback((v: number) => {
    setP2(v);
    setP1(Math.max(0, Math.min(1, 1 - v)));
  }, []);

  /* ── calculations ── */
  const uA1 = useMemo(() => calcUtility(a1, riskType), [a1, riskType]);
  const uA2 = useMemo(() => calcUtility(a2, riskType), [a2, riskType]);
  const uB1 = useMemo(() => calcUtility(b1, riskType), [b1, riskType]);
  const uB2 = useMemo(() => calcUtility(b2, riskType), [b2, riskType]);

  const emvA = useMemo(() => p1 * a1 + p2 * a2, [p1, p2, a1, a2]);
  const emvB = useMemo(() => p1 * b1 + p2 * b2, [p1, p2, b1, b2]);
  const euA = useMemo(() => p1 * uA1 + p2 * uA2, [p1, p2, uA1, uA2]);
  const euB = useMemo(() => p1 * uB1 + p2 * uB2, [p1, p2, uB1, uB2]);

  const optimalEU = useMemo(() => {
    if (euA > euB) return { scheme: '方案 A', eu: euA, color: 'text-[#1B3A5F]', bg: 'bg-[#1B3A5F]/15', border: 'border-[#1B3A5F]/30' };
    if (euB > euA) return { scheme: '方案 B', eu: euB, color: 'text-[#C8963E]', bg: 'bg-[#C8963E]/15', border: 'border-[#C8963E]/30' };
    return { scheme: '两者相同', eu: euA, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/15', border: 'border-[#4CAF50]/30' };
  }, [euA, euB]);

  /* ── chart data: all three curves ── */
  const allCurves = useMemo(() => {
    const step = 1;
    const types: RiskType[] = ['averse', 'neutral', 'seeking'];
    return types.map((t) => {
      const pts: { x: number; y: number }[] = [];
      for (let x = X_MIN; x <= X_MAX; x += step) {
        pts.push({ x, y: calcUtility(x, t) });
      }
      return { type: t, points: pts };
    });
  }, []);

  const plotW = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotH = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const xScale = useCallback((x: number) => CHART_PADDING.left + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const yScale = useCallback((y: number) => CHART_PADDING.top + plotH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);

  const buildPath = useCallback((points: { x: number; y: number }[]) => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`).join(' ');
  }, [xScale, yScale]);

  const curvePaths = useMemo(() => {
    return allCurves.map((c) => ({
      type: c.type,
      path: buildPath(c.points),
      color: getStrokeColor(c.type),
      fill: getFillColor(c.type),
    }));
  }, [allCurves, buildPath]);

  /* ── hover handling ── */
  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * CHART_WIDTH;
    const plotX = svgX - CHART_PADDING.left;
    const frac = Math.max(0, Math.min(1, plotX / plotW));
    const xVal = X_MIN + frac * (X_MAX - X_MIN);
    setHoverX(Math.round(xVal));
  }, [plotW]);

  const handleSvgMouseLeave = useCallback(() => setHoverX(null), []);

  /* hover values are computed inline in SVG via calcUtility */

  /* ── scatter points for data ── */
  const dataPoints = useMemo(() => {
    return [
      { x: a1, label: 'a₁' },
      { x: a2, label: 'a₂' },
      { x: b1, label: 'b₁' },
      { x: b2, label: 'b₂' },
    ];
  }, [a1, a2, b1, b2]);

  /* ── reset ── */
  const handleReset = useCallback(() => {
    setRiskType('averse');
    setP1(DEFAULT_P1);
    setP2(DEFAULT_P2);
    setA1(DEFAULT_A1);
    setA2(DEFAULT_A2);
    setB1(DEFAULT_B1);
    setB2(DEFAULT_B2);
  }, []);

  const numInput = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setter(isNaN(v) ? 0 : v);
  };

  const currentRisk = RISK_OPTIONS.find((r) => r.key === riskType)!;
  const strokeColor = getStrokeColor(riskType);

  /* ── EMV vs EU comparison data ── */
  const comparisonData = useMemo(() => {
    const rows = [
      { scheme: '方案 A', emv: emvA, eu: euA, schemeColor: 'text-[#1B3A5F]' },
      { scheme: '方案 B', emv: emvB, eu: euB, schemeColor: 'text-[#C8963E]' },
    ];
    const emvEqual = Math.abs(emvA - emvB) < 0.001;
    const sortedByEU = [...rows].sort((a, b) => b.eu - a.eu);
    return rows.map((r) => ({
      ...r,
      emvRank: emvEqual ? '=' : (r.emv === Math.max(emvA, emvB) ? 1 : 2),
      euRank: sortedByEU.findIndex((s) => s.scheme === r.scheme) + 1,
      isOptimalEU: r.scheme === optimalEU.scheme,
    }));
  }, [emvA, emvB, euA, euB, optimalEU]);

  return (
    <div className="space-y-5">
      {/* ── Section Header ── */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5"
      >
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-[22px] h-[22px] text-[#C8963E]" />
            <h2 className="text-[22px] font-bold text-[#2B2B2B]">效用理论</h2>
          </div>
          <p className="text-[13px] text-[#6B6B6B] mt-1">
            基于效用函数的期望效用决策，分析风险偏好对决策的影响
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:bg-[#F0EDE8] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          重置数据
        </button>
      </motion.div>

      {/* ── Risk Preference Type Selector ── */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <label className="text-sm font-medium text-[#2B2B2B] mb-3 block">选择风险偏好类型</label>

        <div className="bg-[#F0EDE8] rounded-xl p-1 flex">
          {RISK_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = riskType === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setRiskType(opt.key)}
                className={
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ' +
                  (isActive
                    ? 'bg-white shadow-sm text-[#1B3A5F] font-bold'
                    : 'text-[#6B6B6B] hover:bg-white/50')
                }
              >
                <Icon className="w-4 h-4" />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Description + Formula */}
        <div className="mt-4 bg-white rounded-lg border border-[#E0DDD5] p-3">
          <p className="text-sm text-[#6B6B6B] mb-1">{currentRisk.desc}</p>
          <div className="font-mono text-sm text-[#1B3A5F] bg-[#F0EDE8] rounded-lg p-2 border border-[#E0DDD5]">
            {currentRisk.formulaParts.map((part, i) => (
              <p key={i}>{part}</p>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── SVG Utility Curve Chart ── */}
      <motion.div
        custom={2}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <h3 className="text-[17px] font-semibold text-[#2B2B2B] mb-1">
          效用曲线 U(x)
          <span className="text-sm font-normal text-[#6B6B6B] ml-2">
            — {currentRisk.label}
          </span>
        </h3>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-auto select-none"
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
        >
          {/* Grid lines - vertical */}
          {[0, 20, 40, 60, 80, 100].map((x) => (
            <line key={`gv${x}`} x1={xScale(x)} y1={CHART_PADDING.top} x2={xScale(x)} y2={CHART_PADDING.top + plotH}
              stroke="#E0DDD5" strokeWidth={1} strokeDasharray="3,3" opacity={0.4} />
          ))}
          {/* Grid lines - horizontal */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((v) => (
            <line key={`gh${v}`} x1={CHART_PADDING.left} y1={yScale(v)} x2={CHART_PADDING.left + plotW} y2={yScale(v)}
              stroke="#E0DDD5" strokeWidth={1} strokeDasharray="3,3" opacity={0.4} />
          ))}

          {/* Axes */}
          <line x1={CHART_PADDING.left} y1={CHART_PADDING.top + plotH}
            x2={CHART_PADDING.left + plotW} y2={CHART_PADDING.top + plotH}
            stroke="#2B2B2B" strokeWidth={1.5} />
          <line x1={CHART_PADDING.left} y1={CHART_PADDING.top}
            x2={CHART_PADDING.left} y2={CHART_PADDING.top + plotH}
            stroke="#2B2B2B" strokeWidth={1.5} />

          {/* X-axis labels */}
          {[0, 20, 40, 60, 80, 100].map((x) => (
            <text key={`xl${x}`} x={xScale(x)} y={CHART_PADDING.top + plotH + 16}
              textAnchor="middle" fontSize={11} fill="#6B6B6B">
              {x}
            </text>
          ))}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((v) => (
            <text key={`yl${v}`} x={CHART_PADDING.left - 8} y={yScale(v) + 4}
              textAnchor="end" fontSize={11} fill="#6B6B6B">
              {v.toFixed(2)}
            </text>
          ))}

          {/* Axis titles */}
          <text x={CHART_PADDING.left + plotW / 2} y={CHART_PADDING.top + plotH + 36}
            textAnchor="middle" fontSize={12} fill="#2B2B2B" fontWeight={600}>
            收益值 x
          </text>
          <text x={16} y={CHART_PADDING.top + plotH / 2}
            textAnchor="middle" fontSize={12} fill="#2B2B2B" fontWeight={600}
            transform={`rotate(-90, 16, ${CHART_PADDING.top + plotH / 2})`}>
            效用值 U(x)
          </text>

          {/* Corner label (0,0) */}
          <text x={xScale(0) - 6} y={yScale(0) + 14} fontSize={10} fill="#6B6B6B" textAnchor="end">0</text>

          {/* Three curves: averse (bottom fill), neutral, seeking */}
          {/* Fill area for averse (topmost curve) */}
          <path d={`${curvePaths.find(c => c.type === 'averse')?.path} L ${xScale(X_MAX)} ${yScale(Y_MIN)} L ${xScale(X_MIN)} ${yScale(Y_MIN)} Z`}
            fill="rgba(43, 65, 98, 0.06)" />
          {/* Fill area for seeking (bottom curve) */}
          <path d={`${curvePaths.find(c => c.type === 'seeking')?.path} L ${xScale(X_MAX)} ${yScale(Y_MIN)} L ${xScale(X_MIN)} ${yScale(Y_MIN)} Z`}
            fill="rgba(74, 140, 111, 0.06)" />

          {/* Curve lines - all three */}
          {curvePaths.map((c) => (
            <path key={c.type} d={c.path} fill="none" stroke={c.color} strokeWidth={c.type === 'neutral' ? 2 : 2.5}
              strokeLinejoin="round" strokeDasharray={c.type === 'neutral' ? '6,3' : 'none'} />
          ))}

          {/* Data points for current risk type */}
          {dataPoints.filter(pt => pt.x >= X_MIN && pt.x <= X_MAX).map((pt) => {
            const y = calcUtility(pt.x, riskType);
            return (
              <circle
                key={pt.label}
                cx={xScale(pt.x)}
                cy={yScale(y)}
                r={4}
                fill={strokeColor}
                stroke="white"
                strokeWidth={2}
              />
            );
          })}

          {/* Hover: vertical line + three values */}
          {hoverX !== null && hoverX >= X_MIN && hoverX <= X_MAX && (
            <g>
              <line x1={xScale(hoverX)} y1={CHART_PADDING.top}
                x2={xScale(hoverX)} y2={CHART_PADDING.top + plotH}
                stroke="#9E9E9E" strokeWidth={1} opacity={0.5} strokeDasharray="4,2" />
              {/* Dots on all three curves */}
              {(['averse', 'neutral', 'seeking'] as RiskType[]).map((t) => (
                <circle key={t} cx={xScale(hoverX)} cy={yScale(calcUtility(hoverX, t))}
                  r={3.5} fill={getStrokeColor(t)} stroke="white" strokeWidth={1.5} />
              ))}
              {/* Tooltip */}
              <rect x={Math.min(xScale(hoverX) + 10, CHART_WIDTH - 175)} y={CHART_PADDING.top + 6}
                width={165} height={58} rx={6} fill="white" stroke="#E0DDD5" strokeWidth={1} />
              <text x={Math.min(xScale(hoverX) + 16, CHART_WIDTH - 169)} y={CHART_PADDING.top + 22}
                fontSize={11} fill="#2B2B2B" fontWeight={600}>
                收益 x = {hoverX}
              </text>
              <text x={Math.min(xScale(hoverX) + 16, CHART_WIDTH - 169)} y={CHART_PADDING.top + 37}
                fontSize={10} fill="#1B3A5F">
                厌恶 U={calcUtility(hoverX, 'averse').toFixed(3)} 中性 U={calcUtility(hoverX, 'neutral').toFixed(3)}
              </text>
              <text x={Math.min(xScale(hoverX) + 16, CHART_WIDTH - 169)} y={CHART_PADDING.top + 52}
                fontSize={10} fill="#4CAF50">
                偏好 U={calcUtility(hoverX, 'seeking').toFixed(3)}
              </text>
            </g>
          )}
        </svg>

        {/* Legend: three curves with U'' notation */}
        <div className="flex items-center justify-center gap-5 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[2.5px] rounded-full" style={{backgroundColor: '#1B3A5F'}} />
            <span className="text-xs text-[#2B2B2B]">风险厌恶 (凹, U&quot;(x) {'<'} 0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[2px] bg-[#C8963E]" style={{borderTop: '2px dashed #C8963E', height: 0}} />
            <span className="text-xs text-[#2B2B2B]">风险中性 (直线, U&quot;(x) = 0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[2.5px] rounded-full" style={{backgroundColor: '#4CAF50'}} />
            <span className="text-xs text-[#2B2B2B]">风险偏好 (凸, U&quot;(x) {'>'} 0)</span>
          </div>
        </div>
      </motion.div>

      {/* ── Editable Decision Matrix ── */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <h3 className="text-[17px] font-semibold text-[#2B2B2B] mb-1">决策矩阵</h3>
        <p className="text-[13px] text-[#6B6B6B] mb-4">输入各方案在不同状态下的收益值及状态概率</p>

        {/* Probability inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-[#6B6B6B] mb-1">状态1概率 P₁</label>
            <input
              type="number"
              value={p1}
              onChange={(e) => handleP1Change(parseFloat(e.target.value) || 0)}
              step={0.1}
              min={0}
              max={1}
              className="w-full h-9 px-3 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium focus:border-[#2A4A73] focus:ring-2 focus:ring-[#1B3A5F]/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6B6B6B] mb-1">
              状态2概率 P₂ <span className="text-[#9E9E9E] text-[11px]">(自动计算)</span>
            </label>
            <input
              type="number"
              value={p2}
              onChange={(e) => handleP2Change(parseFloat(e.target.value) || 0)}
              step={0.1}
              min={0}
              max={1}
              className="w-full h-9 px-3 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium focus:border-[#2A4A73] focus:ring-2 focus:ring-[#1B3A5F]/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Scheme A input group */}
        <div className="border border-[#E0DDD5] rounded-lg p-4 mb-3 border-l-[3px] border-l-[#1B3A5F]">
          <p className="text-sm font-semibold text-[#1B3A5F] mb-3">方案 A</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#6B6B6B] mb-1">状态1收益</label>
              <input
                type="number"
                value={a1}
                onChange={numInput(setA1)}
                className="w-full h-9 px-3 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium focus:border-[#2A4A73] focus:ring-2 focus:ring-[#1B3A5F]/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6B6B6B] mb-1">状态2收益</label>
              <input
                type="number"
                value={a2}
                onChange={numInput(setA2)}
                className="w-full h-9 px-3 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium focus:border-[#2A4A73] focus:ring-2 focus:ring-[#1B3A5F]/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Scheme B input group */}
        <div className="border border-[#E0DDD5] rounded-lg p-4 border-l-[3px] border-l-[#C8963E]">
          <p className="text-sm font-semibold text-[#C8963E] mb-3">方案 B</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#6B6B6B] mb-1">状态1收益</label>
              <input
                type="number"
                value={b1}
                onChange={numInput(setB1)}
                className="w-full h-9 px-3 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium focus:border-[#2A4A73] focus:ring-2 focus:ring-[#1B3A5F]/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6B6B6B] mb-1">状态2收益</label>
              <input
                type="number"
                value={b2}
                onChange={numInput(setB2)}
                className="w-full h-9 px-3 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium focus:border-[#2A4A73] focus:ring-2 focus:ring-[#1B3A5F]/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Scheme Analysis Cards ── */}
      <motion.div
        custom={4}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* 方案A Analysis */}
        <div className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5 border-l-[3px] border-l-[#1B3A5F]">
          <h3 className="text-[15px] font-semibold text-[#1B3A5F] mb-3">方案 A 分析</h3>
          <div className="space-y-1.5 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">状态1效用 U({a1}):</span>
              <span className="font-bold text-[#2B2B2B]">{uA1.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">状态2效用 U({a2}):</span>
              <span className="font-bold text-[#2B2B2B]">{uA2.toFixed(4)}</span>
            </div>
            <div className="border-t border-[#E0DDD5] my-2 pt-2" />
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">期望收益 EMV(A):</span>
              <span className="font-medium text-[#2B2B2B]">{emvA.toFixed(2)}</span>
            </div>
            <div className="text-[#6B6B6B] text-xs mt-2">
              EU(A) = {p1.toFixed(1)} × {uA1.toFixed(4)} + {p2.toFixed(1)} × {uA2.toFixed(4)}
            </div>
            <div className="mt-1">
              <span className="text-[#6B6B6B] text-xs">期望效用 EU(A) = </span>
              <span className="text-xl font-bold text-[#1B3A5F]">{euA.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* 方案B Analysis */}
        <div className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5 border-l-[3px] border-l-[#C8963E]">
          <h3 className="text-[15px] font-semibold text-[#C8963E] mb-3">方案 B 分析</h3>
          <div className="space-y-1.5 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">状态1效用 U({b1}):</span>
              <span className="font-bold text-[#2B2B2B]">{uB1.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">状态2效用 U({b2}):</span>
              <span className="font-bold text-[#2B2B2B]">{uB2.toFixed(4)}</span>
            </div>
            <div className="border-t border-[#E0DDD5] my-2 pt-2" />
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">期望收益 EMV(B):</span>
              <span className="font-medium text-[#2B2B2B]">{emvB.toFixed(2)}</span>
            </div>
            <div className="text-[#6B6B6B] text-xs mt-2">
              EU(B) = {p1.toFixed(1)} × {uB1.toFixed(4)} + {p2.toFixed(1)} × {uB2.toFixed(4)}
            </div>
            <div className="mt-1">
              <span className="text-[#6B6B6B] text-xs">期望效用 EU(B) = </span>
              <span className="text-xl font-bold text-[#C8963E]">{euB.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Optimal Decision Conclusion ── */}
      <motion.div
        custom={5}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="flex justify-center py-3"
      >
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-sm text-[#2B2B2B]">基于期望效用的最优方案：</span>
          <span className={`inline-flex items-center px-4 py-1.5 rounded-full font-bold text-sm ${optimalEU.bg} ${optimalEU.color} border ${optimalEU.border}`}>
            {optimalEU.scheme}
          </span>
          <span className="text-sm text-[#6B6B6B]">
            EU({optimalEU.scheme}) = {optimalEU.eu.toFixed(4)}
          </span>
        </div>
      </motion.div>

      {/* ── EMV vs EU Comparison Table ── */}
      <motion.div
        custom={6}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <h3 className="text-[17px] font-semibold text-[#2B2B2B] mb-4">期望收益 vs 期望效用 对比</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1B3A5F] text-white h-11">
                <th className="px-4 py-2.5 text-left font-semibold rounded-tl-xl">方案</th>
                <th className="px-4 py-2.5 text-center font-semibold">EMV (期望收益)</th>
                <th className="px-4 py-2.5 text-center font-semibold">EU (期望效用)</th>
                <th className="px-4 py-2.5 text-center font-semibold">EMV 排序</th>
                <th className="px-4 py-2.5 text-center font-semibold rounded-tr-xl">EU 排序</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, idx) => (
                <tr
                  key={row.scheme}
                  className={
                    'h-12 border-b border-[#EFEBE5] ' +
                    (row.isOptimalEU ? 'bg-[#E8F5E9]/30 animate-breathe' : idx % 2 === 1 ? 'bg-[#F0EDE8]' : 'bg-white')
                  }
                >
                  <td className={`px-4 py-3 font-medium ${row.scheme === '方案 A' ? 'text-[#1B3A5F]' : 'text-[#C8963E]'}`}>
                    {row.scheme}
                  </td>
                  <td className="px-4 py-3 text-center font-mono">{row.emv.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center font-mono">{row.eu.toFixed(4)}</td>
                  <td className="px-4 py-3 text-center font-mono">{row.emvRank}</td>
                  <td className="px-4 py-3 text-center font-mono">
                    <span className={row.euRank === 1 ? 'text-[#4CAF50] font-bold' : ''}>
                      {row.euRank}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Utility Theory Concept Accordion ── */}
      <motion.div
        custom={7}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#1B3A5F]/[0.03] border border-[#1B3A5F]/10 rounded-xl"
      >
        <button
          onClick={() => setAccordionOpen(!accordionOpen)}
          className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C8963E]" />
            <h3 className="text-[15px] font-semibold text-[#2B2B2B]">效用理论与风险偏好</h3>
          </div>
          <svg
            className={`w-5 h-5 text-[#6B6B6B] transition-transform duration-300 ${accordionOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <motion.div
          initial={false}
          animate={{
            height: accordionOpen ? 'auto' : 0,
            opacity: accordionOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="px-5 pb-5 space-y-3">
            <p className="text-sm text-[#2B2B2B] leading-relaxed">
              <strong>效用</strong>是决策者对收益的主观价值评价。效用理论通过效用函数将货币收益转化为效用值，再计算期望效用(EU)进行决策。
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-[#E0DDD5] rounded-lg">
                <thead>
                  <tr className="bg-[#F0EDE8]">
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#E0DDD5]">类型</th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#E0DDD5]">曲线形状</th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#E0DDD5]">特点</th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-[#E0DDD5]">公式示例</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#EFEBE5]">
                    <td className="px-3 py-2 font-medium">风险厌恶</td>
                    <td className="px-3 py-2">凹形</td>
                    <td className="px-3 py-2">效用增长慢于收益增长，偏好确定性收益</td>
                    <td className="px-3 py-2 font-mono text-xs">U(x)=√x</td>
                  </tr>
                  <tr className="border-b border-[#EFEBE5]">
                    <td className="px-3 py-2 font-medium">风险中性</td>
                    <td className="px-3 py-2">直线</td>
                    <td className="px-3 py-2">效用与收益成正比，按期望值最大化决策</td>
                    <td className="px-3 py-2 font-mono text-xs">U(x)=x/100</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">风险偏好</td>
                    <td className="px-3 py-2">凸形</td>
                    <td className="px-3 py-2">效用增长快于收益增长，愿意承担风险</td>
                    <td className="px-3 py-2 font-mono text-xs">U(x)=x²/10000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-[#6B6B6B] italic">
              同一决策问题，不同风险偏好类型的决策者可能做出不同选择。当 EMV 排序与 EU 排序不一致时，说明决策者的风险偏好影响了最终决策。
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
