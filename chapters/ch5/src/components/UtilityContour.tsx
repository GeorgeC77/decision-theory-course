import { useRef, useEffect, useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type RuleType = 'distance' | 'substitution' | 'additive' | 'multiplicative' | 'mixed';

interface UtilityContourProps {
  rule: RuleType;
  c1: number;
  c2: number;
  rho1: number;
  rho2: number;
  gamma: number;
  k: number;
  altU1: number[];
  altU2: number[];
  altNames: string[];
}

/* ------------------------------------------------------------------ */
/*  Color map: blue -> green -> yellow -> red                          */
/* ------------------------------------------------------------------ */

function valueToColor(t: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0.0, [30, 64, 175]],      // deep blue
    [0.25, [59, 130, 246]],    // blue
    [0.5, [34, 197, 94]],      // green
    [0.75, [234, 179, 8]],     // yellow
    [1.0, [220, 38, 38]],      // red
  ];
  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
  const [t0, c0] = stops[i];
  const [t1, c1] = stops[i + 1];
  const p = (t - t0) / (t1 - t0);
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * p),
    Math.round(c0[1] + (c1[1] - c0[1]) * p),
    Math.round(c0[2] + (c1[2] - c0[2]) * p),
  ];
}

/* ------------------------------------------------------------------ */
/*  Compute W = f(u1, u2)                                            */
/* ------------------------------------------------------------------ */

