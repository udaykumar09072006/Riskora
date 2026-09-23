import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  ShieldAlert, 
  Cpu, 
  Zap, 
  Search, 
  Users, 
  FileText, 
  Clock, 
  CornerDownLeft,
  Database
} from 'lucide-react';
import { geminiApi } from '../services/api';
import { auth, createChatSessionInFirestore, addChatMessageToFirestore } from '../services/firebase';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  roleUsed?: string;
}

export type GeminiModel = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';
export type AnalystRole = 'autonomous_copilot' | 'syndicate_hunter' | 'risk_analyst' | 'compliance_officer';

const ROLES: { id: AnalystRole; name: string; icon: any; description: string; instruction: string }[] = [
  {
    id: 'autonomous_copilot',
    name: 'Autonomous Co-Pilot',
    icon: Sparkles,
    description: 'General triage, scoring breakdown & live assistance',
    instruction: 'You are Riskora\'s Autonomous SOC Security Co-Pilot. You help security analysts triage alerts, interpret ML probabilities, analyze transaction anomalies, and formulate action recommendations.'
  },
  {
    id: 'syndicate_hunter',
    name: 'Syndicate Hunter',
    icon: Users,
    description: 'Graph rings, shared devices & botnet clusters',
    instruction: 'You are the Senior Syndicate Investigator at Riskora SOC. You specialize in ring graph topologies, hardware fingerprint collusion, proxy anonymizer swarms, and coordinated velocity fraud. Break down network rings with forensic precision.'
  },
  {
    id: 'risk_analyst',
    name: 'Risk Analyst',
    icon: ShieldAlert,
    description: 'Transaction anomalies, SHAP features & velocity',
    instruction: 'You are the Transaction Risk Specialist at Riskora. You specialize in mathematical transaction scoring, SHAP feature importance, behavioral spending variances, and rule engine trigger diagnostics.'
  },
  {
    id: 'compliance_officer',
    name: 'Compliance & AML',
    icon: FileText,
    description: 'FinCEN SAR filing, FATF & regulatory guidelines',
    instruction: 'You are the Chief Regulatory Compliance & AML Officer at Riskora. You evaluate suspicious activities against FinCEN, FATF, and Bank Secrecy Act requirements, and provide audit-proof regulatory narratives.'
  }
];

const MODELS: { id: GeminiModel; name: string; tag: string; description: string; icon: any; color: string }[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    tag: 'General Tasks',
    description: 'Balanced speed and deep analytical capability',
    icon: Bot,
    color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    tag: 'Fast Tasks',
    description: 'Ultra-low latency for instant triaging',
    icon: Zap,
    color: 'text-amber-400 border-amber-500/40 bg-amber-500/10'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    tag: 'Complex Tasks',
    description: 'Deep multi-step reasoning for intricate fraud rings',
    icon: Cpu,
    color: 'text-rose-400 border-rose-500/40 bg-rose-500/10'
  }
];

const QUICK_PROMPTS = [
  { title: 'Triage Critical Alert', prompt: 'Analyze this scenario: Customer with $80 average transactions suddenly attempts $4,200 at a high-risk electronics merchant from an unrecognized device in an impossible travel location. What is the immediate risk vector and recommended action?' },
  { title: 'Decompose Botnet Ring', prompt: 'Explain how multi-account hardware collusion works when 14 cards share the same Canvas fingerprint hash and proxy subnet. How should our SOC quarantine the syndicate?' },
  { title: 'Explain SHAP Feature', prompt: 'Explain the difference between global SHAP baseline feature impact and local transaction SHAP attributions in credit card fraud detection.' },
  { title: 'Draft FinCEN SAR Filing', prompt: 'Provide a structured Suspicious Activity Report (SAR) narrative draft for a high-velocity micro-testing ring that escalated into large cash equivalent withdrawals.' }
];

