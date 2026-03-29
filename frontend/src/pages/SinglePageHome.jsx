import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FiZap, FiUploadCloud, FiFile, FiX, FiCheck, FiDollarSign, FiTarget,
  FiArrowRight, FiFileText, FiShield, FiAlertTriangle, FiCheckCircle, FiTrendingUp
} from 'react-icons/fi';
import LanguageSelector from '../components/LanguageSelector';
import RiskCard from '../components/RiskCard';
import ChatSection from '../components/ChatSection';
import { uploadDocument, analyzeDocument } from '../services/api';

const riskScoreConfig = {
  High: { color: 'text-risk-high', bg: 'bg-risk-high/10', border: 'border-risk-high/30', icon: FiAlertTriangle, message: 'This document contains significant risks. Review carefully before signing.' },
  Medium: { color: 'text-risk-medium', bg: 'bg-risk-medium/10', border: 'border-risk-medium/30', icon: FiShield, message: 'Some risks detected. Pay attention to the highlighted areas below.' },
  Low: { color: 'text-risk-low', bg: 'bg-risk-low/10', border: 'border-risk-low/30', icon: FiCheckCircle, message: 'This document appears relatively safe. Standard precautions apply.' },
};

export default function SinglePageHome() {
  const [file, setFile] = useState(null);
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');
  const [language, setLanguage] = useState('English');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Analysis state
  const [analysisResult, setAnalysisResult] = useState(null);
  const [documentText, setDocumentText] = useState('');
  const [filename, setFilename] = useState('');

  const resultsRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]?.type === 'application/pdf') {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a PDF document first.');
      return;
    }
    setError('');
    setIsUploading(true);
    setAnalysisResult(null);

    try {
      const uploadResult = await uploadDocument(file);
      if (!uploadResult.success) {
        setError('Failed to process the document. Please try again.');
        setIsUploading(false);
        return;
      }
      if (!uploadResult.text && uploadResult.warning) {
        setError(uploadResult.warning);
        setIsUploading(false);
        return;
      }

      setIsUploading(false);
      setIsAnalyzing(true);

      const analysis = await analyzeDocument({
        text: uploadResult.text,
        income: income || null,
        goal: goal || null,
        language: language,
      });

      setAnalysisResult(analysis);
      setDocumentText(uploadResult.text);
      setFilename(uploadResult.filename);
      setIsAnalyzing(false);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error:', err);
      setError(
        err.response?.data?.detail ||
        'Failed to analyze the document. Make sure the backend server is running.'
      );
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setAnalysisResult(null);
    setDocumentText('');
    setFilename('');
    setIncome('');
    setGoal('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderAnalysis = () => {
    if (!analysisResult) return null;

    const riskScore = analysisResult.risk_score || 'Medium';
    const scoreConfig = riskScoreConfig[riskScore] || riskScoreConfig.Medium;
    const ScoreIcon = scoreConfig.icon;

    return (
      <div ref={resultsRef} className="max-w-5xl mx-auto mt-16 px-8 pb-20 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass bg-white p-6 rounded-2xl"
        >
          <div>
            <h2 className="text-2xl md:text-[28px] font-bold tracking-tight mb-1.5 text-slate-800">
              Analysis <span className="gradient-text">Results</span>
            </h2>
            <p className="text-text-muted text-sm flex items-center gap-2">
              <FiFileText className="w-3.5 h-3.5" />
              {filename || 'Document'} &middot; {analysisResult.language || language}
            </p>
          </div>

          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${scoreConfig.bg} ${scoreConfig.border}`}>
            <ScoreIcon className={`w-5 h-5 ${scoreConfig.color}`} />
            <div>
              <div className={`text-sm font-bold leading-none ${scoreConfig.color}`}>
                {riskScore} Risk
              </div>
              <div className="text-[11px] text-text-muted mt-1">Overall Score</div>
            </div>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 8 }}
           animate={{ opacity: 1, y: 0 }}
           className={`rounded-xl px-5 py-3.5 border ${scoreConfig.border} ${scoreConfig.bg}`}
        >
          <p className={`text-sm font-medium ${scoreConfig.color}`}>
            {scoreConfig.message}
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-7 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FiFileText className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-[17px] font-bold text-text">Document Summary</h3>
          </div>
          <p className="text-text-muted text-[15px] leading-[1.75]">
            {analysisResult.summary}
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-7 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
             <div className="w-10 h-10 rounded-xl bg-risk-high/10 flex items-center justify-center">
               <FiShield className="w-5 h-5 text-risk-high" />
             </div>
             <h3 className="text-[17px] font-bold text-text">Risk Warnings</h3>
             <span className="text-xs px-2.5 py-1 rounded-full bg-surface-lighter text-text-muted font-medium ml-1">
               {analysisResult.risks?.length || 0} found
             </span>
          </div>
          <div className="space-y-3">
             {analysisResult.risks && analysisResult.risks.length > 0 ? (
               analysisResult.risks.map((risk, i) => (
                 <RiskCard key={i} risk={risk} index={i} />
               ))
             ) : (
                <div className="text-center py-8 text-text-muted">
                  <FiCheckCircle className="w-8 h-8 mx-auto mb-2 text-risk-low" />
                  <p className="text-sm">No significant risks detected</p>
                </div>
             )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-7 shadow-sm"
        >
           <div className="flex items-center gap-3 mb-5">
             <div className="w-10 h-10 rounded-xl bg-risk-low/10 flex items-center justify-center">
               <FiTrendingUp className="w-5 h-5 text-risk-low" />
             </div>
             <h3 className="text-[17px] font-bold text-text">Personalized Suggestions</h3>
           </div>
           <div className="space-y-3">
             {analysisResult.suggestions?.map((suggestion, i) => (
               <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-surface-lighter border border-border/40">
                 <div className="w-7 h-7 rounded-full bg-risk-low/10 flex items-center justify-center shrink-0 mt-0.5">
                   <span className="text-xs font-bold text-risk-low">{i + 1}</span>
                 </div>
                 <p className="text-text-muted text-sm leading-relaxed flex-1">{suggestion}</p>
               </div>
             ))}
           </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ChatSection documentText={documentText} language={language} />
        </motion.section>

        <div className="text-center pt-8">
           <button
             onClick={resetForm}
             className="px-6 py-3 bg-surface border border-border hover:bg-surface-light text-text font-medium rounded-xl transition-all shadow-sm"
           >
             Analyze Another Document
           </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 shadow-sm border-b border-white/50">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
              <FiZap className="w-[18px] h-[18px] text-primary" />
            </div>
            <span className="text-lg font-bold gradient-text tracking-tight">FinSight AI</span>
          </div>
        </div>
      </nav>

      <div className="flex-1">
        {/* Hero & Upload */}
        <section className="relative px-8 pt-20 pb-16 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.15] tracking-tight mb-5 text-slate-800"
            >
              Understand Your <span className="gradient-text">Financial</span> Documents Easily
            </motion.h1>
            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="text-[clamp(1rem,2vw,1.15rem)] text-text-muted max-w-[540px] mx-auto mb-10 leading-relaxed"
            >
              Upload any agreement or bank statement and get instant AI analysis, risk detection,
              and simple explanations.
            </motion.p>
          </div>

          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="max-w-[560px] mx-auto glass rounded-2xl p-8 shadow-md border border-slate-200/60 relative z-10"
          >
             {!file ? (
                <label
                  htmlFor="file-upload-input"
                  className={`relative block w-full py-10 px-6 rounded-xl cursor-pointer transition-all duration-200 border-2 border-dashed text-center
                    ${dragActive
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : 'border-slate-300 hover:border-primary/40 hover:bg-slate-50'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dragActive ? 'bg-primary/10' : 'bg-slate-100'}`}>
                      <FiUploadCloud className={`w-7 h-7 ${dragActive ? 'text-primary' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-slate-700">
                        {dragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        or <span className="text-primary font-medium">browse files</span>
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">PDF files up to 10MB</p>
                  </div>
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
             ) : (
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                      <FiFile className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-risk-low/10 flex items-center justify-center text-risk-low">
                        <FiCheck className="w-4 h-4" />
                      </div>
                    )}
                    <button
                      onClick={() => setFile(null)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 transition-colors"
                      disabled={isUploading || isAnalyzing}
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
             )}

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 mb-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    <FiDollarSign className="w-4 h-4 text-primary/60" /> Monthly Income
                  </label>
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full h-11 bg-white border border-slate-200 rounded-lg px-4 text-slate-800 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    <FiTarget className="w-4 h-4 text-primary/60" /> Financial Goal
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Save for a car"
                    className="w-full h-11 bg-white border border-slate-200 rounded-lg px-4 text-slate-800 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder-slate-400"
                  />
                </div>
             </div>

             <LanguageSelector value={language} onChange={setLanguage} />

             {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mt-6">
                  <span className="shrink-0 mt-0.5"><FiAlertTriangle /></span>
                  <span>{error}</span>
                </div>
             )}

             <button
                onClick={handleSubmit}
                disabled={!file || isUploading || isAnalyzing}
                className={`w-full mt-6 h-12 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-3 transition-all
                  ${file
                    ? 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
             >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing Document...
                  </>
                ) : isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    Analyze Document
                    <FiArrowRight className="w-5 h-5" />
                  </>
                )}
             </button>
          </motion.div>
        </section>

        {isAnalyzing && !analysisResult && (
          <div className="py-20 text-center text-text-muted flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="font-medium text-slate-700">AI is reading your document...</p>
            <p className="text-sm mt-1 text-slate-500">Extracting risks and finding insights</p>
          </div>
        )}

        {/* Results */}
        {renderAnalysis()}
        
      </div>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto px-8 py-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-500 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <FiZap className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-slate-700">FinSight AI</span>
          </div>
          <span className="hidden sm:inline">Built for smarter financial decisions</span>
        </div>
      </footer>
    </div>
  );
}
