import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiArrowLeft, FiDollarSign, FiTarget, FiArrowRight, FiUploadCloud, FiFile, FiX, FiCheck, FiAlertTriangle, FiLock } from 'react-icons/fi';
import LanguageSelector from '../components/LanguageSelector';
import { uploadDocument, analyzeDocument } from '../services/api';

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');
  const [language, setLanguage] = useState('English');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

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
    } else {
      setError('Please upload a valid PDF file.');
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

      const analysisResult = await analyzeDocument({
        text: uploadResult.text,
        income: income || null,
        goal: goal || null,
        language: language,
      });

      navigate('/results', {
        state: {
          analysis: analysisResult,
          documentText: uploadResult.text,
          filename: uploadResult.filename,
          language: language,
        },
      });
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

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F9FD] font-sans">
        <nav className="glass sticky top-0 z-50 border-b border-indigo-100 bg-white/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[19px] font-black text-slate-800 tracking-tight">FinSight</span>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center text-slate-700 relative overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
           <div className="w-20 h-20 border-[5px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8 relative z-10 shadow-lg shadow-indigo-500/10" />
           <h2 className="font-black text-3xl text-slate-800 relative z-10 tracking-tight">AI is evaluating your document</h2>
           <p className="text-[16px] font-medium mt-3 text-slate-500 max-w-sm relative z-10 leading-relaxed">Cross-referencing legal clauses, extracting hidden risks, and preparing your custom insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FD] relative overflow-hidden font-sans">
      {/* Heavy Violet Ambient Background */}
      <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 shadow-sm border-b border-indigo-100/60 bg-white/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[19px] font-black text-slate-800 tracking-tight hidden sm:block leading-none">FinSight</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-[14px] font-bold text-slate-500 hover:text-indigo-600 transition-colors px-4 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content Professional Multi-Column Layout */}
      <div className="flex-1 w-full mx-auto flex items-center justify-center px-4 sm:px-8 py-8 sm:py-16 relative z-10 min-h-[calc(100vh-80px)]">
        <motion.div
           initial={{ opacity: 0, y: 30, scale: 0.98 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           transition={{ duration: 0.5, ease: "easeOut" }}
           className="w-full max-w-[1000px]"
        >
          {/* Main Container */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.1)] ring-1 ring-slate-200/80 relative overflow-hidden flex flex-col md:flex-row border border-slate-100">
             
             {/* Gradient Border Accent */}
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-primary to-purple-600" />

             {/* ── LEFT COLUMN: File Upload ── */}
             <div className="flex-1 p-10 sm:p-12 flex flex-col relative z-10 border-b md:border-b-0 md:border-r border-slate-100">
                <div className="mb-8">
                   <h1 className="text-[32px] sm:text-[38px] font-black tracking-tight mb-4 text-slate-800 leading-[1.15]">
                     Smart <br/>
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Document Upload</span>
                   </h1>
                   <p className="text-slate-500 text-[15.5px] leading-relaxed font-medium">
                     Securely upload your financial PDF. Our AI automatically extracts clauses, identifies risks, and curates professional insight.
                   </p>
                </div>

                <div className="flex-1 flex flex-col justify-center min-h-[260px] mb-6">
                  {!file ? (
                     <label
                       htmlFor="file-upload-input"
                       className={`relative flex flex-col items-center justify-center w-full h-full py-12 px-6 rounded-[2rem] cursor-pointer transition-all duration-300 border-[2.5px] border-dashed text-center
                         ${dragActive
                           ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-[inset_0_4px_20px_rgba(79,70,229,0.05)]'
                           : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                         }`}
                       onDragEnter={handleDrag}
                       onDragLeave={handleDrag}
                       onDragOver={handleDrag}
                       onDrop={handleDrop}
                     >
                       <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-5 transition-all duration-300 ${dragActive ? 'bg-indigo-600 shadow-[0_8px_30px_rgba(79,70,229,0.3)] text-white scale-110' : 'bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-slate-100 text-indigo-500 group-hover:-translate-y-1'}`}>
                         <FiUploadCloud className={`w-9 h-9`} />
                       </div>
                       <div className="space-y-1.5">
                         <p className="text-[19px] font-black text-slate-800">
                           {dragActive ? 'Drop to Attach' : 'Select PDF Document'}
                         </p>
                         <p className="text-[14.5px] font-medium text-slate-500">
                           or drag & drop it directly here
                         </p>
                       </div>
                       <p className="text-[12px] font-bold text-slate-400 mt-6 bg-slate-100/80 px-4 py-1.5 rounded-full inline-block tracking-wider uppercase border border-slate-200/60">
                         Max file size: 10MB
                       </p>
                       
                       <input
                         id="file-upload-input"
                         type="file"
                         accept=".pdf"
                         className="hidden"
                         onChange={handleFileInput}
                       />
                     </label>
                  ) : (
                     <div className="flex flex-col items-center justify-center w-full h-full p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 relative overflow-hidden group">
                       <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-0 pointer-events-none" />
                       
                       <div className="w-16 h-16 rounded-[1.25rem] bg-white shadow-sm border border-indigo-100 flex items-center justify-center mb-5 relative z-10 transition-transform group-hover:scale-105">
                         <FiFile className="w-8 h-8 text-indigo-600" />
                       </div>
                       
                       <div className="text-center relative z-10 w-full mb-8">
                         <p className="text-[17px] font-black text-slate-800 truncate px-4 mb-1">{file.name}</p>
                         <p className="text-[14px] font-bold text-indigo-500 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                       </div>

                       <div className="flex items-center justify-center gap-4 relative z-10">
                         {isUploading ? (
                           <div className="flex items-center gap-2 text-indigo-600 font-bold bg-white px-5 py-2.5 rounded-full shadow-sm border border-indigo-100">
                              <div className="w-4 h-4 border-[2px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              Uploading...
                           </div>
                         ) : (
                           <>
                             <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm ring-4 ring-emerald-500/20">
                               <FiCheck className="w-5 h-5 font-bold" />
                             </div>
                             <button
                               onClick={() => setFile(null)}
                               className="flex items-center gap-2 bg-white text-rose-500 font-bold px-5 py-2.5 rounded-full shadow-sm border border-slate-200 hover:bg-rose-50 hover:border-rose-200 transition-all font-sans text-sm"
                               disabled={isUploading}
                             >
                                <FiX className="w-4 h-4" /> Remove
                             </button>
                           </>
                         )}
                       </div>
                     </div>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-center sm:justify-start gap-2 text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                   <FiLock className="w-4 h-4 text-emerald-500" />
                   Fully Encrypted & Private
                </div>
             </div>

             {/* ── RIGHT COLUMN: Form Data & Submit ── */}
             <div className="flex-[0.8] bg-[#FAFBFF] p-10 sm:p-12 flex flex-col relative z-20">
               <h3 className="text-[17px] font-black text-slate-800 tracking-tight flex items-center gap-3 mb-8 pb-4 border-b border-slate-200/60">
                 <div className="w-8 h-8 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                   <FiTarget className="w-4 h-4" />
                 </div>
                 Analysis Parameters
                 <span className="text-[10.5px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-extrabold text-slate-500 ml-auto tracking-widest uppercase">Optional</span>
               </h3>
               
               <div className="space-y-6 flex-1">
                  {/* Income Input */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Monthly Income</label>
                    <div className="relative group/input">
                       <input
                         type="number"
                         value={income}
                         onChange={(e) => setIncome(e.target.value)}
                         placeholder="e.g. 50000"
                         className="w-full h-[52px] bg-white border border-slate-200/80 rounded-[1.25rem] px-5 text-slate-800 text-[15.5px] font-bold transition-all placeholder-slate-300 shadow-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                       />
                    </div>
                  </div>
                  
                  {/* Goal Input */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Financial Goal</label>
                    <div className="relative group/input">
                       <input
                         type="text"
                         value={goal}
                         onChange={(e) => setGoal(e.target.value)}
                         placeholder="e.g. Save for a car"
                         className="w-full h-[52px] bg-white border border-slate-200/80 rounded-[1.25rem] px-5 text-slate-800 text-[15.5px] font-bold transition-all placeholder-slate-300 shadow-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                       />
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[13px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">Output Language</label>
                    <LanguageSelector value={language} onChange={setLanguage} />
                  </div>
               </div>

               {/* Error Display */}
               <AnimatePresence>
                 {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 text-[14px] font-bold rounded-2xl px-4 py-3 mt-6 shadow-sm overflow-hidden"
                    >
                      <span className="shrink-0 mt-0.5"><FiAlertTriangle className="w-4 h-4 text-rose-500" /></span>
                      <span className="leading-snug">{error}</span>
                    </motion.div>
                 )}
               </AnimatePresence>

               {/* Submission Button */}
               <motion.button
                  onClick={handleSubmit}
                  disabled={!file || isUploading}
                  whileHover={{ scale: file ? 1.02 : 1 }}
                  whileTap={{ scale: file ? 0.98 : 1 }}
                  className={`w-full h-[60px] rounded-2xl font-black text-[16px] tracking-wide flex items-center justify-center gap-3 transition-all mt-8
                    ${file
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-[0_10px_30px_rgba(79,70,229,0.3)] text-white border-transparent'
                      : 'bg-white text-slate-400 cursor-not-allowed border-2 border-slate-200 shadow-sm'
                    }`}
               >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading Document...
                    </>
                  ) : (
                    <>
                      Analyze Document
                      <FiArrowRight className="w-5 h-5" />
                    </>
                  )}
               </motion.button>
             </div>
             
          </div>
        </motion.div>
      </div>
    </div>
  );
}
