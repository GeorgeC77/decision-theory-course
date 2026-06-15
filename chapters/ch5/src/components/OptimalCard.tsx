import { CheckCircle } from 'lucide-react';

interface OptimalCardProps {
  title?: string;
  name: string;
  value?: string;
  description?: string;
}

export default function OptimalCard({
  title = '最优决策方案',
  name,
  value,
  description,
}: OptimalCardProps) {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: '#E8F5E9',
        borderLeft: '4px solid #4CAF50',
      }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle size={18} style={{ color: '#4CAF50' }} />
        <span className="text-sm font-semibold" style={{ color: '#4CAF50' }}>
          {title}
        </span>
      </div>

      {/* Name */}
      <div className="text-[22px] font-bold mb-2" style={{ color: '#1B3A5F' }}>
        {name}
      </div>

      {/* Value */}
      {value && (
        <div className="text-lg font-semibold mb-2" style={{ color: '#C8963E' }}>
          {value}
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm leading-relaxed" style={{ color: '#6B6B6B' }}>
          {description}
        </p>
      )}
    </div>
  );
}
