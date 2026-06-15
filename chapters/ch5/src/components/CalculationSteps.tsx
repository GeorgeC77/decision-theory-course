import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';

export interface CalcStep {
  title: string;
  formula?: string;
  result?: string;
  highlight?: boolean;
  optimal?: boolean;
}

interface CalculationStepsProps {
  title?: string;
  steps: CalcStep[];
}

export default function CalculationSteps({
  title = '计算过程',
  steps,
}: CalculationStepsProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E0DDD5' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full cursor-pointer"
      >
        <h3 className="text-lg font-semibold" style={{ color: '#2A4A73' }}>
          {title}
        </h3>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} style={{ color: '#9E9E9E' }} />
        </motion.div>
      </button>

      {/* Steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex flex-col gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="flex flex-col gap-2 p-4 rounded-lg"
                  style={{
                    background: step.optimal
                      ? '#E8F5E9'
                      : step.highlight
                      ? '#eff6ff'
                      : '#F8F6F2',
                    borderLeft: step.optimal
                      ? '3px solid #4CAF50'
                      : step.highlight
                      ? '3px solid #3b82f6'
                      : '3px solid transparent',
                  }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: step.optimal
                        ? '#4CAF50'
                        : step.highlight
                        ? '#2563eb'
                        : '#2A4A73',
                    }}
                  >
                    {step.title}
                  </span>
                  {step.formula && (
                    <code
                      className="text-sm font-mono"
                      style={{ color: '#6B6B6B' }}
                    >
                      {step.formula}
                    </code>
                  )}
                  {step.result && (
                    <div className="flex items-center gap-2 mt-1">
                      <ArrowRight
                        size={14}
                        style={{
                          color: step.optimal
                            ? '#4CAF50'
                            : step.highlight
                            ? '#3b82f6'
                            : '#9E9E9E',
                        }}
                      />
                      <span
                        className="text-sm font-semibold font-mono"
                        style={{
                          color: step.optimal
                            ? '#4CAF50'
                            : step.highlight
                            ? '#2563eb'
                            : '#2A4A73',
                        }}
                      >
                        {step.result}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
