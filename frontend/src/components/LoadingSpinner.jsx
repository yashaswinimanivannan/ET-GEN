import { motion } from 'framer-motion';

export default function LoadingSpinner({ message = 'Analyzing your document...' }) {
  const steps = [
    'Extracting text from document',
    'Running AI analysis',
    'Detecting risks & opportunities',
    'Preparing your results',
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Animated circles */}
      <div className="relative w-24 h-24 mb-8">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-primary/50"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        />
        <motion.div
          className="absolute inset-4 rounded-full border-2 border-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ borderTopColor: 'transparent' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-6 h-6 rounded-full bg-primary"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Message */}
      <motion.p
        className="text-text font-semibold text-lg mb-6"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>

      {/* Steps */}
      <div className="space-y-2 w-64">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.8, duration: 0.4 }}
            className="flex items-center gap-2 text-sm"
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.8 + 0.2 }}
            />
            <span className="text-text-muted">{step}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
