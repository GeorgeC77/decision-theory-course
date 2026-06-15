import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Network,
  RotateCcw,
  BookOpen,
  Info,
  GitCompare,
  Grid3x3,
  Calculator,
  Zap,
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
} from 'recharts';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import KnowledgeCard from '@/components/KnowledgeCard';



/* ------------------------------------------------------------------ */
/*  Constants & Types                                                  */
/* ------------------------------------------------------------------ */

const ELEMENT_LABELS = ['C₁:成本', 'C₂:收益', 'C₃:就业', 'C₄:公平', 'C₅:污染', 'C₆:可持续性'];
const ELEMENT_SHORT = ['C₁', 'C₂', 'C₃', 'C₄', 'C₅', 'C₆'];
const ELEMENT_FULL = ['成本', '收益', '就业', '公平', '污染', '可持续性'];

const CLUSTER_LABELS = ['经济因素', '社会因素', '环境因素'];
const CLUSTER_RANGES = [
  [0, 1],   // 经济: C1, C2
  [2, 3],   // 社会: C3, C4
  [4, 5],   // 环境: C5, C6
];
const CLUSTER_COLORS = ['#3b82f6', '#4CAF50', '#a855f7'];

const ELEMENT_COLORS = ['#60a5fa', '#3b82f6', '#4ade80', '#4CAF50', '#c084fc', '#a855f7'];

// Default unweighted supermatrix (6x6 block structure)
// Each block W_ij shows influence of cluster j elements on cluster i elements
const DEFAULT_SUPERMATRIX: number[][] = [
  //        C1     C2     C3     C4     C5     C6
  /* C1 */ [0.55, 0.45,  0.35,  0.30,  0.40,  0.35],
  /* C2 */ [0.45, 0.55,  0.30,  0.35,  0.35,  0.40],
  /* C3 */ [0.30, 0.35,  0.50,  0.50,  0.25,  0.30],
  /* C4 */ [0.35, 0.30,  0.50,  0.50,  0.30,  0.25],
  /* C5 */ [0.40, 0.35,  0.30,  0.25,  0.55,  0.45],
  /* C6 */ [0.35, 0.40,  0.25,  0.30,  0.45,  0.55],
];

// Default cluster weights (will be auto-normalized)
const DEFAULT_CLUSTER_WEIGHTS = [0.4, 0.35, 0.25];

const K_VALUES = [1, 2, 4, 8, 16, 32];

/* ------------------------------------------------------------------ */
/*  Helper: round to decimals                                          */
/* ------------------------------------------------------------------ */
const r4 = (v: number) => Math.round(v * 10000) / 10000;
const r3 = (v: number) => Math.round(v * 1000) / 1000;

/* ------------------------------------------------------------------ */
/*  Matrix Math Utilities                                              */
/* ------------------------------------------------------------------ */

function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const result: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function matrixPower(mat: number[][], power: number): number[][] {
  const n = mat.length;
  if (power === 1) return mat.map((r) => [...r]);
  let result: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  ); // identity
  let base: number[][] = mat.map((r) => [...r]);
  let p = power;
  while (p > 0) {
    if (p % 2 === 1) {
      result = multiplyMatrices(result, base);
    }
    base = multiplyMatrices(base, base);
    p = Math.floor(p / 2);
  }
  return result;
}

function computeWeightedSupermatrix(
  supermatrix: number[][],
  clusterWeights: number[]
): number[][] {
  const weighted: number[][] = Array.from({ length: 6 }, () => Array(6).fill(0));
  for (let ci = 0; ci < 3; ci++) {
    for (let cj = 0; cj < 3; cj++) {
      const weight = clusterWeights[ci]; // weight of influenced cluster i
      const rows = CLUSTER_RANGES[ci];
      const cols = CLUSTER_RANGES[cj];
      for (let i = rows[0]; i <= rows[1]; i++) {
        for (let j = cols[0]; j <= cols[1]; j++) {
          weighted[i][j] = supermatrix[i][j] * weight;
        }
      }
    }
  }
  return weighted;
}

// Normalize each block column to sum to 1 (required before weighting)
function normalizeSupermatrix(matrix: number[][]): number[][] {
  const newMatrix = matrix.map((r) => [...r]);
  for (let ci = 0; ci < 3; ci++) {
    for (let cj = 0; cj < 3; cj++) {
      const rows = CLUSTER_RANGES[ci];
      const cols = CLUSTER_RANGES[cj];
      for (let j = cols[0]; j <= cols[1]; j++) {
        let colSum = 0;
        for (let i = rows[0]; i <= rows[1]; i++) {
          colSum += newMatrix[i][j];
        }
        if (colSum > 0) {
          for (let i = rows[0]; i <= rows[1]; i++) {
            newMatrix[i][j] = r4(newMatrix[i][j] / colSum);
          }
        }
      }
    }
  }
  return newMatrix;
}

