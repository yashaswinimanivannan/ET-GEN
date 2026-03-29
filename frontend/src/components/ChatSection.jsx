import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiUser, FiZap } from 'react-icons/fi';
import { chatWithDocument } from '../services/api';

export default function ChatSection({ documentText, language }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I am your AI Copilot. Simply ask any question below, and I will strictly analyze your document to provide you the right answer!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideText = null) => {
    const textToSend = overrideText || input.trim();
    if (!textToSend || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setIsLoading(true);

    try {
      const response = await chatWithDocument({
        question: textToSend,
        documentText: documentText,
        language: language,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an issue analyzing the document. Let\'s try asking it differently.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'Are there hidden charges?',
    'What happens if I delay payment?',
    'Identify restrictive clauses',
    'Summarize my obligations',
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAFBFF] relative overflow-hidden">
      
      {/* Premium Violet Gradient Header - Static inside the Flex container */}
      <div className="shrink-0 relative z-30 px-6 py-4 bg-gradient-to-r from-indigo-600 via-primary to-purple-600 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm shadow-indigo-900/10">
            <FiZap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-[15px] leading-tight drop-shadow-sm">System Copilot</h3>
            <p className="text-[12px] font-bold text-indigo-100 uppercase tracking-widest mt-0.5">Active Session</p>
          </div>
        </div>
        
        {/* Language Badge */}
        <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider drop-shadow-sm">
          {language}
        </div>
      </div>

      {/* Subtle Grid Background Pattern for the chat body */}
      <div className="absolute inset-0 top-16 w-full h-full pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(currentColor 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', color: '#4F46E5' }} />
      <div className="absolute top-16 left-0 w-full h-1/2 bg-gradient-to-b from-[#FAFBFF] to-transparent pointer-events-none z-0" />

      {/* Messages Scroll Area - dynamically sized flex-1 */}
      <div className="flex-1 overflow-y-auto w-full scroll-smooth pt-8 px-5 pb-32 z-10 space-y-6">
         <AnimatePresence>
            {messages.map((msg, i) => (
               <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
               >
                  <div className={`flex max-w-[85%] sm:max-w-[75%] gap-4 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                     
                     {/* Avatar */}
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] border ${msg.role === 'user' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-400'}`}>
                        {msg.role === 'user' ? <FiUser className="w-4 h-4" /> : <FiZap className="w-4 h-4" />}
                     </div>

                     {/* Chat Bubble */}
                     <div
                        className={`px-5 py-4 text-[15.5px] leading-[1.6] transition-all shadow-sm flex flex-col ${
                           msg.role === 'user'
                              ? 'bg-gradient-to-br from-indigo-600 via-primary to-purple-600 text-white rounded-[1.5rem] rounded-br-[0.3rem]'
                              : 'bg-white border border-indigo-100/60 text-slate-700 rounded-[1.5rem] rounded-bl-[0.3rem]'
                        }`}
                     >
                        <p className="whitespace-pre-wrap font-medium flex break-words overflow-hidden">{msg.content}</p>
                     </div>
                  </div>
               </motion.div>
            ))}
         </AnimatePresence>

         {/* Loading Indicator */}
         {isLoading && (
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex w-full justify-start gap-4 mb-4"
            >
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shrink-0 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.08)] text-white border border-indigo-400">
                  <FiZap className="w-4 h-4" />
               </div>
               <div className="bg-white border border-indigo-100/60 rounded-[1.5rem] rounded-bl-[0.3rem] px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-center h-[56px]">
                  <div className="flex gap-1.5 items-center">
                     <div className="w-2.5 h-2.5 bg-indigo-600/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                     <div className="w-2.5 h-2.5 bg-indigo-600/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                     <div className="w-2.5 h-2.5 bg-indigo-600/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
               </div>
            </motion.div>
         )}
         
         <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area (Strictly pinned at bottom of the widget) */}
      <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-indigo-100 shadow-[0_-15px_40px_rgba(79,70,229,0.05)] px-6 sm:px-8 py-5 flex flex-col shrink-0 z-30">
         
         {/* Suggested Questions strictly shown at start */}
         {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
               {suggestedQuestions.map((q, i) => (
                  <button
                     key={i}
                     onClick={() => handleSend(q)}
                     className="text-[13px] font-bold px-4 py-2 rounded-xl bg-indigo-50/50 text-indigo-700 hover:text-white hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 transition-all border border-indigo-100/80 hover:border-transparent shadow-sm"
                  >
                     {q}
                  </button>
               ))}
            </div>
         )}

         {/* Main Input Field */}
         <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="flex items-center gap-3 bg-white border border-indigo-100 rounded-[1.25rem] px-3 py-2.5 shadow-[inset_0_2px_15px_rgba(79,70,229,0.02)] focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 transition-all z-40 relative w-full">
               <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message the AI Copilot..."
                  rows="1"
                  className="flex-1 max-h-[120px] min-h-[26px] bg-transparent text-slate-800 text-[15.5px] font-medium px-3 py-1 outline-none placeholder-indigo-300/80 resize-none overflow-y-auto"
                  disabled={isLoading}
               />
               <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="w-11 h-11 rounded-[1.1rem] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md transition-all hover:bg-indigo-700 disabled:opacity-40 disabled:grayscale mb-0.5 focus:outline-none"
               >
                  <FiSend className="w-5 h-5 -ml-0.5" />
               </button>
            </div>
         </div>
         
      </div>

    </div>
  );
}