export const GeminiChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-init',
        sender: 'model',
        text: 'Welcome to the Riskora Gemini SOC Intelligence Co-Pilot. I maintain multi-turn context across your investigation session.\n\nYou can select specialized analyst roles (Syndicate Hunter, Risk Specialist, AML Officer) and switch between Gemini 3.5 Flash for general analysis, Gemini 3.1 Flash-Lite for instant lookup, or Gemini 3.1 Pro for complex forensic decomposition. How can I assist your investigation today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash',
        roleUsed: 'autonomous_copilot'
      }
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<AnalystRole>('autonomous_copilot');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatSessionId] = useState<string>(() => `chat-${Date.now()}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Persist session in Firestore if Firebase user is logged in
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      createChatSessionInFirestore(user.uid, {
        id: chatSessionId,
        title: `SOC Analysis Session (${new Date().toLocaleDateString()})`,
        model: selectedModel,
        role: selectedRole
      });
    }
  }, [chatSessionId, selectedModel, selectedRole]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update state with user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // Persist user message to Firestore if authenticated
    const fbUser = auth.currentUser;
    if (fbUser) {
      addChatMessageToFirestore(fbUser.uid, chatSessionId, {
        id: userMessage.id,
        sender: 'user',
        text: userMessage.text,
        timestamp: userMessage.timestamp,
        modelUsed: selectedModel
      });
    }

    try {
      // Build conversation history for multi-turn chat (excluding initial greeting)
      const history = updatedMessages.slice(1).map(m => ({
        role: m.sender,
        text: m.text
      }));

      const activeRoleObj = ROLES.find(r => r.id === selectedRole);

      // Call server-side Gemini Chat endpoint
      const result = await geminiApi.chat({
        message: textToSend.trim(),
        history,
        model: selectedModel,
        role: selectedRole,
        systemInstruction: activeRoleObj?.instruction
      });

      const modelMessage: ChatMessage = {
        id: `mod-${Date.now()}`,
        sender: 'model',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: result.modelUsed || selectedModel,
        roleUsed: selectedRole
      };

      setMessages(prev => [...prev, modelMessage]);

      // Persist model response to Firestore
      if (fbUser) {
        addChatMessageToFirestore(fbUser.uid, chatSessionId, {
          id: modelMessage.id,
          sender: 'model',
          text: modelMessage.text,
          timestamp: modelMessage.timestamp,
          modelUsed: result.modelUsed
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'model',
        text: `Error contacting Gemini: ${err.message || 'Unknown network error'}. Please verify server connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'model',
        text: `Conversation history reset. Context is now cleared for a new investigation thread with ${MODELS.find(m => m.id === selectedModel)?.name}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        roleUsed: selectedRole
      }
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080C15] text-slate-100 overflow-hidden">
      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800 bg-[#0B101D] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-indigo-900/30 flex items-center justify-center">
            <div className="h-full w-full bg-[#090D18] rounded-[10px] flex items-center justify-center text-cyan-400">
              <Bot className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">Gemini SOC Co-Pilot</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Multi-Turn Chat
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous fraud investigation reasoning & natural language analytics
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Firestore sync pill indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-mono">
            <Database className="h-3 w-3" />
            <span>Firestore Synced</span>
          </div>

          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-medium transition-all"
            title="Clear Chat History"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </header>

      {/* Model & Role Controls Bar */}
      <div className="px-6 py-3 border-b border-slate-800/80 bg-[#0A0E1A]/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shrink-0">
        {/* Model Selection Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1">Model:</span>
          {MODELS.map(m => {
            const Icon = m.icon;
            const isSelected = selectedModel === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? m.color + ' shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={m.description}
              >
                <Icon className="h-3 w-3" />
                <span>{m.name}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-300 font-mono uppercase">
                  {m.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Role Selection Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1">Role:</span>
          {ROLES.map(r => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={r.description}
              >
                <Icon className="h-3 w-3" />
                <span>{r.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Conversation Thread Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id || index}
              className={`flex gap-3 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-8 w-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`group relative rounded-2xl p-4 text-xs sm:text-sm leading-relaxed max-w-[85%] sm:max-w-[78%] transition-all ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-md shadow-indigo-900/20'
                    : 'bg-[#101728] border border-slate-800 text-slate-200 rounded-tl-xs shadow-md'
                }`}
              >
                {/* Meta header for model responses */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-800/80 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-cyan-400">
                        {ROLES.find(r => r.id === msg.roleUsed)?.name || 'Riskora Co-Pilot'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">{msg.modelUsed || selectedModel}</span>
                    </div>

                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-white rounded transition-opacity"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Message text */}
                <div className="whitespace-pre-wrap select-text font-normal space-y-1">
                  {msg.text}
                </div>

                {/* Timestamp */}
                <div
                  className={`text-[10px] mt-2 font-mono flex items-center gap-1 ${
                    isUser ? 'text-indigo-200 justify-end' : 'text-slate-500 justify-start'
                  }`}
                >
                  <Clock className="h-2.5 w-2.5" />
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {isUser && (
                <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <span className="text-xs font-bold">ME</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading / Thinking State */}
        {loading && (
          <div className="flex gap-3 max-w-4xl mx-auto justify-start animate-in fade-in duration-150">
            <div className="h-8 w-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl p-4 bg-[#101728] border border-slate-800 rounded-tl-xs flex items-center gap-3">
              <div className="flex space-x-1.5 items-center">
                <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {selectedModel} reasoning through fraud patterns...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-6 py-2.5 bg-[#090D18] border-t border-slate-800/80 overflow-x-auto">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0">
            Quick Prompts:
          </span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp.prompt)}
              disabled={loading}
              className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] shrink-0 transition-colors disabled:opacity-50"
            >
              {qp.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Composer */}
      <div className="p-4 sm:p-6 bg-[#0B101D] border-t border-slate-800 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-xl bg-[#070A12] border border-slate-800 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask Gemini (${MODELS.find(m => m.id === selectedModel)?.name}) anything about fraud investigations, cardholder risk, or syndicate topology...`}
              rows={2}
              className="w-full bg-transparent px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none resize-none"
            />

            <div className="px-3 pb-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <span>Enter to send</span>
                <span>•</span>
                <span>Shift+Enter for newline</span>
              </div>

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 cursor-pointer"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
