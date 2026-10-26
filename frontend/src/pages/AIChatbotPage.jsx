import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Bot,
  User,
  Send,
  Sparkles,
  AlertTriangle,
  BookOpen,
  PlusCircle,
  Trash2,
  Clock,
  ShieldCheck,
  RefreshCw,
  Loader2
} from 'lucide-react';

const AIChatbotPage = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadConversationHistory = async (convId) => {
    try {
      setLoading(true);
      setErrorMsg('');
      setCurrentConversationId(convId);
      const res = await api.get(`/chat/conversations/${convId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setErrorMsg('');
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await api.delete(`/chat/conversations/${convId}`);
      if (currentConversationId === convId) {
        handleStartNewConversation();
      }
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      sender: 'user',
      content: textToSend.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        message: textToSend.trim(),
        conversation_id: currentConversationId,
      };

      const res = await api.post('/chat', payload);
      const { conversation_id, reply, sources, is_emergency, disclaimer } = res.data;

      setCurrentConversationId(conversation_id);

      const assistantMessage = {
        sender: 'assistant',
        content: reply,
        sources: sources,
        is_emergency: is_emergency,
        disclaimer: disclaimer,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      fetchConversations();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process health inquiry. Please check your connection or retry.');
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    'What are normal adult blood pressure ranges?',
    'What is the difference between a cold and the flu?',
    'Evidence-based lifestyle habits for prediabetes?',
    'What are proven guidelines for healthy sleep hygiene?',
  ];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-4">
      {/* Left History Sidebar */}
      <div className="w-full md:w-64 bg-white rounded-3xl border border-slate-200 p-4 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Consultations</h3>
            <button
              onClick={handleStartNewConversation}
              className="p-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
              title="Start New Conversation"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-1 overflow-y-auto max-h-[60vh]">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversationHistory(conv.id)}
                className={`group p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                  currentConversationId === conv.id
                    ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="truncate pr-2">
                  <p className="truncate text-xs">{conv.title}</p>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-opacity"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-[11px] text-slate-400 text-center py-6">No previous chat records</p>
            )}
          </div>
        </div>

        {/* Safety Note */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 space-y-1">
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Ethical Health AI</span>
          </div>
          <p>This assistant provides evidence-based health education and does not replace clinical diagnosis.</p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-teal-500 text-white flex items-center justify-center shadow-md">
                <Bot className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">AI Health Information Assistant</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ask general health questions, explore preventive care measures, or clarify common medical terms with verified clinical citations.
                </p>
              </div>

              {/* Suggestions */}
              <div className="w-full space-y-2 pt-2 text-left">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  Suggested Questions
                </p>
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:border-primary-400 hover:bg-primary-50/50 text-xs text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{q}</span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-600" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                      isUser
                        ? 'bg-primary-600 text-white rounded-br-xs'
                        : m.is_emergency
                        ? 'bg-rose-50 border border-rose-300 text-rose-950 rounded-bl-xs'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {/* Emergency Alert Tag */}
                    {m.is_emergency && (
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold uppercase tracking-wider text-[10px]">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>High Priority Emergency Guidance</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Source citations */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/70 text-[10px] space-y-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-teal-600" />
                          Evidence References:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {m.sources.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-semibold"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-primary-700 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                      U
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-500 py-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>Evaluating clinical references...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                onClick={() => handleSendMessage()}
                className="font-bold text-primary-600 hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/70">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a health inquiry (e.g., 'What are signs of hypertension?')..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-slate-600 text-center mt-2">
            Educational tool only. Not for diagnosis or prescription. Always consult a physician for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatbotPage;
