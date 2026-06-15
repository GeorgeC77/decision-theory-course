import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

interface TableColumn {
  key: string;
  label: string;
  editable?: boolean;
  computed?: boolean;
  optimal?: boolean;
}

interface EditableTableProps {
  title: string;
  columns: TableColumn[];
  data: Record<string, string | number>[];
  onDataChange?: (data: Record<string, string | number>[]) => void;
  optimalRow?: number;
}

export default function EditableTable({
  title,
  columns,
  data: initialData,
  onDataChange,
  optimalRow,
}: EditableTableProps) {
  const [data, setData] = useState(initialData);
  const [flashRow, setFlashRow] = useState<number | null>(null);

  const handleChange = useCallback(
    (rowIndex: number, colKey: string, value: string) => {
      const newData = data.map((row, i) => {
        if (i === rowIndex) {
          return { ...row, [colKey]: value };
        }
        return row;
      });
      setData(newData);
      setFlashRow(rowIndex);
      setTimeout(() => setFlashRow(null), 300);
      onDataChange?.(newData);
    },
    [data, onDataChange]
  );

  const handleReset = () => {
    setData(initialData);
    onDataChange?.(initialData);
  };

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E0DDD5' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
            {title}
          </h3>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: '#E8F5E9', color: '#4CAF50' }}
          >
            可编辑
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer"
          style={{ background: '#f1f5f9', color: '#6B6B6B' }}
        >
          <RotateCcw size={13} />
          重置数据
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#2A4A73' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-white font-medium whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                animate={
                  flashRow === rowIndex
                    ? { opacity: [1, 0.6, 1] }
                    : {}
                }
                transition={{ duration: 0.3 }}
                className="transition-colors"
                style={{
                  background: rowIndex % 2 === 0 ? '#ffffff' : '#F8F6F2',
                  borderLeft: optimalRow === rowIndex ? '3px solid #4CAF50' : '3px solid transparent',
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                    {col.editable ? (
                      <input
                        type="text"
                        value={String(row[col.key] ?? '')}
                        onChange={(e) =>
                          handleChange(rowIndex, col.key, e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm text-center rounded-md outline-none transition-all duration-200"
                        style={{
                          border: '1px solid #E0DDD5',
                          background: '#ffffff',
                          color: '#2A4A73',
                          fontWeight: col.computed ? 600 : 400,
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
                    ) : (
                      <span
                        className="block text-center"
                        style={{
                          color: col.computed ? '#2A4A73' : '#6B6B6B',
                          fontWeight: col.computed || col.optimal ? 600 : 400,
                        }}
                      >
                        {col.optimal && optimalRow === rowIndex ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: '#E8F5E9', color: '#4CAF50' }}
                          >
                            最优
                          </span>
                        ) : (
                          String(row[col.key] ?? '')
                        )}
                      </span>
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
