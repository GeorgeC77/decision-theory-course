import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export type ChartType = 'line' | 'bar' | 'radar';

interface InteractiveChartProps {
  title: string;
  description?: string;
  type: ChartType;
  data: Record<string, string | number>[];
  dataKeys: string[];
  xAxisKey: string;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = ['#3b82f6', '#4CAF50', '#C8963E', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function InteractiveChart({
  title,
  description,
  type,
  data,
  dataKeys,
  xAxisKey,
  colors = DEFAULT_COLORS,
  height = 350,
}: InteractiveChartProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const toggleKey = (key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E0DDD5' }}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
          {title}
        </h3>
        {description && (
          <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
            {description}
          </p>
        )}
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B6B6B' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E0DDD5',
                  fontSize: '13px',
                }}
              />
              <Legend
                onClick={(e) => {
                  if (e && e.value) toggleKey(e.value);
                }}
                wrapperStyle={{ cursor: 'pointer', fontSize: '13px' }}
              />
              {dataKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  hide={hiddenKeys.has(key)}
                />
              ))}
            </LineChart>
          ) : type === 'bar' ? (
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD5" />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B6B6B' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E0DDD5',
                  fontSize: '13px',
                }}
              />
              <Legend
                onClick={(e) => {
                  if (e && e.value) toggleKey(e.value);
                }}
                wrapperStyle={{ cursor: 'pointer', fontSize: '13px' }}
              />
              {dataKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[i % colors.length]}
                  radius={[4, 4, 0, 0]}
                  hide={hiddenKeys.has(key)}
                />
              ))}
            </BarChart>
          ) : (
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#E0DDD5" />
              <PolarAngleAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
              <PolarRadiusAxis tick={{ fontSize: 11, fill: '#9E9E9E' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E0DDD5',
                  fontSize: '13px',
                }}
              />
              <Legend
                onClick={(e) => {
                  if (e && e.value) toggleKey(e.value);
                }}
                wrapperStyle={{ cursor: 'pointer', fontSize: '13px' }}
              />
              {dataKeys.map((key, i) => (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  fill={colors[i % colors.length]}
                  fillOpacity={0.2}
                  hide={hiddenKeys.has(key)}
                />
              ))}
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
