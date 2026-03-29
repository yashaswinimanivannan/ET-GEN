import { motion } from 'framer-motion';
import { FiAlertTriangle, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const severityConfig = {
  high: {
    icon: FiAlertTriangle,
    color: 'text-risk-high',
    bg: 'bg-risk-high/10',
    border: 'border-risk-high/30',
    glow: 'glow-risk-high',
    label: 'High Risk',
    labelBg: 'bg-risk-high/20 text-risk-high',
  },
  medium: {
    icon: FiAlertCircle,
    color: 'text-risk-medium',
    bg: 'bg-risk-medium/10',
    border: 'border-risk-medium/30',
    glow: 'glow-risk-medium',
    label: 'Medium Risk',
    labelBg: 'bg-risk-medium/20 text-risk-medium',
  },
  low: {
    icon: FiCheckCircle,
    color: 'text-risk-low',
    bg: 'bg-risk-low/10',
    border: 'border-risk-low/30',
    glow: 'glow-risk-low',
    label: 'Low Risk',
    labelBg: 'bg-risk-low/20 text-risk-low',
  },
};

export default function RiskCard({ risk, index = 0 }) {
  const severity = (risk.severity || 'medium').toLowerCase();
  const config = severityConfig[severity] || severityConfig.medium;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`relative rounded-xl p-4 border ${config.border} ${config.bg} ${config.glow} transition-all duration-300 hover:scale-[1.01]`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg} mt-0.5`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h4 className={`font-semibold text-sm ${config.color}`}>
              {risk.type || 'Risk Detected'}
            </h4>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.labelBg}`}>
              {config.label}
            </span>
          </div>
          <p className="text-text-muted text-sm leading-relaxed">
            {risk.detail || (typeof risk === 'string' ? risk : 'Review this section carefully.')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
