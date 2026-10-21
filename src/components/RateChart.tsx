import React, { useState, useId } from 'react';
import { GoldRateRecord, HistoryRange, PurityKey } from '../types';
import { formatCurrency, formatDate } from '../services/calculations';

interface RateChartProps {
  data: GoldRateRecord[];
  activeRange: HistoryRange;
  onRangeChange: (range: HistoryRange) => void;
  selectedPurity: PurityKey;
  onPurityChange: (purity: PurityKey) => void;
}

export const RateChart: React.FC<RateChartProps> = ({
  data,
  activeRange,
  onRangeChange,
  selectedPurity,
  onPurityChange,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartId = useId();

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#131822] border border-[#232D3F] rounded-2xl p-8 text-center text-gray-400">
        No rate history data available for the selected range.
      </div>
    );
  }

  // Extract rates according to selected purity
  const points = data.map((d) => {
    let selling = d.gold_24k_selling_per_gram;
    let market = d.gold_24k_market_per_gram;

    if (selectedPurity === '22k') {
      selling = d.gold_22k_selling_per_gram;
      market = d.gold_22k_market_per_gram;
    } else if (selectedPurity === 'silver') {
      selling = d.silver_selling_per_gram || 118;
      market = d.silver_market_per_gram || 115;
    }

    return {
      date: d.date,
      selling,
      market,
      raw: d,
    };
  });

  const values = points.map((p) => p.selling);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const paddingVal = Math.max(10, (maxVal - minVal) * 0.15);
  const yMin = Math.floor(minVal - paddingVal);
  const yMax = Math.ceil(maxVal + paddingVal);
  const yRange = yMax - yMin || 1;

  // Chart dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 10;
  const padRight = 10;
  const padTop = 15;
  const padBottom = 25;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const coords = points.map((p, idx) => {
    const x = padLeft + (idx / (points.length - 1 || 1)) * chartW;
    const y = padTop + chartH - ((p.selling - yMin) / yRange) * chartH;
    const yMarket = padTop + chartH - ((p.market - yMin) / yRange) * chartH;
    return { x, y, yMarket, ...p };
  });

  // Construct SVG paths
  const linePath = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
  const marketLinePath = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.yMarket}`, '');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x},${padTop + chartH} L ${coords[0].x},${padTop + chartH} Z`;

  const hoveredPoint = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex] : coords[coords.length - 1];

  const ranges: { id: HistoryRange; label: string }[] = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '3m', label: '3M' },
    { id: '6m', label: '6M' },
    { id: '1y', label: '1Y' },
  ];

  return (
    <div className="bullion-card rounded-2xl p-4 sm:p-6 border border-[#232D3F]">
      {/* Chart Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-300">Rate Trajectory Trend</span>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {selectedPurity === 'silver' ? 'Fine Silver (999)' : `${selectedPurity.toUpperCase()} Gold`}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-gray-400">
              {hoveredPoint ? formatDate(hoveredPoint.date) : ''}
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {hoveredPoint ? formatCurrency(hoveredPoint.selling) : ''}/g
            </span>
          </div>
        </div>

        {/* Filter buttons: 7 days, 30 days, 3 months, 6 months, 1 year */}
        <div className="flex items-center gap-1 bg-[#0E121A] p-1 rounded-xl border border-[#202736] self-start sm:self-auto">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => onRangeChange(r.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeRange === r.id
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A2230]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Purity toggle tabs */}
      <div className="flex items-center gap-2 mb-3">
        {(['24k', '22k', 'silver'] as PurityKey[]).map((p) => (
          <button
            key={p}
            onClick={() => onPurityChange(p)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
              selectedPurity === p
                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]'
                : 'bg-[#121620] border-[#222B3D] text-gray-400 hover:text-gray-200'
            }`}
          >
            {p === '24k' ? '24K (999)' : p === '22k' ? '22K (916)' : 'Silver (999)'}
          </button>
        ))}

        <div className="ml-auto hidden sm:flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#D4AF37] rounded-full inline-block" />
            Selling Rate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-gray-500 rounded-full inline-block" />
            Market Spot
          </span>
        </div>
      </div>

      {/* Interactive SVG Chart Canvas */}
      <div className="relative w-full aspect-[2.4/1] min-h-[190px] select-none touch-pan-x">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`goldGrad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={svgWidth - padRight}
            y2={padTop}
            stroke="#1F293D"
            strokeDasharray="3 3"
          />
          <line
            x1={padLeft}
            y1={padTop + chartH / 2}
            x2={svgWidth - padRight}
            y2={padTop + chartH / 2}
            stroke="#1F293D"
            strokeDasharray="3 3"
          />
          <line
            x1={padLeft}
            y1={padTop + chartH}
            x2={svgWidth - padRight}
            y2={padTop + chartH}
            stroke="#1F293D"
          />

          {/* Fill area */}
          <path d={areaPath} fill={`url(#goldGrad-${chartId})`} />

          {/* Market spot benchmark line (subtle dashed gray) */}
          <path
            d={marketLinePath}
            fill="none"
            stroke="#64748B"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Our Selling Rate main line (vibrant gold) */}
          <path
            d={linePath}
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points / Hover interaction overlay */}
          {coords.map((pt, i) => {
            const isHovered = hoverIndex === i;
            return (
              <g key={pt.date}>
                {/* Touch/mouse target hitbox */}
                <rect
                  x={pt.x - chartW / (coords.length * 2)}
                  y={0}
                  width={chartW / (coords.length || 1)}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                  onTouchStart={() => setHoverIndex(i)}
                />

                {isHovered && (
                  <>
                    <line
                      x1={pt.x}
                      y1={padTop}
                      x2={pt.x}
                      y2={padTop + chartH}
                      stroke="#E6C657"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#D4AF37"
                      stroke="#0B0E14"
                      strokeWidth="2"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Axis dates */}
      <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-1 px-1">
        <span>{formatDate(data[0].date)}</span>
        <span className="text-gray-400">
          Range: {data.length} recorded rate days
        </span>
        <span>{formatDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
};