function computeW(
  rule: RuleType,
  u1: number, u2: number,
  c1: number, c2: number,
  rho1: number, rho2: number,
  gamma: number, _k: number
): number {
  switch (rule) {
    case 'distance': {
      const d = Math.sqrt(0.5 * ((1 - u1) ** 2 + (1 - u2) ** 2));
      return 1 - d;
    }
    case 'substitution': {
      return 1 - (1 - u1) * (1 - u2);
    }
    case 'additive': {
      // Use c1 as rho1, c2 as rho2 for weights
      return c1 * u1 + c2 * u2;
    }
    case 'multiplicative': {
      return Math.pow(Math.max(u1, 0.0001), rho1) * Math.pow(Math.max(u2, 0.0001), rho2);
    }
    case 'mixed': {
      if (Math.abs(gamma) < 0.0001) {
        return c1 * u1 + c2 * u2;
      }
      return Math.max(0, Math.min(1, ((1 + gamma * c1 * u1) * (1 + gamma * c2 * u2) - 1) / gamma));
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Grid density — higher = smoother pixels                            */
/* ------------------------------------------------------------------ */

const GRID = 160;

function generateGrid(
  rule: RuleType,
  c1: number, c2: number,
  rho1: number, rho2: number,
  gamma: number, k: number
): { grid: number[][]; wMin: number; wMax: number } {
  const grid: number[][] = [];
  let wMin = Infinity, wMax = -Infinity;
  for (let i = 0; i <= GRID; i++) {
    const row: number[] = [];
    for (let j = 0; j <= GRID; j++) {
      const u1 = i / GRID;
      const u2 = j / GRID;
      const w = computeW(rule, u1, u2, c1, c2, rho1, rho2, gamma, k);
      row.push(w);
      wMin = Math.min(wMin, w);
      wMax = Math.max(wMax, w);
    }
    grid.push(row);
  }
  return { grid, wMin, wMax };
}

/* ------------------------------------------------------------------ */
/*  Marching squares                                                   */
/* ------------------------------------------------------------------ */

function marchingSquares(
  grid: number[][],
  threshold: number
): Array<[[number, number], [number, number]]> {
  const segments: Array<[[number, number], [number, number]]> = [];
  const n = grid.length - 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v00 = grid[i][j];
      const v10 = grid[i + 1][j];
      const v01 = grid[i][j + 1];
      const v11 = grid[i + 1][j + 1];
      let caseIndex = 0;
      if (v00 >= threshold) caseIndex |= 1;
      if (v10 >= threshold) caseIndex |= 2;
      if (v11 >= threshold) caseIndex |= 4;
      if (v01 >= threshold) caseIndex |= 8;
      if (caseIndex === 0 || caseIndex === 15) continue;

      const x = i / GRID, y = j / GRID;
      const dx = 1 / GRID, dy = 1 / GRID;
      const interp = (vA: number, vB: number, coordA: number, coordB: number) =>
        coordA + (coordB - coordA) * (threshold - vA) / (vB - vA);

      const ptBottom: [number, number] = [interp(v00, v10, x, x + dx), y];
      const ptRight: [number, number] = [x + dx, interp(v10, v11, y, y + dy)];
      const ptTop: [number, number] = [interp(v01, v11, x, x + dx), y + dy];
      const ptLeft: [number, number] = [x, interp(v00, v01, y, y + dy)];

      const addSeg = (a: [number, number], b: [number, number]) => segments.push([a, b]);

      switch (caseIndex) {
        case 1: case 14: addSeg(ptLeft, ptBottom); break;
        case 2: case 13: addSeg(ptBottom, ptRight); break;
        case 3: case 12: addSeg(ptLeft, ptRight); break;
        case 4: case 11: addSeg(ptRight, ptTop); break;
        case 5: addSeg(ptLeft, ptTop); addSeg(ptBottom, ptRight); break;
        case 6: case 9: addSeg(ptBottom, ptTop); break;
        case 7: case 8: addSeg(ptLeft, ptTop); break;
        case 10: addSeg(ptLeft, ptBottom); addSeg(ptRight, ptTop); break;
      }
    }
  }
  return segments;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const CBAR_W = 28;       // color bar width
const PAD = { left: 52, right: 82, top: 44, bottom: 52 };

export default function UtilityContour({
  rule, c1, c2, rho1, rho2, gamma, k, altU1, altU2, altNames,
}: UtilityContourProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(500);

  /* ResizeObserver keeps the data area square */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        // Keep data area square: plot area constrained by both width and height
        const plotSize = Math.min(
          w - PAD.left - PAD.right - CBAR_W,
          w - PAD.top - PAD.bottom,
          560
        );
        const totalW = plotSize + PAD.left + PAD.right + CBAR_W;
        const totalH = plotSize + PAD.top + PAD.bottom;
        // Use the larger dimension for canvas size to fit everything
        setSize(Math.max(Math.max(totalW, totalH), 300));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { grid, wMin, wMax } = useMemo(
    () => generateGrid(rule, c1, c2, rho1, rho2, gamma, k),
    [rule, c1, c2, rho1, rho2, gamma, k]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = size;
    const cssH = size;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const plotW = cssW - PAD.left - PAD.right - CBAR_W;
    const plotH = cssH - PAD.top - PAD.bottom;
    const plotSize = Math.min(plotW, plotH); // keep data area square

    const toX = (u: number) => PAD.left + u * plotSize;
    const toY = (u: number) => PAD.top + (1 - u) * plotSize;

    // Clear
    ctx.clearRect(0, 0, cssW, cssH);

    // 1. Fill contour bands — dense pixel blocks
    const numBands = 40;
    const wSpan = wMax - wMin || 1;
    for (let b = 0; b < numBands; b++) {
      const bandW0 = wMin + (b / numBands) * wSpan;
      const bandW1 = wMin + ((b + 1) / numBands) * wSpan;
      const midT = (b + 0.5) / numBands;
      const [r_, g_, b_] = valueToColor(midT);
      ctx.fillStyle = `rgba(${r_}, ${g_}, ${b_}, 0.35)`;

      for (let i = 0; i <= GRID; i++) {
        for (let j = 0; j <= GRID; j++) {
          const w = grid[i][j];
          if (w >= bandW0 && w < bandW1) {
            const x0 = toX(i / GRID);
            const y0 = toY((j + 1) / GRID);
            const x1 = toX((i + 1) / GRID);
            const y1 = toY(j / GRID);
            ctx.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
          }
        }
      }
    }

    // 2. Contour lines
    const numContours = 10;
    for (let ci = 1; ci < numContours; ci++) {
      const threshold = wMin + (ci / numContours) * wSpan;
      const segs = marchingSquares(grid, threshold);
      const t = (threshold - wMin) / wSpan;
      const [cr, cg, cb] = valueToColor(t);
      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.9)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      segs.forEach(([a, b]) => {
        ctx.moveTo(toX(a[0]), toY(a[1]));
        ctx.lineTo(toX(b[0]), toY(b[1]));
      });
      ctx.stroke();
    }

    // 3. Axes
    ctx.strokeStyle = '#6B6B6B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD.left, toY(0));
    ctx.lineTo(toX(1), toY(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD.left, toY(0));
    ctx.lineTo(PAD.left, toY(1));
    ctx.stroke();

    // Axis ticks
    ctx.fillStyle = '#6B6B6B';
    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const v = i / 5;
      const x = toX(v);
      ctx.fillText(v.toFixed(1), x, toY(0) + 18);
      ctx.beginPath();
      ctx.moveTo(x, toY(0));
      ctx.lineTo(x, toY(0) + 5);
      ctx.stroke();
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const v = i / 5;
      const y = toY(v);
      ctx.fillText(v.toFixed(1), PAD.left - 10, y);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left - 5, y);
      ctx.stroke();
    }
    ctx.textBaseline = 'alphabetic';

    // Axis labels
    ctx.fillStyle = '#1B3A5F';
    ctx.font = 'bold 13px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('u₁ (准则1效用)', PAD.left + plotSize / 2, cssH - 12);
    ctx.save();
    ctx.translate(14, PAD.top + plotSize / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('u₂ (准则2效用)', 0, 0);
    ctx.restore();

    // 4. Color bar (vertical, right side)
    const barX = PAD.left + plotSize + 14;
    const barTop = PAD.top;
    const barH = plotSize;
    const barSteps = 80;
    for (let s = 0; s < barSteps; s++) {
      const t = 1 - s / barSteps; // top = high value
      const [cr, cg, cb] = valueToColor(t);
      ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
      const y = barTop + (s / barSteps) * barH;
      const h = barH / barSteps + 1;
      ctx.fillRect(barX, y, CBAR_W, h);
    }
    // Bar border
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barTop, CBAR_W, barH);

    // Color bar labels (W values)
    ctx.fillStyle = '#6B6B6B';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const barLabelX = barX + CBAR_W + 6;
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const wVal = wMin + t * wSpan;
      const y = barTop + (1 - t) * barH;
      ctx.fillText(wVal.toFixed(2), barLabelX, y);
    }
    ctx.textBaseline = 'alphabetic';

    // 5. Alternative dots
    const dotColors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea'];
    altU1.forEach((u1, i) => {
      const u2 = altU2[i];
      const w = computeW(rule, u1, u2, c1, c2, rho1, rho2, gamma, k);
      const x = toX(u1);
      const y = toY(u2);
      const color = dotColors[i % dotColors.length];

      // White ring
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label
      ctx.fillStyle = color;
      ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${altNames[i]} W=${w.toFixed(2)}`, x + 10, y + 4);
    });

    // 6. Title (outside plot area, at top)
    ctx.fillStyle = '#1B3A5F';
    ctx.font = 'bold 13px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    const ruleLabels: Record<RuleType, string> = {
      distance: '距离规则  W = 1 − √{(1/2)[(1−u₁)²+(1−u₂)²]}',
      substitution: '代换规则  W = 1−(1−u₁)(1−u₂)',
      additive: '加法规则  W = c₁u₁ + c₂u₂',
      multiplicative: '乘法规则  W = u₁^ρ₁ · u₂^ρ₂',
      mixed: '混合规则  1+γW = (1+γc₁u₁)(1+γc₂u₂)',
    };
    ctx.fillText(ruleLabels[rule], PAD.left, PAD.top - 18);
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#6B6B6B';
    ctx.textAlign = 'right';
    ctx.fillText(`W ∈ [${wMin.toFixed(2)}, ${wMax.toFixed(2)}]`, PAD.left + plotSize, PAD.top - 18);

  }, [grid, wMin, wMax, rule, c1, c2, rho1, rho2, gamma, k, altU1, altU2, altNames, size]);

  return (
    <div ref={wrapperRef} className="w-full flex justify-center">
      <div
        className="rounded-xl overflow-hidden border border-slate-200 bg-white"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size, display: 'block' }}
        />
      </div>
    </div>
  );
}
