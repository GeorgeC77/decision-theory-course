import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  SlidersHorizontal,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  Info,
} from 'lucide-react';

/* ── default data ── */
const DEFAULT_A1 = 7;
const DEFAULT_A2 = -3;
const DEFAULT_B1 = 10;
const DEFAULT_B2 = -5;
const DEFAULT_P = 0.5;

/* ── animations ── */
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
const CHART_PADDING = { top: 30, right: 30, bottom: 45, left: 55 };
const CHART_WIDTH = 700;
const CHART_HEIGHT = 280;

export default function SensitivityAnalysis() {
  /* ── state ── */
  const [a1, setA1] = useState(DEFAULT_A1);
  const [a2, setA2] = useState(DEFAULT_A2);
  const [b1, setB1] = useState(DEFAULT_B1);
  const [b2, setB2] = useState(DEFAULT_B2);
  const [prob, setProb] = useState(DEFAULT_P);
  const [hoverP, setHoverP] = useState<number | null>(null);
  const [lineAnimated, setLineAnimated] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLineAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  /* ── calculations ── */
  const eA = useMemo(() => prob * a1 + (1 - prob) * a2, [prob, a1, a2]);
  const eB = useMemo(() => prob * b1 + (1 - prob) * b2, [prob, b1, b2]);

  const pStar = useMemo(() => {
    const denom = (a1 - a2) - (b1 - b2);
    if (Math.abs(denom) < 1e-10) return null;
    const val = (b2 - a2) / denom;
    if (val < 0 || val > 1) return null;
    return val;
  }, [a1, a2, b1, b2]);

  const optimal = useMemo(() => {
    if (eA > eB) return { scheme: '方案A', ev: eA, color: 'text-[#1B3A5F]', bg: 'bg-[#1B3A5F]/15', border: 'border-[#1B3A5F]/30' };
    if (eB > eA) return { scheme: '方案B', ev: eB, color: 'text-[#C8963E]', bg: 'bg-[#C8963E]/15', border: 'border-[#C8963E]/30' };
    return { scheme: '两者相同', ev: eA, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/15', border: 'border-[#4CAF50]/30' };
  }, [eA, eB]);

  /* ── dynamic decision rule around p* ── */
  const decisionRule = useMemo(() => {
    if (pStar === null) {
      const evAt0A = a2;
      const evAt0B = b2;
      const evAt1A = a1;
      const evAt1B = b1;
      const leftBetter = evAt0A > evAt0B ? 'A' : evAt0B > evAt0A ? 'B' : '相同';
      const rightBetter = evAt1A > evAt1B ? 'A' : evAt1B > evAt1A ? 'B' : '相同';
      return { leftBetter, rightBetter, pStar: null };
    }
    const pLeft = Math.max(0, pStar - 0.01);
    const pRight = Math.min(1, pStar + 0.01);
    const evLeftA = pLeft * a1 + (1 - pLeft) * a2;
    const evLeftB = pLeft * b1 + (1 - pLeft) * b2;
    const evRightA = pRight * a1 + (1 - pRight) * a2;
    const evRightB = pRight * b1 + (1 - pRight) * b2;
    const leftBetter = evLeftA > evLeftB ? 'A' : evLeftB > evLeftA ? 'B' : '相同';
    const rightBetter = evRightA > evRightB ? 'A' : evRightB > evRightA ? 'B' : '相同';
    return { leftBetter, rightBetter, pStar };
  }, [pStar, a1, a2, b1, b2]);

  /* ── chart data ── */
  const chartData = useMemo(() => {
    const points: { p: number; eA: number; eB: number }[] = [];
    for (let i = 0; i <= 100; i++) {
      const p = i / 100;
      points.push({ p, eA: p * a1 + (1 - p) * a2, eB: p * b1 + (1 - p) * b2 });
    }
    return points;
  }, [a1, a2, b1, b2]);

  const yMin = useMemo(() => {
    const allVals = chartData.flatMap((d) => [d.eA, d.eB]);
    return Math.floor(Math.min(...allVals) - 1);
  }, [chartData]);

  const yMax = useMemo(() => {
    const allVals = chartData.flatMap((d) => [d.eA, d.eB]);
    return Math.ceil(Math.max(...allVals) + 1);
  }, [chartData]);

  const plotW = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotH = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const xScale = useCallback((p: number) => CHART_PADDING.left + p * plotW, [plotW]);
  const yScale = useCallback((v: number) => CHART_PADDING.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH, [plotH, yMin, yMax]);

  const eALine = useMemo(() =>
    chartData.map((d) => `${xScale(d.p)},${yScale(d.eA)}`).join(' '),
    [chartData, xScale, yScale]
  );
  const eBLine = useMemo(() =>
    chartData.map((d) => `${xScale(d.p)},${yScale(d.eB)}`).join(' '),
    [chartData, xScale, yScale]
  );

  /* ── tooltip handling ── */
  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * CHART_WIDTH;
    const plotX = svgX - CHART_PADDING.left;
    const p = Math.max(0, Math.min(1, plotX / plotW));
    const snapP = Math.round(p * 100) / 100;
    setHoverP(snapP);
  }, [plotW]);

  const handleSvgMouseLeave = useCallback(() => {
    setHoverP(null);
  }, []);

  const hoverEA = hoverP !== null ? hoverP * a1 + (1 - hoverP) * a2 : null;
  const hoverEB = hoverP !== null ? hoverP * b1 + (1 - hoverP) * b2 : null;

  /* ── reset ── */
  const handleReset = useCallback(() => {
    setA1(DEFAULT_A1);
    setA2(DEFAULT_A2);
    setB1(DEFAULT_B1);
    setB2(DEFAULT_B2);
    setProb(DEFAULT_P);
    setLineAnimated(false);
    setTimeout(() => setLineAnimated(true), 50);
  }, []);

  /* ── number input handler ── */
  const numInput = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setter(isNaN(v) ? 0 : v);
  };

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
            <SlidersHorizontal className="w-[22px] h-[22px] text-[#C8963E]" />
            <h2 className="text-[22px] font-bold text-[#2B2B2B]">灵敏度分析</h2>
          </div>
          <p className="text-[13px] text-[#6B6B6B] mt-1">
            分析概率变化对决策结果的影响，求解转折概率
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

      {/* ── Scheme A & B Parameter Cards ── */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* 方案A */}
        <div className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5 border-t-[3px] border-t-[#1B3A5F]">
          <h3 className="text-lg font-bold text-[#2B2B2B] mb-1">方案 A</h3>
          <p className="text-sm text-[#1B3A5F] font-bold mb-4">
            当前 E(A) = <span className="text-[#1B3A5F] font-extrabold">{eA.toFixed(2)}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#6B6B6B] mb-1">销路好收益 a₁</label>
              <input
                type="number"
                value={a1}
                onChange={numInput(setA1)}
                className="w-full h-9 px-3 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium focus:border-[#2A4A73] focus:ring-2 focus:ring-[#1B3A5F]/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6B6B6B] mb-1">销路差收益 a₂</label>
              <input
                type="number"
                value={a2}
                onChange={numInput(setA2)}
                className="w-full h-9 px-3 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium focus:border-[#2A4A73] focus:ring-2 focus:ring-[#1B3A5F]/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* 方案B */}
        <div className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5 border-t-[3px] border-t-[#C8963E]">
          <h3 className="text-lg font-bold text-[#C8963E] mb-1">方案 B</h3>
          <p className="text-sm text-[#C8963E] font-bold mb-4">
            当前 E(B) = <span className="text-[#C8963E] font-extrabold">{eB.toFixed(2)}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#6B6B6B] mb-1">销路好收益 b₁</label>
              <input
                type="number"
                value={b1}
                onChange={numInput(setB1)}
                className="w-full h-9 px-3 border border-[#E0DDD5] rounded-lg text-center text-sm font-medium focus:border-[#2A4A73] focus:ring-2 focus:ring-[#1B3A5F]/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6B6B6B] mb-1">销路差收益 b₂</label>
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

      {/* ── Probability Slider ── */}
      <motion.div
        custom={2}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[#2B2B2B]">销路好概率 P(好)</label>
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#1B3A5F]/10 text-[#1B3A5F] font-bold text-sm">
            {(prob * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(prob * 100)}
          onChange={(e) => setProb(parseInt(e.target.value, 10) / 100)}
          className="w-full h-2 bg-[#E0DDD5] rounded-full appearance-none cursor-pointer accent-[#1B3A5F]
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#1B3A5F] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:w-6 [&::-webkit-slider-thumb]:hover:h-6
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#1B3A5F] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:w-6 [&::-moz-range-thumb]:hover:h-6"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(prob * 100)}
        />
        <div className="flex justify-between mt-1">
          {['0%', '25%', '50%', '75%', '100%'].map((t) => (
            <span key={t} className="text-[11px] text-[#9E9E9E]">{t}</span>
          ))}
        </div>
      </motion.div>

      {/* ── Optimal Decision Conclusion ── */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="flex justify-center py-3"
      >
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-sm text-[#2B2B2B]">当前最优方案：</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${optimal.bg} ${optimal.color} border ${optimal.border}`}>
            {optimal.scheme}
          </span>
          <span className="text-sm text-[#6B6B6B]">
            (E({optimal.scheme.replace('方案', '方案')}) = {optimal.ev.toFixed(2)})
          </span>
        </div>
      </motion.div>

      {/* ── SVG Sensitivity Chart ── */}
      <motion.div
        custom={4}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-[#E0DDD5] shadow-sm p-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-[#C8963E]" />
          <h3 className="text-[17px] font-semibold text-[#2B2B2B]">灵敏度分析图</h3>
        </div>
        <p className="text-[13px] text-[#6B6B6B] mb-4">两条期望收益线的交点即为转折概率</p>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-auto select-none"
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
        >
          {/* Grid lines */}
          {Array.from({ length: 11 }, (_, i) => {
            const p = i / 10;
            const x = xScale(p);
            return (
              <line key={`gv${i}`} x1={x} y1={CHART_PADDING.top} x2={x} y2={CHART_PADDING.top + plotH}
                stroke="#E0DDD5" strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
            );
          })}
          {Array.from({ length: 5 }, (_, i) => {
            const v = yMin + (i / 4) * (yMax - yMin);
            const y = yScale(v);
            return (
              <line key={`gh${i}`} x1={CHART_PADDING.left} y1={y} x2={CHART_PADDING.left + plotW} y2={y}
                stroke="#E0DDD5" strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
            );
          })}

          {/* Axes */}
          <line x1={CHART_PADDING.left} y1={CHART_PADDING.top + plotH}
            x2={CHART_PADDING.left + plotW} y2={CHART_PADDING.top + plotH}
            stroke="#2B2B2B" strokeWidth={1.5} />
          <line x1={CHART_PADDING.left} y1={CHART_PADDING.top}
            x2={CHART_PADDING.left} y2={CHART_PADDING.top + plotH}
            stroke="#2B2B2B" strokeWidth={1.5} />

          {/* X-axis labels */}
          {Array.from({ length: 11 }, (_, i) => {
            const p = i / 10;
            return (
              <text key={`xl${i}`} x={xScale(p)} y={CHART_PADDING.top + plotH + 18}
                textAnchor="middle" fontSize={11} fill="#6B6B6B">
                {(p * 100).toFixed(0)}%
              </text>
            );
          })}

          {/* Y-axis labels */}
          {Array.from({ length: 5 }, (_, i) => {
            const v = yMin + (i / 4) * (yMax - yMin);
            return (
              <text key={`yl${i}`} x={CHART_PADDING.left - 8} y={yScale(v) + 4}
                textAnchor="end" fontSize={11} fill="#6B6B6B">
                {v.toFixed(0)}
              </text>
            );
          })}

          {/* Axis titles */}
          <text x={CHART_PADDING.left + plotW / 2} y={CHART_HEIGHT - 2}
            textAnchor="middle" fontSize={12} fill="#2B2B2B" fontWeight={600}>
            P(销路好)
          </text>
          <text x={14} y={CHART_PADDING.top + plotH / 2}
            textAnchor="middle" fontSize={12} fill="#2B2B2B" fontWeight={600}
            transform={`rotate(-90, 14, ${CHART_PADDING.top + plotH / 2})`}>
            期望收益
          </text>

          {/* E(A) line */}
          <polyline
            points={eALine}
            fill="none"
            stroke="#1B3A5F"
            strokeWidth={2.5}
            strokeDasharray={lineAnimated ? undefined : `${plotW * 1.5}`}
            strokeDashoffset={lineAnimated ? 0 : `${plotW * 1.5}`}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />

          {/* E(B) line */}
          <polyline
            points={eBLine}
            fill="none"
            stroke="#C8963E"
            strokeWidth={2.5}
            strokeDasharray={lineAnimated ? undefined : `${plotW * 1.5}`}
            strokeDashoffset={lineAnimated ? 0 : `${plotW * 1.5}`}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out 0.15s' }}
          />

          {/* Circle and diamond markers every 10% */}
          {Array.from({ length: 11 }, (_, i) => {
            const p = i / 10;
            const evA = p * a1 + (1 - p) * a2;
            const evB = p * b1 + (1 - p) * b2;
            return (
              <g key={`m${i}`}>
                <circle cx={xScale(p)} cy={yScale(evA)} r={3} fill="#1B3A5F" stroke="white" strokeWidth={1.5} />
                <rect
                  x={xScale(p) - 3} y={yScale(evB) - 3}
                  width={6} height={6}
                  fill="#C8963E" stroke="white" strokeWidth={1.5}
                  transform={`rotate(45, ${xScale(p)}, ${yScale(evB)})`}
                />
              </g>
            );
          })}

          {/* Intersection point */}
          {pStar !== null && (
            <g>
              <line x1={xScale(pStar)} y1={yScale(pStar * a1 + (1 - pStar) * a2)}
                x2={xScale(pStar)} y2={CHART_PADDING.top + plotH}
                stroke="#C8963E" strokeWidth={1.5} strokeDasharray="4,3" />
              <circle cx={xScale(pStar)} cy={yScale(pStar * a1 + (1 - pStar) * a2)}
                r={6} fill="#C8963E" stroke="white" strokeWidth={2} />
              <text x={xScale(pStar)} y={CHART_PADDING.top + plotH + 32}
                textAnchor="middle" fontSize={12} fill="#C8963E" fontWeight={700}>
                p* = {(pStar * 100).toFixed(0)}%
              </text>
            </g>
          )}

          {/* Current probability indicator */}
          <g>
            <line x1={xScale(prob)} y1={CHART_PADDING.top}
              x2={xScale(prob)} y2={CHART_PADDING.top + plotH}
              stroke="#4CAF50" strokeWidth={1.5} strokeDasharray="5,3" />
            {/* Intersection markers on both lines */}
            <line x1={xScale(prob) - 6} y1={yScale(eA)} x2={xScale(prob) + 6} y2={yScale(eA)}
              stroke="#1B3A5F" strokeWidth={2} />
            <line x1={xScale(prob) - 6} y1={yScale(eB)} x2={xScale(prob) + 6} y2={yScale(eB)}
              stroke="#C8963E" strokeWidth={2} />
            <text x={xScale(prob)} y={CHART_PADDING.top - 6}
              textAnchor="middle" fontSize={11} fill="#4CAF50" fontWeight={600}>
              当前 P={(prob * 100).toFixed(0)}%
            </text>
          </g>

          {/* Hover tooltip */}
          {hoverP !== null && hoverEA !== null && hoverEB !== null && (
            <g>
              <line x1={xScale(hoverP)} y1={CHART_PADDING.top}
                x2={xScale(hoverP)} y2={CHART_PADDING.top + plotH}
                stroke="#9E9E9E" strokeWidth={1} opacity={0.5} />
              {/* Tooltip box */}
              <rect x={Math.min(xScale(hoverP) + 8, CHART_WIDTH - 140)} y={CHART_PADDING.top + 8}
                width={125} height={50} rx={6} fill="white" stroke="#E0DDD5" strokeWidth={1} />
              <text x={Math.min(xScale(hoverP) + 14, CHART_WIDTH - 134)} y={CHART_PADDING.top + 25}
                fontSize={11} fill="#2B2B2B" fontWeight={600}>
                P = {(hoverP * 100).toFixed(0)}%
              </text>
              <text x={Math.min(xScale(hoverP) + 14, CHART_WIDTH - 134)} y={CHART_PADDING.top + 38}
                fontSize={10} fill="#1B3A5F">
                E(A) = {hoverEA.toFixed(2)}
              </text>
              <text x={Math.min(xScale(hoverP) + 75, CHART_WIDTH - 73)} y={CHART_PADDING.top + 38}
                fontSize={10} fill="#C8963E">
                E(B) = {hoverEB.toFixed(2)}
              </text>
            </g>
          )}
        </svg>

        {/* Legend below chart */}
        <div className="flex items-center justify-center gap-6 mt-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-[2px] bg-[#1B3A5F]" />
              <div className="w-2 h-2 rounded-full bg-[#1B3A5F]" />
            </div>
            <span className="text-xs text-[#2B2B2B]">E(A)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-[2px] bg-[#C8963E]" />
              <div className="w-2 h-2 bg-[#C8963E] rotate-45" />
            </div>
            <span className="text-xs text-[#2B2B2B]">E(B)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-[2px] bg-[#4CAF50] border-dashed" style={{borderTop: '2px dashed #4CAF50'}} />
            <span className="text-xs text-[#2B2B2B]">当前 P</span>
          </div>
        </div>
      </motion.div>

      {/* ── Break-Even Probability Analysis Card ── */}
      <motion.div
        custom={5}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#F5EDE0]/40 rounded-xl border border-[#C8963E]/20 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-[#C8963E]" />
          <h3 className="text-[17px] font-semibold text-[#2B2B2B]">转折概率分析</h3>
        </div>

        <div className="text-center mb-4">
          <p className="text-sm text-[#6B6B6B] mb-1">转折概率</p>
          <p className="text-2xl font-bold text-[#C8963E]">
            p* = {pStar !== null ? pStar.toFixed(4) : '—'} {pStar !== null && `(${(pStar * 100).toFixed(2)}%)`}
          </p>
        </div>

        {/* Decision rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-lg border border-[#E0DDD5] p-3 text-center">
            <p className="text-sm text-[#6B6B6B]">
              P(好) {'<'} <span className="font-bold text-[#C8963E]">{decisionRule.pStar !== null ? (decisionRule.pStar * 100).toFixed(2) : '—'}%</span>
            </p>
            <p className="text-sm font-bold mt-1" style={{ color: decisionRule.leftBetter === 'A' ? '#1B3A5F' : decisionRule.leftBetter === 'B' ? '#C8963E' : '#4CAF50' }}>
              选 方案{decisionRule.leftBetter === '相同' ? '均可' : decisionRule.leftBetter}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-[#E0DDD5] p-3 text-center">
            <p className="text-sm text-[#6B6B6B]">
              P(好) {'>'} <span className="font-bold text-[#C8963E]">{decisionRule.pStar !== null ? (decisionRule.pStar * 100).toFixed(2) : '—'}%</span>
            </p>
            <p className="text-sm font-bold mt-1" style={{ color: decisionRule.rightBetter === 'A' ? '#1B3A5F' : decisionRule.rightBetter === 'B' ? '#C8963E' : '#4CAF50' }}>
              选 方案{decisionRule.rightBetter === '相同' ? '均可' : decisionRule.rightBetter}
            </p>
          </div>
        </div>

        {/* Formula */}
        <div className="bg-white rounded-lg border border-[#E0DDD5] p-3">
          <p className="text-sm text-[#6B6B6B] mb-2">计算公式：</p>
          <div className="font-mono text-sm text-[#1B3A5F] leading-relaxed">
            <p>p* = (b₂ − a₂) / [(a₁−a₂) − (b₁−b₂)]</p>
            {pStar !== null && (
              <p className="text-[#6B6B6B] mt-1">
                = ({b2} − ({a2})) / [({a1}−({a2})) − ({b1}−({b2}))]
                <br />
                = ({b2 - a2}) / [{(a1 - a2) - (b1 - b2)}]
                <br />
                = <span className="font-bold text-[#C8963E]">{pStar.toFixed(4)}</span>
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Sensitivity Analysis Concept Accordion ── */}
      <motion.div
        custom={6}
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
            <Info className="w-5 h-5 text-[#C8963E]" />
            <h3 className="text-[15px] font-semibold text-[#2B2B2B]">灵敏度分析概念</h3>
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
          <div className="px-5 pb-5 space-y-3 text-sm text-[#2B2B2B] leading-relaxed">
            <p>
              灵敏度分析研究自然状态概率变化对决策结果的影响。通过计算<strong>转折概率</strong>，决策者可以了解在何种概率范围内某一方案为最优。
            </p>
            <p>
              当实际概率与先验概率存在偏差时，只要偏差不超过转折概率对应的临界值，最优方案不会改变。这为决策的<strong>稳健性</strong>提供了重要参考。
            </p>
            <p className="italic text-[#6B6B6B]">
              案例3-12：某企业在方案A和方案B之间做选择，通过灵敏度分析找出转折概率，从而确定最优决策的适用范围。
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