function normalizeVector(vec: number[]): number[] {
  const sum = vec.reduce((a, b) => a + b, 0);
  if (sum === 0) return vec.map(() => 0);
  return vec.map((v) => r4(v / sum));
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

/** ---- helper: ray–rect intersection ---- */
function rectExit(
  cx: number, cy: number,
  hw: number, hh: number,
  dx: number, dy: number,
): { x: number; y: number } {
  // hw/hh = half-width / half-height of the rectangle
  // (dx,dy) is a unit direction vector OUTWARD from the centre.
  // We want the first positive t where (cx+dx*t, cy+dy*t) hits the border.
  const ts: number[] = [];
  if (dx > 1e-6)  ts.push( hw / dx);
  if (dx < -1e-6) ts.push(-hw / dx);
  if (dy > 1e-6)  ts.push( hh / dy);
  if (dy < -1e-6) ts.push(-hh / dy);
  const t = Math.min(...ts);
  return { x: cx + dx * t, y: cy + dy * t };
}

/** ANP Network Diagram */
function NetworkDiagram({
  activeDependencies,
  toggleDependency,
}: {
  activeDependencies: Set<string>;
  toggleDependency: (key: string) => void;
}) {
  /* ═══════════════════════════════════════════
     Layout — 1200 × 700  (generous spacing)
     ═══════════════════════════════════════════ */
  const NODE_W = 80;
  const NODE_H = 44;
  const NODE_HW = NODE_W / 2; // 40
  const NODE_HH = NODE_H / 2; // 22
  const PAD = 10;             // clearance beyond the rect border

  const centre = [
    { x: 600, y: 160 },   // 经济因素 (top)
    { x: 260, y: 520 },   // 社会因素 (bottom left)
    { x: 940, y: 520 },   // 环境因素 (bottom right)
  ];

  // vertical: C3 above C4, etc.
  const eOff = [
    { dx: 0, dy: -56 },
    { dx: 0, dy:  56 },
  ];

  const ePos: { x: number; y: number; cluster: number; element: number }[] = [];
  centre.forEach((c, ci) => {
    CLUSTER_RANGES[ci].forEach((_, ei) => {
      ePos.push({ x: c.x + eOff[ei].dx, y: c.y + eOff[ei].dy, cluster: ci, element: ei });
    });
  });

  /* ═══════════════════════════════════════════
     Dependencies
     ═══════════════════════════════════════════ */
  type DepT = { from: number; to: number; key: string; type: 'inner' | 'outer' };
  const deps: DepT[] = [];
  for (let ci = 0; ci < 3; ci++) {
    const s = CLUSTER_RANGES[ci][0];
    deps.push({ from: s, to: s + 1, key: `inner-${ci}-0-1`, type: 'inner' });
    deps.push({ from: s + 1, to: s, key: `inner-${ci}-1-0`, type: 'inner' });
  }
  for (let ci = 0; ci < 3; ci++) {
    for (let cj = 0; cj < 3; cj++) {
      if (ci === cj) continue;
      const [si] = CLUSTER_RANGES[ci];
      const [sj] = CLUSTER_RANGES[cj];
      for (let ei = 0; ei < 2; ei++)
        for (let ej = 0; ej < 2; ej++)
          deps.push({ from: sj + ej, to: si + ei, key: `outer-${ci}-${cj}-${ei}-${ej}`, type: 'outer' });
    }
  }

  const on = (k: string) => activeDependencies.has(k);
  const vis = deps.filter((d) => d.type === 'inner' || /outer-\d-\d-0-0/.test(d.key));
  const dimInactive = vis.some((d) => on(d.key));

  /* ═══════════════════════════════════════════
     Render
     ═══════════════════════════════════════════ */
  return (
    <div className="w-full flex flex-col items-center overflow-x-auto">
      <svg viewBox="0 0 1200 700" className="w-full max-w-[1100px]" style={{ minHeight: 520 }}>

        {/* ---- arrow-heads (tiny, refX exactly at triangle tip) ---- */}
        <defs>
          {[0, 1, 2].map((ci) => (
            <marker
              key={ci} id={`ah-${ci}`}
              viewBox="0 0 10 7"
              markerWidth="6"
              markerHeight="4"
              refX="6"
              refY="2"
              orient="auto-start-reverse"
            >
              <polygon points="0 0, 8 2.5, 0 5" fill={CLUSTER_COLORS[ci]} />
            </marker>
          ))}
        </defs>

        {/* ---- cluster ellipses & labels ---- */}
        {centre.map((c, ci) => (
          <g key={`cbg-${ci}`}>
            <ellipse
              cx={c.x} cy={c.y + 30}
              rx={90} ry={130}
              fill={CLUSTER_COLORS[ci]} opacity={0.06}
              stroke={CLUSTER_COLORS[ci]} strokeWidth={1.5} strokeDasharray="6 4"
            />
            <text x={c.x} y={ci === 0 ? 48 : 370} textAnchor="middle"
              fontSize="15" fontWeight="700" fill={CLUSTER_COLORS[ci]}>
              {CLUSTER_LABELS[ci]}
            </text>
          </g>
        ))}

        {/* ---- arrows: each direction is INDEPENDENTLY toggleable ---- */}
        {vis.map((dep) => {
          const f = ePos[dep.from], t = ePos[dep.to];
          const a = on(dep.key);

          const ddx = t.x - f.x, ddy = t.y - f.y;
          const len = Math.sqrt(ddx * ddx + ddy * ddy);
          if (len < 1) return null;

          const ux = ddx / len, uy = ddy / len;
          const s = rectExit(f.x, f.y, NODE_HW + PAD, NODE_HH + PAD, ux, uy);
          const e = rectExit(t.x, t.y, NODE_HW + PAD, NODE_HH + PAD, -ux, -uy);

          const inner = dep.type === 'inner';

          /* ---- inner deps: curved arc ---- */
          if (inner) {
            const px = -uy * 36, py = ux * 36;
            const c1x = s.x + (e.x - s.x) * 0.3 + px;
            const c1y = s.y + (e.y - s.y) * 0.3 + py;
            const c2x = s.x + (e.x - s.x) * 0.7 + px;
            const c2y = s.y + (e.y - s.y) * 0.7 + py;
            const dArc = `M ${s.x} ${s.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${e.x} ${e.y}`;
            const tx = (s.x + e.x) / 2 + px * 0.5;
            const ty = (s.y + e.y) / 2 + py * 0.5;
            return (
              <g key={dep.key}>
                {a ? (
                  /* ON: coloured solid line + arrow */
                  <path d={dArc} fill="none"
                    stroke={CLUSTER_COLORS[f.cluster]}
                    strokeWidth={3.5}
                    markerEnd={`url(#ah-${f.cluster})`}
                    className="transition-all duration-300" />
                ) : (
                  /* OFF: grey arc */
                  <path d={dArc} fill="none"
                    stroke="#E0DDD5" strokeWidth={2}
                    opacity={dimInactive ? 0.08 : 1}
                    className="transition-all duration-300" />
                )}
                <circle cx={tx} cy={ty} r={13}
                  fill={a ? CLUSTER_COLORS[f.cluster] : dimInactive ? '#F8F6F2' : '#f1f5f9'}
                  stroke={a ? CLUSTER_COLORS[f.cluster] : dimInactive ? '#E0DDD5' : '#9E9E9E'}
                  strokeWidth={2}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => toggleDependency(dep.key)} />
                <text x={tx} y={ty + 4} textAnchor="middle"
                  fontSize={a ? 13 : 14} fontWeight={600}
                  fill={a ? '#fff' : '#9E9E9E'} className="pointer-events-none">
                  {a ? 'ON' : 'off'}
                </text>
              </g>
            );
          }

          /* ---- outer deps: straight line ---- */
          const mx = (s.x + e.x) / 2;
          const my = (s.y + e.y) / 2;
          return (
            <g key={dep.key}>
              {a ? (
                /* ON: coloured solid line + arrow */
                <line x1={s.x} y1={s.y} x2={e.x} y2={e.y}
                  stroke={CLUSTER_COLORS[f.cluster]}
                  strokeWidth={3.5}
                  markerEnd={`url(#ah-${f.cluster})`}
                  className="transition-all duration-300" />
              ) : (
                /* OFF: grey dashed line */
                <line x1={s.x} y1={s.y} x2={e.x} y2={e.y}
                  stroke="#E0DDD5" strokeWidth={1.5}
                  strokeDasharray="6 4"
                  opacity={dimInactive ? 0.05 : 1}
                  className="transition-all duration-300" />
              )}
              <circle cx={mx} cy={my} r={13}
                fill={a ? CLUSTER_COLORS[f.cluster] : dimInactive ? '#F8F6F2' : '#f1f5f9'}
                stroke={a ? CLUSTER_COLORS[f.cluster] : dimInactive ? '#E0DDD5' : '#9E9E9E'}
                strokeWidth={2}
                className="cursor-pointer transition-all duration-200"
                onClick={() => toggleDependency(dep.key)} />
              <text x={mx} y={my + 4} textAnchor="middle"
                fontSize={a ? 13 : 14} fontWeight={600}
                fill={a ? '#fff' : '#9E9E9E'} className="pointer-events-none">
                {a ? 'ON' : 'off'}
              </text>
            </g>
          );
        })}

        {/* ---- element nodes (z-ON TOP of lines) ---- */}
        {ePos.map((ep, i) => (
          <g key={`n-${i}`}>
            <rect
              x={ep.x - NODE_HW} y={ep.y - NODE_HH}
              width={NODE_W} height={NODE_H} rx={8}
              fill="#fff" stroke={ELEMENT_COLORS[i]} strokeWidth={2.5} />
            <text x={ep.x} y={ep.y + 5} textAnchor="middle"
              fontSize="13" fontWeight="700" fill={ELEMENT_COLORS[i]}>
              {ELEMENT_SHORT[i]}
            </text>
          </g>
        ))}

        {/* ---- legend ---- */}
        <g transform="translate(40, 640)">
          <line x1={0} y1={10} x2={30} y2={10} stroke="#3b82f6" strokeWidth={3} />
          <text x={38} y={14} fontSize="14" fill="#6B6B6B">内部依赖</text>
          <line x1={130} y1={10} x2={160} y2={10} stroke="#9E9E9E" strokeWidth={2} strokeDasharray="6 4" />
          <text x={168} y={14} fontSize="14" fill="#6B6B6B">外部依赖</text>
          <text x={300} y={14} fontSize="13" fill="#9E9E9E">
            (点击圆点切换)
          </text>
        </g>
      </svg>
    </div>
  );
}

