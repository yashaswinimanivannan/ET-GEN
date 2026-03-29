import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiZap, FiArrowRight } from 'react-icons/fi';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 shadow-sm border-b border-white/50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
              <FiZap className="w-[18px] h-[18px] text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text tracking-tight">FinSight AI</span>
          </div>
          <Link
            to="/upload"
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary/20"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center pt-6 pb-20 relative overflow-hidden px-8">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
             initial={{ opacity: 0, x: -25 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.6 }}
             className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass bg-white mb-6 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-risk-low animate-pulse" />
              <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">AI-Powered Analysis</span>
            </div>

            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight mb-6 text-slate-800">
              Your <span className="gradient-text">Financial</span> Documents Made Simple
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Upload complex loan agreements, insurance policies, or statements. Get an instant explanation, risk analysis, and actionable advice to make smarter financial decisions.
            </p>

            <Link to="/upload">
              <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="px-8 py-4 bg-primary hover:bg-primary-dark text-white text-lg font-bold rounded-xl flex items-center gap-3 shadow-lg shadow-primary/25 transition-all"
              >
                Get Started
                <FiArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, x: 25 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.6, delay: 0.1 }}
             className="hidden md:flex justify-center"
          >
             <img 
               src="/hero-image.png" 
               alt="Financial AI Illustration" 
               className="w-full max-w-[550px] object-contain drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500" 
             />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto px-8 py-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <FiZap className="w-4 h-4 text-primary" />
            <span className="font-semibold text-slate-700">FinSight AI</span>
          </div>
          <span>Built for clarity. Designed for you.</span>
        </div>
      </footer>
    </div>
  );
}
