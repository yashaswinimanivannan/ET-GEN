import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiZap, FiArrowLeft, FiFileText, FiShield, FiCheckCircle,
  FiAlertTriangle, FiRefreshCw, FiTrendingUp, FiArrowRight, FiChevronLeft, FiChevronRight, FiMessageCircle
} from 'react-icons/fi';

const riskScoreConfig = {
  High: { 
    color: 'text-rose-600', 
    bg: 'bg-rose-50', 
    border: 'border-rose-100', 
    shadow: 'shadow-[0_4px_15px_rgb(225,29,72,0.15)]',
    icon: FiAlertTriangle, 
    badgeBg: 'bg-rose-500',
  },
  Medium: { 
    color: 'text-amber-600', 
    bg: 'bg-amber-50', 
    border: 'border-amber-100', 
    shadow: 'shadow-[0_4px_15px_rgb(217,119,6,0.15)]',
    icon: FiShield, 
    badgeBg: 'bg-amber-500',
  },
  Low: { 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-100', 
    shadow: 'shadow-[0_4px_15px_rgb(5,150,105,0.15)]',
    icon: FiCheckCircle, 
    badgeBg: 'bg-emerald-500',
  },
};

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, documentText, filename, language } = location.state || {};

  const [currentRiskIndex, setCurrentRiskIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [activeSuggestions, setActiveSuggestions] = useState([]);

  const toggleSuggestion = (index) => {
    setActiveSuggestions(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-[var(--color-bg)]">
         <div className="glass rounded-3xl p-10 text-center max-w-md border border-slate-200 bg-white/80">
           <h2 className="text-2xl font-bold text-slate-800 mb-3">No Analysis Data</h2>
           <Link to="/upload" className="inline-flex px-8 py-4 bg-primary text-white rounded-2xl font-bold">
             Go to Upload
           </Link>
         </div>
       </div>
    );
  }

  const riskScore = analysis.risk_score || 'Medium';
  const scoreConfig = riskScoreConfig[riskScore] || riskScoreConfig.Medium;
  const risks = analysis.risks || [];

  const handleNextRisk = () => {
    setDirection(1);
    setCurrentRiskIndex((prev) => (prev + 1) % risks.length);
  };

  const handlePrevRisk = () => {
    setDirection(-1);
    setCurrentRiskIndex((prev) => (prev === 0 ? risks.length - 1 : prev - 1));
  };

  const handleChatNavigation = () => {
    navigate('/chat', {
      state: { documentText, language }
    });
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.4 } },
    exit: (dir) => ({ x: dir < 0 ? 50 : -50, opacity: 0, scale: 0.95, transition: { duration: 0.3 } })
  };

  const getRiskStyle = (severity) => {
    if (!severity) return riskScoreConfig.Medium;
    const normalized = severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
    return riskScoreConfig[normalized] || riskScoreConfig.Medium;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F6F8] font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 shadow-sm border-b border-white/60 bg-white/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[19px] font-black text-slate-800 tracking-tight hidden sm:block">FinSight</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/upload')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary transition-colors px-4 py-2.5 rounded-xl">
              <FiRefreshCw className="w-4 h-4" /> Analyze Another
            </button>
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors px-4 py-2.5 rounded-xl">
              <FiArrowLeft className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex-1 flex justify-center px-4 sm:px-8 py-10 w-full relative z-10">
        <div className="w-full max-w-[800px] space-y-12">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-2">
            <div>
              <h1 className="text-3xl font-black text-slate-800">Analysis Results</h1>
              <p className="text-slate-500 text-sm font-medium mt-2 inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <FiFileText className="w-4 h-4 text-primary" />
                <span className="truncate max-w-[200px]">{filename || 'Document'}</span> &middot; {analysis.language || language}
              </p>
            </div>
            
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border ${scoreConfig.bg} ${scoreConfig.border} shadow-sm`}>
               <div className={`text-xl font-black uppercase tracking-wide text-slate-800`}>
                 {riskScore} Risk
               </div>
            </div>
          </div>

          {/* 1. Summary Box with Glow Effect */}
          <div className="relative group">
             {/* Glowing Aura */}
             <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-primary to-purple-500 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition duration-500" />
             
             <div className="bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-100 shadow-xl text-center relative overflow-hidden z-10">
                <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-indigo-100 to-purple-50 flex items-center justify-center text-indigo-600 mx-auto mb-5 border border-indigo-200/50 shadow-sm">
                  <FiFileText className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800 mb-4">Document Summary</h2>
                <p className="text-slate-600 text-[16px] leading-[1.8] font-medium max-w-[650px] mx-auto">
                  {analysis.summary}
                </p>
             </div>
          </div>

          {/* 2. Square Shape Slider for Risks with Image Background and Colorful Glow */}
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-3 mb-6 w-full justify-center">
               <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
                 <FiShield className="w-6 h-6" />
               </div>
               <h2 className="text-2xl font-black text-slate-800">Identified Risks</h2>
             </div>
             
             <div className="relative group w-full max-w-[440px] mx-auto">
               {/* Massive Glowing Aura behind Slider */}
               <div className="absolute -inset-1.5 bg-gradient-to-br from-rose-500 via-primary to-purple-600 rounded-[3rem] blur-2xl opacity-25 group-hover:opacity-40 transition duration-700" />
               
               {/* Square Container */}
               <div className="w-full aspect-square bg-slate-900 border border-slate-700 rounded-[2.5rem] p-5 flex flex-col relative overflow-hidden shadow-2xl z-10">
                 
                 {/* App Related Blurred Image Background */}
                 <div className="absolute inset-0 w-full h-full bg-[url('/hero-image.png')] bg-cover bg-center opacity-10 blur-sm pointer-events-none mix-blend-screen" />
                 
                 {/* Rich Gradient Overlays inside the dark slider */}
                 <div className="absolute inset-0 w-full h-full pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
                 <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-rose-500 via-transparent to-transparent" />

                 {/* Fixed Controls Overlay */}
                 {risks.length > 1 && (
                    <div className="absolute top-5 right-5 flex items-center gap-1.5 z-20 bg-white/10 backdrop-blur-xl shadow-lg p-1.5 rounded-full border border-white/20">
                       <button 
                         onClick={handlePrevRisk}
                         className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 text-white transition focus:outline-none"
                       >
                          <FiChevronLeft className="w-4 h-4" />
                       </button>
                       <div className="text-[13px] font-bold text-white min-w-[32px] text-center tracking-widest opacity-90">
                          {currentRiskIndex + 1}/{risks.length}
                       </div>
                       <button 
                         onClick={handleNextRisk}
                         className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 text-white transition focus:outline-none"
                       >
                          <FiChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                 )}

                 <div className="flex-1 w-full relative h-full mt-4">
                   {risks.length > 0 ? (
                      <AnimatePresence custom={direction} mode="wait">
                         <motion.div
                            key={currentRiskIndex}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="w-full h-full absolute inset-0 flex flex-col items-center justify-center"
                         >
                           {(() => {
                              const style = getRiskStyle(risks[currentRiskIndex].severity);
                              return (
                                 <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/40 flex flex-col items-center justify-center text-center relative z-10 hover:-translate-y-1 transition-transform duration-300">
                                   {/* Inner Floating Risk Card in light theme to contrast dark slider */}
                                   {/* Decorative glow strictly tied to the severity inside the white card */}
                                   <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full ${style.bg} blur-2xl opacity-70 mix-blend-multiply pointer-events-none`} />

                                   <div className={`w-16 h-16 rounded-[1.25rem] mx-auto flex items-center justify-center mb-5 shadow-sm border ${style.bg} ${style.border} ${style.color} relative z-10 bg-white`}>
                                     <FiAlertTriangle className="w-7 h-7" />
                                   </div>
                                   <h4 className="font-extrabold text-[19px] sm:text-[21px] text-slate-800 mb-3 line-clamp-3 leading-snug relative z-10 tracking-tight">
                                     {risks[currentRiskIndex].type || 'Risk Detected'}
                                   </h4>
                                   <p className="text-slate-600 text-[14px] leading-relaxed line-clamp-4 max-w-[280px] mx-auto relative z-10 font-medium">
                                     {risks[currentRiskIndex].detail || (typeof risks[currentRiskIndex] === 'string' ? risks[currentRiskIndex] : 'Review this section carefully.')}
                                   </p>
                                 </div>
                              );
                           })()}
                         </motion.div>
                      </AnimatePresence>
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 text-center pb-6">
                        <FiCheckCircle className="w-16 h-16 mb-4 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                        <p className="text-[19px] font-bold text-white">No significant risks detected.</p>
                        <p className="text-[15px] font-medium mt-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 text-slate-200">Ready to proceed securely.</p>
                      </div>
                   )}
                 </div>
                 
                 {/* Dots Indicator locked to the bottom inside the dark square */}
                 {risks.length > 1 && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                      {risks.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setDirection(idx > currentRiskIndex ? 1 : -1);
                            setCurrentRiskIndex(idx);
                          }}
                          className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentRiskIndex ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]' : 'w-2.5 bg-white/20 hover:bg-white/40'}`}
                        />
                      ))}
                    </div>
                 )}
               </div>
             </div>
          </div>

          {/* 3. Suggestions List with Glow Effect */}
          <div className="relative group mt-8">
             {/* Glowing Aura */}
             <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition duration-500" />
             
             <div className="bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-100 shadow-xl relative z-10">
               <div className="flex items-center gap-4 mb-8 justify-center">
                 <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                   <FiTrendingUp className="w-6 h-6" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-800">Actionable Suggestions</h2>
               </div>
               
               <div className="space-y-4 max-w-[650px] mx-auto">
                  {analysis.suggestions && analysis.suggestions.length > 0 ? (
                    analysis.suggestions.map((suggestion, i) => {
                      const isActive = activeSuggestions.includes(i);
                      return (
                        <div 
                           key={i} 
                           onClick={() => toggleSuggestion(i)}
                           className={`rounded-2xl p-5 sm:p-6 flex items-start gap-4 transition-all cursor-pointer group/item select-none hover:-translate-y-0.5 ${
                             isActive 
                                ? 'bg-gradient-to-br from-indigo-600 via-primary to-purple-600 shadow-[0_10px_30px_rgba(79,70,229,0.25)] border-transparent ring-2 ring-indigo-500/50 ring-offset-2' 
                                : 'bg-slate-50/80 border border-slate-200 hover:shadow-md hover:border-indigo-300'
                           }`}
                        >
                          <div className={`w-8 h-8 rounded-[0.8rem] shadow-sm flex items-center justify-center shrink-0 font-black text-[14px] mt-0.5 transition-all ${
                             isActive 
                                ? 'bg-white/20 text-white border border-white/30 backdrop-blur-md' 
                                : 'bg-white border border-slate-200 text-slate-500 group-hover/item:text-indigo-600 group-hover/item:border-indigo-200'
                          }`}>
                            {i + 1}
                          </div>
                          <p className={`text-[15.5px] font-medium leading-[1.6] transition-colors ${isActive ? 'text-white' : 'text-slate-700 group-hover/item:text-slate-900'}`}>
                            {suggestion}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">No suggestions generated.</p>
                  )}
               </div>
             </div>
          </div>

          {/* 4. Chat Redirect Button */}
          <div className="text-center pt-8 pb-14 relative z-20">
             <button
               onClick={handleChatNavigation}
               className="inline-flex items-center justify-center gap-3 px-12 py-5 bg-gradient-to-r from-slate-800 to-black hover:from-black hover:to-slate-900 text-white text-[17px] font-bold rounded-[1.25rem] transition-all shadow-[0_10px_25px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.3)] hover:-translate-y-1 w-full sm:w-auto"
             >
               <FiMessageCircle className="w-6 h-6" />
               Go to Document Chat
               <FiArrowRight className="w-6 h-6 ml-2" />
             </button>
             <p className="mt-5 text-[14px] text-slate-500 font-medium">Have specific questions? Discuss them with our AI.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
