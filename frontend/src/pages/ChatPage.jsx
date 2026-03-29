import { useLocation, Link, useNavigate } from 'react-router-dom';
import { FiZap, FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import ChatSection from '../components/ChatSection';

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { documentText, language } = location.state || {};

  if (!documentText) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFF] text-slate-700">
        <p className="mb-4 font-medium text-lg">No document available for chat. Please upload first.</p>
        <button onClick={() => navigate('/upload')} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg font-bold hover:shadow-xl transition-all hover:-translate-y-0.5">
          Go to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FD] relative font-sans overflow-x-hidden">
      {/* Heavy Violet Ambient Background */}
      <div className="fixed top-[-15%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 shadow-sm border-b border-white/60 bg-white/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[19px] font-black text-slate-800 tracking-tight hidden sm:block">FinSight</span>
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[14px] font-bold text-slate-500 hover:text-indigo-600 transition-colors px-4 py-2.5 rounded-xl hover:bg-slate-50"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
        </div>
      </nav>

      {/* Main Content - Strict Vertical & Horizontal Centered Layout using Grid */}
      <div className="flex-1 w-full grid place-items-center relative z-10 p-4 sm:p-8">
         <div className="w-full max-w-[900px] flex flex-col items-center">
            
            {/* The Text Above Chat Card */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-[1.25rem] bg-white flex items-center justify-center text-indigo-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mx-auto mb-4 relative group">
                 <div className="absolute inset-0 bg-indigo-500/20 rounded-[1.25rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                 <FiMessageSquare className="w-8 h-8 relative z-10" />
              </div>
              <h1 className="text-3xl sm:text-[36px] font-black text-slate-800 tracking-tight leading-tight mb-3">
                 FinSight <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow-sm">AI Copilot</span>
              </h1>
              <p className="text-slate-500 font-medium text-[16px] max-w-xl mx-auto leading-relaxed px-4">
                 You can discuss with me and clear your doubts about any clauses, hidden fees, or terminology inside your document.
              </p>
            </div>

            {/* The actual CHAT CARD perfectly centered */}
            <div className="w-full bg-white border border-indigo-100/60 shadow-[0_20px_70px_-15px_rgba(79,70,229,0.15)] rounded-3xl flex flex-col h-[65vh] min-h-[500px] max-h-[750px] relative overflow-hidden ring-4 ring-white/50">
               <ChatSection documentText={documentText} language={language} />
            </div>

         </div>
      </div>
    </div>
  );
}
