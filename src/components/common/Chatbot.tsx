import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, ChevronRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

const DEFAULT_QA = [
  {
    question: "Delivery Times",
    answer: "Our curated treasures typically arrive within 3-5 business days. Bespoke items may require additional time for craftsmanship."
  },
  {
    question: "Bespoke Customization",
    answer: "Most pieces in our collection offer engraving or embroidery services. Simply look for the 'Personalize' option on the product detail page."
  },
  {
    question: "Order Concierge",
    answer: "You may track your curation's journey in your profile. For refined assistance, please provide your order reference."
  },
  {
    question: "The Return Policy",
    answer: "We accept returns on standard items within 7 days. Personalised or bespoke creations, once crafted, are final sale."
  }
];

const INITIAL_MESSAGE: Message = {
  id: '1',
  text: "Welcome to Aura. I am your Gift Visionary, here to help you find the perfect treasure. How may I assist you today?",
  sender: 'bot',
  timestamp: new Date()
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response with a more sophisticated tone
    setTimeout(() => {
      const match = DEFAULT_QA.find(qa => 
        text.toLowerCase().includes(qa.question.toLowerCase()) || 
        qa.question.toLowerCase().includes(text.toLowerCase())
      );

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: match ? match.answer : "I apologize, that specific information is not currently in my archives. Would you like me to connect you with our lead concierge?",
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1200);
  };

  const handleQASelect = (qa: typeof DEFAULT_QA[0]) => {
    handleSendMessage(qa.question);
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] flex flex-col items-end max-w-[calc(100vw-32px)]">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="mb-4 w-full sm:w-[360px] md:w-[400px] h-[500px] md:h-[580px] max-h-[calc(100vh-120px)] bg-[#faf9f6] rounded-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-200/50 flex flex-col shadow-2xl"
          >
            {/* Header - Identity/Profile Style (Ivory & Amber) */}
            <div className="bg-[#faf9f6] p-6 flex items-center justify-between text-gray-900 border-b border-gray-200/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-amber-200 bg-amber-50 flex items-center justify-center">
                  <Bot size={20} strokeWidth={1} className="text-amber-700" />
                </div>
                <div>
                   <div className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-400 mb-0.5">Gift Visionary</div>
                  <h3 className="font-serif text-lg tracking-tight">Aura Concierge</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-amber-700 transition-colors"
                >
                  <Minus size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Messages Area - Identity Style */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-8 bg-white/50 no-scrollbar"
            >
              <div className="text-center py-2 mb-4">
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-300">Correspondence Established</p>
              </div>

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col group",
                    message.sender === 'user' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] text-[13px] leading-relaxed transition-all",
                      message.sender === 'user' 
                        ? "bg-gray-900 text-white p-4 font-light rounded-none shadow-sm" 
                        : "bg-white border border-gray-100 text-gray-700 p-4 font-light rounded-none shadow-sm"
                    )}
                  >
                    {message.text}
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start">
                   <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-amber-700/60 flex items-center gap-2 italic">
                      <span className="w-1 h-1 bg-amber-600 animate-pulse" />
                      Protocol in progress...
                   </div>
                </div>
              )}

              {/* Identity Style Options */}
              {messages.length === 1 && !isTyping && (
                <div className="pt-4 space-y-3">
                  <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-amber-900/40 mb-4 px-1">Common Enquiries</p>
                  <div className="flex flex-col gap-2">
                    {DEFAULT_QA.map((qa, index) => (
                      <button
                        key={index}
                        onClick={() => handleQASelect(qa)}
                        className="text-[11px] text-left px-5 py-3 border border-l-4 border-gray-100 border-l-transparent bg-white hover:border-l-amber-700 hover:bg-amber-50/20 transition-all flex items-center justify-between group rounded-none"
                      >
                        <span className="text-gray-500 font-light group-hover:text-gray-900 uppercase tracking-wider">{qa.question}</span>
                        <ChevronRight size={14} strokeWidth={1} className="text-gray-300 group-hover:text-amber-700 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area - Identity Style */}
            <div className="p-6 bg-white border-t border-gray-100">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Inscribe your message..."
                  className="w-full bg-transparent border-b border-gray-100 py-3 pr-10 text-sm font-light focus:outline-none focus:border-amber-700 transition-all placeholder:text-gray-300 placeholder:italic"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="absolute right-0 text-amber-700 p-2 disabled:text-gray-200 hover:text-amber-900 transition-colors"
                >
                  <Send size={18} strokeWidth={1.5} />
                </button>
              </form>
              <div className="mt-6 text-center">
                 <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-gray-200">Refined Assistance</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button - Identity Style (Amber/Dark) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 shadow-2xl flex items-center justify-center transition-all duration-500 relative group overflow-hidden border",
          isOpen 
            ? "bg-white text-gray-900 border-gray-200 rounded-none shadow-xl" 
            : "bg-gray-900 text-white border-gray-900 rounded-none shadow-2xl"
        )}
        aria-label="Toggle concierge"
      >
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500 opacity-0 group-hover:opacity-100" />
        {isOpen ? (
          <X size={24} strokeWidth={1} />
        ) : (
          <div className="relative flex items-center justify-center">
             <MessageCircle size={28} strokeWidth={1} />
             <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