/** Editable supermatrix (6x6) */
function SupermatrixEditor({
  matrix,
  onChange,
}: {
  matrix: number[][];
  onChange: (matrix: number[][]) => void;
}) {
  const handleChange = useCallback(
    (row: number, col: number, val: string) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0 || num > 1) return;
      const newMatrix = matrix.map((r) => [...r]);
      newMatrix[row][col] = Math.round(num * 10000) / 10000;
      onChange(newMatrix);
    },
    [matrix, onChange]
  );

  // Normalize each block column to sum to 1
  const handleNormalize = useCallback(() => {
    const newMatrix = matrix.map((r) => [...r]);
    for (let ci = 0; ci < 3; ci++) {
      for (let cj = 0; cj < 3; cj++) {
        const rows = CLUSTER_RANGES[ci];
        const cols = CLUSTER_RANGES[cj];
        for (let j = cols[0]; j <= cols[1]; j++) {
          let colSum = 0;
          for (let i = rows[0]; i <= rows[1]; i++) {
            colSum += newMatrix[i][j];
          }
          if (colSum > 0) {
            for (let i = rows[0]; i <= rows[1]; i++) {
              newMatrix[i][j] = r4(newMatrix[i][j] / colSum);
            }
          }
        }
      }
    }
    onChange(newMatrix);
  }, [matrix, onChange]);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ color: '#6B6B6B' }}>
          每个块内列归一化（列和为1）
        </span>
        <button
          onClick={handleNormalize}
          className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer"
          style={{ background: '#f1f5f9', color: '#6B6B6B', border: '1px solid #E0DDD5' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#E0DDD5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
        >
          块内归一化
        </button>
      </div>
      <table className="w-full min-w-[500px] border-collapse">
        <thead>
          <tr style={{ background: '#2A4A73' }}>
            <th className="px-2 py-2 text-white text-xs font-medium text-center" style={{ minWidth: 55 }}>
              W
            </th>
            {ELEMENT_SHORT.map((l, i) => (
              <th
                key={i}
                className="px-2 py-2 text-white text-xs font-medium text-center"
                style={{
                  minWidth: 65,
                  background: CLUSTER_COLORS[Math.floor(i / 2)],
                  opacity: 0.9,
                }}
              >
                {l}
              </th>
            ))}
          </tr>
          {/* Cluster header row */}
          <tr style={{ background: '#f1f5f9' }}>
            <th className="px-2 py-1 text-xs text-center" style={{ color: '#9E9E9E' }} />
            {CLUSTER_LABELS.map((label, ci) => (
              <th
                key={ci}
                colSpan={2}
                className="px-2 py-1 text-xs font-semibold text-center"
                style={{ color: CLUSTER_COLORS[ci], borderBottom: `2px solid ${CLUSTER_COLORS[ci]}` }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr
              key={i}
              style={{
                background: i % 2 === 0 ? '#fff' : '#F8F6F2',
                borderTop: i % 2 === 0 && i > 0 && i % 2 === 0 ? `2px solid ${CLUSTER_COLORS[Math.floor(i / 2)]}` : undefined,
              }}
            >
              <td
                className="px-2 py-1.5 text-xs font-medium text-center"
                style={{ color: ELEMENT_COLORS[i], background: '#f1f5f9' }}
              >
                {ELEMENT_SHORT[i]}
              </td>
              {row.map((val, j) => (
                <td key={j} className="px-1 py-1 text-center">
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={r3(val)}
                    onChange={(e) => handleChange(i, j, e.target.value)}
                    className="w-full h-7 px-1 text-xs text-center border rounded outline-none transition-all duration-200"
                    style={{
                      borderColor: '#E0DDD5',
                      background: '#fff',
                      color: '#2A4A73',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(27,58,95,0.15)';
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
  );
}

/** Cluster Weight Editor */
function ClusterWeightEditor({
  weights,
  onChange,
}: {
  weights: number[];
  onChange: (weights: number[]) => void;
}) {
  const normalized = useMemo(() => normalizeVector(weights), [weights]);

  const handleChange = useCallback(
    (index: number, val: string) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0) return;
      const newWeights = [...weights];
      newWeights[index] = Math.round(num * 10000) / 10000;
      onChange(newWeights);
    },
    [weights, onChange]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        {CLUSTER_LABELS.map((label, i) => (
          <div
            key={i}
            className="flex-1 min-w-[140px] p-4 rounded-lg"
            style={{ background: `${CLUSTER_COLORS[i]}10`, border: `1px solid ${CLUSTER_COLORS[i]}30` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: CLUSTER_COLORS[i] }}
              />
              <span className="text-sm font-medium" style={{ color: '#2A4A73' }}>
                {label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={weights[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                className="w-20 h-8 px-2 text-sm text-center border rounded-md outline-none transition-all duration-200"
                style={{
                  borderColor: '#E0DDD5',
                  color: '#2A4A73',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = CLUSTER_COLORS[i];
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${CLUSTER_COLORS[i]}25`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E0DDD5';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <div className="flex-1">
                <div
                  className="h-5 rounded-full overflow-hidden"
                  style={{ background: '#f1f5f9' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${normalized[i] * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: CLUSTER_COLORS[i] }}
                  />
                </div>
                <div className="text-xs mt-1 text-center" style={{ color: '#6B6B6B' }}>
                  归一化: {(normalized[i] * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: '#fefce8' }}>
        <Info size={14} style={{ color: '#854d0e' }} />
        <span className="text-xs" style={{ color: '#854d0e' }}>
          输入权重后会自动归一化，使其总和为 1。当前总和: {weights.reduce((a, b) => a + b, 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/** Display a 6x6 matrix as a styled table */
function MatrixDisplay({
  matrix,
  title,
  highlightBlock = false,
}: {
  matrix: number[][];
  title?: string;
  highlightBlock?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      {title && (
        <h4 className="text-sm font-semibold mb-2" style={{ color: '#2A4A73' }}>
          {title}
        </h4>
      )}
      <table className="w-full min-w-[420px] border-collapse">
        <thead>
          <tr style={{ background: '#2A4A73' }}>
            <th className="px-2 py-1.5 text-white text-xs font-medium text-center" style={{ minWidth: 45 }}>
              —
            </th>
            {ELEMENT_SHORT.map((l, i) => (
              <th
                key={i}
                className="px-2 py-1.5 text-white text-xs font-medium text-center"
                style={{ minWidth: 60 }}
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
              style={{
                background: i % 2 === 0 ? '#fff' : '#F8F6F2',
              }}
            >
              <td
                className="px-2 py-1 text-xs font-medium text-center"
                style={{ color: ELEMENT_COLORS[i], background: '#f1f5f9' }}
              >
                {ELEMENT_SHORT[i]}
              </td>
              {row.map((val, j) => (
                <td
                  key={j}
                  className="px-1 py-1 text-xs text-center font-mono"
                  style={{
                    color: '#2A4A73',
                    background:
                      highlightBlock && Math.floor(i / 2) === Math.floor(j / 2)
                        ? `${CLUSTER_COLORS[Math.floor(i / 2)]}10`
                        : 'transparent',
                    borderLeft:
                      j % 2 === 0 && j > 0 ? '1px solid #E0DDD5' : undefined,
                  }}
                >
                  {r4(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function AnpPage() {
  /* State */
  const [supermatrix, setSupermatrix] = useState<number[][]>(() =>
    normalizeSupermatrix(DEFAULT_SUPERMATRIX.map((r) => [...r]))
  );
  const [clusterWeights, setClusterWeights] = useState<number[]>([...DEFAULT_CLUSTER_WEIGHTS]);
  const [activeKIndex, setActiveKIndex] = useState<number>(0);
  const [activeDeps, setActiveDeps] = useState<Set<string>>(() => {
    // All dependencies active by default
    const all = new Set<string>();
    for (let ci = 0; ci < 3; ci++) {
      all.add(`inner-${ci}-0-1`);
      all.add(`inner-${ci}-1-0`);
    }
    for (let ci = 0; ci < 3; ci++) {
      for (let cj = 0; cj < 3; cj++) {
        if (ci === cj) continue;
        all.add(`outer-${ci}-${cj}-0-0`);
      }
    }
    return all;
  });

  /* Computed: normalized cluster weights */
  const normalizedClusterWeights = useMemo(
    () => normalizeVector(clusterWeights),
    [clusterWeights]
  );

  /* Computed: weighted supermatrix */
  const weightedSupermatrix = useMemo(
    () => computeWeightedSupermatrix(supermatrix, normalizedClusterWeights),
    [supermatrix, normalizedClusterWeights]
  );

  /* Computed: powered matrices for each k */
  const poweredMatrices = useMemo(() => {
    return K_VALUES.map((k) => matrixPower(weightedSupermatrix, k));
  }, [weightedSupermatrix]);

  /* Computed: limit priorities */
  const limitPriorities = useMemo(() => {
    const limitMat = poweredMatrices[poweredMatrices.length - 1];
    // Average each column (all columns should converge to same values)
    const avgCol: number[] = [];
    for (let j = 0; j < 6; j++) {
      let sum = 0;
      for (let i = 0; i < 6; i++) {
        sum += limitMat[i][j];
      }
      avgCol.push(sum / 6);
    }
    // Normalize
    const total = avgCol.reduce((a, b) => a + b, 0);
    if (total === 0) return avgCol.map(() => r4(1 / 6));
    return avgCol.map((v) => r4(v / total));
  }, [poweredMatrices]);

  /* Toggle dependency */
  const toggleDep = useCallback((key: string) => {
    setActiveDeps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  /* Reset handler */
  const handleReset = () => {
    setSupermatrix(normalizeSupermatrix(DEFAULT_SUPERMATRIX.map((r) => [...r])));
    setClusterWeights([...DEFAULT_CLUSTER_WEIGHTS]);
    setActiveKIndex(0);
    const all = new Set<string>();
    for (let ci = 0; ci < 3; ci++) {
      all.add(`inner-${ci}-0-1`);
      all.add(`inner-${ci}-1-0`);
    }
    for (let ci = 0; ci < 3; ci++) {
      for (let cj = 0; cj < 3; cj++) {
        if (ci === cj) continue;
        all.add(`outer-${ci}-${cj}-0-0`);
      }
    }
    setActiveDeps(all);
  };

  /* Bar chart data */
  const chartData = useMemo(
    () =>
      ELEMENT_SHORT.map((name, i) => ({
        name,
        fullName: ELEMENT_FULL[i],
        priority: limitPriorities[i],
        fill: ELEMENT_COLORS[i],
      })),
    [limitPriorities]
  );

  /* Section pills */
  const pills = [
    { label: '5.1', path: '/criteria-system', text: '目标准则体系' },
    { label: '5.2', path: '/utility-merging', text: '多维效用并合' },
    { label: '5.3', path: '/ahp', text: 'AHP' },
    { label: '5.4', path: '/dea', text: 'DEA' },
    { label: '5.6', path: '/anp', text: 'ANP' },
  ];

  /* Knowledge sections */
  const knowledgeSections = [
    {
      subtitle: '适用条件',
      content: [
        '准则间存在相互依赖和反馈关系的复杂决策问题',
        '各准则集群内部和之间存在已知的影响关系',
        '需要同时考虑内部依赖和外部依赖的网络结构',
      ],
    },
    {
      subtitle: '与AHP的区别',
      content: [
        'AHP使用树状层次结构（严格自顶向下）',
        'ANP使用网络结构，允许准则间相互影响和反馈',
        'AHP中下层对上层无反馈，ANP允许任意方向的依赖',
        'ANP通过超矩阵建模复杂的相互依赖关系',
      ],
    },
    {
      subtitle: '超矩阵',
      content: [
        '未加权超矩阵 W = [Wᵢⱼ]，每个 Wᵢⱼ 是局部权重矩阵',
        '加权超矩阵 W̃ = [wᵢⱼ · aⱼ]，其中 aⱼ 是集群权重',
        '极限超矩阵 W* = limₖ→∞ W̃ᵏ，给出最终稳定优先级',
      ],
    },
    {
      subtitle: '极限计算',
      content: [
        '通过幂迭代计算 W̃ᵏ 直至收敛',
        '收敛后每一列相同，即为极限优先向量',
        '优先向量归一化后得到各元素的最终权重',
      ],
    },
    {
      subtitle: '注意事项',
      content: [
        'ANP计算复杂度远高于AHP（涉及更大规模的矩阵运算）',
        '实际应用中常使用 SuperDecisions 软件进行计算',
        '超矩阵的构建需要专家判断，主观性仍然存在',
        '集群权重的确定是ANP的关键难点之一',
        '本页面使用简化计算演示ANP核心概念',
      ],
    },
  ];

  /* ANP steps for theory card */
  const anpSteps = [
    { num: '①', text: '建立网络结构（控制层 + 网络层）' },
    { num: '②', text: '进行两两比较，构建未加权超矩阵 W' },
    { num: '③', text: '确定集群权重，构建加权超矩阵 W̃' },
    { num: '④', text: '计算极限超矩阵 W* = lim W̃ᵏ' },
    { num: '⑤', text: '提取最终优先级并排序', },
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
                background: p.label === '5.6' ? '#1B3A5F' : '#fff',
                color: p.label === '5.6' ? '#fff' : '#6B6B6B',
                border: p.label === '5.6' ? '1px solid #1B3A5F' : '1px solid #E0DDD5',
              }}
            >
              {p.label} {p.text}
            </a>
          ))}
        </div>

        {/* Breadcrumb */}
        <Breadcrumb
          items={[{ label: '首页', path: '/' }, { label: '5.6 网络分析法(ANP)' }]}
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
                <Network size={14} />
                5.6
              </span>
              <span className="text-xs font-medium" style={{ color: '#9E9E9E' }}>
                多目标决策分析
              </span>
            </div>
            <h1 className="text-[28px] font-bold leading-tight" style={{ color: '#1B3A5F' }}>
              网络分析法
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
              Analytic Network Process (ANP) — 基于网络结构和超矩阵的多准则决策方法
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['ANP', '超矩阵', '网络结构', '相互依赖', '极限优先级'].map((tag) => (
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
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E0DDD5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            <RotateCcw size={14} />
            重置数据
          </button>
        </motion.div>

        {/* Section 1: Theory - ANP Overview */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              网络分析法概述
            </h2>
          </div>
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#6B6B6B' }}>
            网络分析法(ANP)是T.L. Saaty在AHP基础上发展的决策方法，用网络结构替代层次结构，
            允许准则之间存在相互依赖和反馈关系。ANP通过构建超矩阵(Supermatrix)描述元素间的影响关系，
            经加权、求极限得到最终优先级排序。
          </p>
          <div className="flex flex-col gap-2">
            {anpSteps.map((s, i) => (
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

        {/* Section 2: ANP vs AHP */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <GitCompare size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              ANP vs AHP：关键区别
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* AHP */}
            <div className="p-4 rounded-lg" style={{ background: '#F8F6F2', border: '1px solid #E0DDD5' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: '#6B6B6B' }}>
                  A
                </div>
                <h3 className="text-sm font-semibold" style={{ color: '#2A4A73' }}>AHP 层次分析法</h3>
              </div>
              <ul className="flex flex-col gap-1.5">
                {[
                  '严格的树状层次结构（自顶向下）',
                  '每层元素只受上一层影响',
                  '不允许反馈和同层依赖',
                  '使用单一判断矩阵',
                ].map((item, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#6B6B6B' }}>
                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#9E9E9E' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ANP */}
            <div className="p-4 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: '#3b82f6' }}>
                  N
                </div>
                <h3 className="text-sm font-semibold" style={{ color: '#2A4A73' }}>ANP 网络分析法</h3>
              </div>
              <ul className="flex flex-col gap-1.5">
                {[
                  '网络结构（节点+有向边）',
                  '任意元素间可存在影响关系',
                  '允许内部依赖和外部依赖',
                  '使用超矩阵描述复杂关系',
                ].map((item, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#6B6B6B' }}>
                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#3b82f6' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="formula-block flex items-center gap-3 flex-wrap text-sm" style={{ color: '#2A4A73' }}>
            <span className="font-medium">AHP: 树结构</span>
            <span style={{ color: '#9E9E9E' }}>→</span>
            <span className="font-medium">ANP: 网络结构</span>
            <span style={{ color: '#9E9E9E' }}>→</span>
            <span>超矩阵 <span style={{ color: '#2A4A73' }}>W = [W<sub>ij</sub>]</span></span>
          </div>
        </SectionCard>

        {/* Section 3: ANP Structure */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <Network size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              ANP 网络结构
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
            ANP结构由<strong>控制层</strong>（目标/准则）和<strong>网络层</strong>（元素集群及依赖关系）组成。
            每个集群内部有内部依赖(inner dependence)，集群之间有外部依赖(outer dependence)。
          </p>

          <NetworkDiagram
            activeDependencies={activeDeps}
            toggleDependency={toggleDep}
          />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CLUSTER_LABELS.map((label, ci) => (
              <div
                key={ci}
                className="p-3 rounded-lg"
                style={{ background: `${CLUSTER_COLORS[ci]}08`, border: `1px solid ${CLUSTER_COLORS[ci]}25` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CLUSTER_COLORS[ci] }} />
                  <span className="text-xs font-semibold" style={{ color: CLUSTER_COLORS[ci] }}>
                    {label}
                  </span>
                </div>
                <div className="text-xs" style={{ color: '#6B6B6B' }}>
                  {ELEMENT_LABELS[CLUSTER_RANGES[ci][0]]}、{ELEMENT_LABELS[CLUSTER_RANGES[ci][1]]}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Section 4: Supermatrix Editor */}
        <SectionCard>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Grid3x3 size={18} style={{ color: '#3b82f6' }} />
              <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
                超矩阵编辑器
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
            6×6 超矩阵 W = [Wᵢⱼ]，其中每个 2×2 块表示集群 j 对集群 i 的局部影响权重
          </p>

          <SupermatrixEditor matrix={supermatrix} onChange={setSupermatrix} />

          {/* Supermatrix visual — HTML table replaces unreliable bmatrix */}
          <div className="mt-4 flex justify-center">
            <table className="border-separate" style={{ borderSpacing: '6px 4px' }}>
              <tbody>
                <tr>
                  <td className="text-right pr-2" style={{ color: '#6B6B6B', fontSize: 14 }}>W =</td>
                  <td className="p-2 rounded-lg" style={{ border: '1.5px solid #9E9E9E', background: '#F8F6F2' }}>
                    <table className="border-separate" style={{ borderSpacing: '8px 2px' }}>
                      <tbody>
                        <tr>{['W₁₁','W₁₂','W₁₃'].map((v,i)=><td key={i} className="text-center" style={{color:'#2A4A73',fontSize:13,minWidth:28}}>{v}</td>)}</tr>
                        <tr>{['W₂₁','W₂₂','W₂₃'].map((v,i)=><td key={i} className="text-center" style={{color:'#2A4A73',fontSize:13,minWidth:28}}>{v}</td>)}</tr>
                        <tr>{['W₃₁','W₃₂','W₃₃'].map((v,i)=><td key={i} className="text-center" style={{color:'#2A4A73',fontSize:13,minWidth:28}}>{v}</td>)}</tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Section 5: Cluster Weights */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              集群权重设置
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            设置各集群的相对权重，用于将未加权超矩阵转换为加权超矩阵。权重会自动归一化。
          </p>

          <ClusterWeightEditor weights={clusterWeights} onChange={setClusterWeights} />

          <div className="mt-4">
            <div className="formula-block">
              <span className="text-sm" style={{ color: '#2A4A73' }}>
                <span style={{ fontStyle: 'italic' }}>W̃</span><sub>ij</sub> = W<sub>ij</sub> · a<sub>j</sub>
              </span>
              <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
                其中 a<sub>j</sub> 为集群 j 的归一化权重
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Section 6: Weighted Supermatrix */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              加权超矩阵计算
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            将每个块乘以对应集群的归一化权重，得到加权超矩阵 W̃
          </p>

          <MatrixDisplay matrix={weightedSupermatrix} title="加权超矩阵 W̃" highlightBlock />

          <div className="mt-4 grid grid-cols-3 gap-3">
            {CLUSTER_LABELS.map((label, ci) => (
              <div
                key={ci}
                className="px-3 py-2 rounded-md text-center"
                style={{ background: `${CLUSTER_COLORS[ci]}10` }}
              >
                <div className="text-xs" style={{ color: '#6B6B6B' }}>a({label})</div>
                <div className="text-sm font-semibold font-mono" style={{ color: CLUSTER_COLORS[ci] }}>
                  {r4(normalizedClusterWeights[ci])}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Section 7: Power Iteration */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              极限超矩阵 — 幂迭代计算
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            计算 W̃ᵏ 当 k → ∞ 时的极限。点击下方按钮逐步增加幂次，观察矩阵的收敛过程。
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
            {K_VALUES.map((k, i) => (
              <button
                key={k}
                onClick={() => setActiveKIndex(i)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: activeKIndex === i ? '#1B3A5F' : '#f1f5f9',
                  color: activeKIndex === i ? '#fff' : '#6B6B6B',
                  border: activeKIndex === i ? '1px solid #1B3A5F' : '1px solid #E0DDD5',
                }}
                onMouseEnter={(e) => {
                  if (activeKIndex !== i) e.currentTarget.style.background = '#E0DDD5';
                }}
                onMouseLeave={(e) => {
                  if (activeKIndex !== i) e.currentTarget.style.background = '#f1f5f9';
                }}
              >
                k = {k}
              </button>
            ))}
          </div>

          <MatrixDisplay
            matrix={poweredMatrices[activeKIndex]}
            title={`W̃^${K_VALUES[activeKIndex]} (迭代步数: ${K_VALUES[activeKIndex]})`}
          />

          <div className="mt-4">
            <div className="formula-block flex items-center gap-2 justify-center text-base" style={{ color: '#2A4A73' }}>
              <span>W<sup>*</sup> =</span>
              <span>lim</span>
              <span style={{ fontSize: '0.75em', display: 'inline-block', textAlign: 'center', lineHeight: 1.1 }}>
                <span style={{ color: '#6B6B6B' }}>k → ∞</span>
              </span>
              <span style={{ fontStyle: 'italic' }}>W̃</span><sup>k</sup>
            </div>
          </div>

          {/* Convergence note */}
          {activeKIndex >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg flex items-center gap-2"
              style={{ background: '#E8F5E9', border: '1px solid #bbf7d0' }}
            >
              <Info size={16} style={{ color: '#4CAF50' }} />
              <span className="text-xs" style={{ color: '#4CAF50' }}>
                矩阵已收敛！每一列的数值趋于一致，即为极限优先向量。
              </span>
            </motion.div>
          )}
        </SectionCard>

        {/* Section 8: Final Priority Chart */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              最终优先级排序
            </h2>
          </div>
          <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
            从极限超矩阵中提取的各元素最终优先级权重
          </p>

          {/* Priority table */}
          <div className="overflow-x-auto mb-5">
            <table className="w-full min-w-[360px] border-collapse">
              <thead>
                <tr style={{ background: '#2A4A73' }}>
                  <th className="px-3 py-2 text-white text-xs font-medium text-left">元素</th>
                  <th className="px-3 py-2 text-white text-xs font-medium text-center">所属集群</th>
                  <th className="px-3 py-2 text-white text-xs font-medium text-center">优先级权重</th>
                  <th className="px-3 py-2 text-white text-xs font-medium text-center">百分比</th>
                  <th className="px-3 py-2 text-white text-xs font-medium text-left">可视化</th>
                </tr>
              </thead>
              <tbody>
                {[...limitPriorities]
                  .map((p, i) => ({ priority: p, index: i }))
                  .sort((a, b) => b.priority - a.priority)
                  .map(({ priority, index }, rank) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: rank * 0.08 }}
                      style={{
                        background: rank === 0 ? '#E8F5E9' : rank % 2 === 0 ? '#fff' : '#F8F6F2',
                        borderLeft: rank === 0 ? '3px solid #4CAF50' : '3px solid transparent',
                      }}
                    >
                      <td className="px-3 py-2.5 text-sm font-medium" style={{ color: '#2A4A73' }}>
                        {ELEMENT_LABELS[index]}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-center">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: `${CLUSTER_COLORS[Math.floor(index / 2)]}15`,
                            color: CLUSTER_COLORS[Math.floor(index / 2)],
                          }}
                        >
                          {CLUSTER_LABELS[Math.floor(index / 2)]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm font-mono font-semibold text-center" style={{ color: ELEMENT_COLORS[index] }}>
                        {r4(priority)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-center" style={{ color: '#6B6B6B' }}>
                        {(priority * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5" style={{ minWidth: 120 }}>
                        <div className="h-4 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${priority * 100 * 2.5}%` }}
                            transition={{ duration: 0.6, delay: rank * 0.08 }}
                            className="h-full rounded-full"
                            style={{ background: ELEMENT_COLORS[index] }}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Bar chart */}
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B6B6B' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6B6B6B' }}
                  domain={[0, 'auto']}
                  tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, '优先级']}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E0DDD5',
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="priority" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Section 9: Two-Step Summary */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} style={{ color: '#3b82f6' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
              ANP 两步骤总结
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-start">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white flex-shrink-0 mt-0.5"
                style={{ background: '#3b82f6' }}
              >
                1
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1" style={{ color: '#2A4A73' }}>
                  构建未加权超矩阵
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: '#6B6B6B' }}>
                  通过元素间的两两比较，构建每个块 Wᵢⱼ，表示集群 j 中的元素对集群 i 中元素的影响程度。
                  对每个块进行列归一化，使每个块内列和为 1。
                </p>
              </div>
            </div>

            <div className="w-full h-px" style={{ background: '#E0DDD5' }} />

            <div className="flex gap-4 items-start">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white flex-shrink-0 mt-0.5"
                style={{ background: '#4CAF50' }}
              >
                2
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1" style={{ color: '#2A4A73' }}>
                  计算加权超矩阵与极限
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: '#6B6B6B' }}>
                  将每个块乘以对应集群权重得到加权超矩阵 W̃，然后计算 W̃ᵏ 当 k → ∞ 时的极限。
                  极限超矩阵的每一列相同，即为各元素的最终优先级。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: '#2A4A73' }}>Step 1:</span>
              <span className="text-sm" style={{ color: '#2A4A73' }}>W = [W<sub>ij</sub>]</span>
              <span className="text-xs" style={{ color: '#6B6B6B' }}>(未加权超矩阵)</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: '#2A4A73' }}>Step 2:</span>
              <span className="text-sm" style={{ color: '#2A4A73' }}>
                <span style={{ fontStyle: 'italic' }}>W̃</span> = [a<sub>j</sub>W<sub>ij</sub>] → W<sup>*</sup> = lim<sub>k→∞</sub><span style={{ fontStyle: 'italic' }}>W̃</span><sup>k</sup>
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Section 10: Disclaimer */}
        <SectionCard>
          <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
            <AlertTriangle size={20} style={{ color: '#C8963E', flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 className="text-sm font-semibold mb-1" style={{ color: '#1B3A5F' }}>
                简化演示说明
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>
                本页面演示 ANP 网络分析法的核心概念和计算流程，使用简化的超矩阵结构。
                完整的 ANP 实现需要借助专业软件
                <strong> SuperDecisions</strong>
                进行完整的超矩阵构建、两两比较数据输入和极限计算。
                实际决策问题中的超矩阵维度可能更大，且需要更多专家判断数据。
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Section 11: Knowledge Card */}
        <KnowledgeCard
          title="网络分析法 ANP"
          sections={knowledgeSections}
          tags={['ANP', '超矩阵', '网络结构', '相互依赖', '极限优先级', 'SuperDecisions']}
        />
      </div>
    </Layout>
  );
}
