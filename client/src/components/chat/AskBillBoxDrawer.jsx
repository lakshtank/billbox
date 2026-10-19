import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import {
  Sparkles,
  Send,
  Bot,
  User,
  X,
  Trash2,
  Copy,
  Check,
  ReceiptText,
  Package,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Store,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import useUiStore from '../../store/uiStore';
import useAuth from '../../hooks/useAuth';
import { useAskBillBoxMutation, useChatSuggestionsQuery } from '../../queries/useChatQueries';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../utils/formatters';

/**
 * Lightweight, safe parser for AI Markdown that transforms:
 * - [Store Name - Amount](receipt:ID) into clickable interactive badges
 * - [Product Name](product:ID) into clickable product badges
 * - Headers, bold text, lists, and tables
 */
function MarkdownRenderer({ content, onNavigate }) {
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // Split text into paragraphs / lines
    const lines = content.split('\n');
    const elements = [];
    let inTable = false;
    let tableRows = [];

    const flushTable = (key) => {
      if (tableRows.length === 0) return;
      const headers = tableRows[0];
      const dataRows = tableRows.slice(1).filter((r) => !r.every((c) => /^-+$/.test(c.trim())));

      elements.push(
        <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-lg border border-line bg-surface/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-subtle/60 text-fg-2 font-medium">
                {headers.map((h, i) => (
                  <th key={i} className="p-2 whitespace-nowrap font-semibold">
                    {parseInlineLinks(h.trim(), onNavigate)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-line/50 last:border-0 hover:bg-hover/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 whitespace-nowrap text-fg">
                      {parseInlineLinks(cell.trim(), onNavigate)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Table line detect
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={idx} className="text-sm font-semibold text-fg mt-3 mb-1">
            {parseInlineLinks(trimmed.replace(/^###\s+/, ''), onNavigate)}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={idx} className="text-base font-semibold text-fg mt-3.5 mb-1.5 pb-1 border-b border-line/60">
            {parseInlineLinks(trimmed.replace(/^##\s+/, ''), onNavigate)}
          </h3>
        );
        return;
      }

      // Bullet points
      if (/^[-*•]\s+/.test(trimmed)) {
        elements.push(
          <li key={idx} className="ml-4 list-disc text-xs sm:text-sm text-fg leading-relaxed my-0.5">
            {parseInlineLinks(trimmed.replace(/^[-*•]\s+/, ''), onNavigate)}
          </li>
        );
        return;
      }

      // Numbered points
      if (/^\d+\.\s+/.test(trimmed)) {
        elements.push(
          <li key={idx} className="ml-4 list-decimal text-xs sm:text-sm text-fg leading-relaxed my-0.5">
            {parseInlineLinks(trimmed.replace(/^\d+\.\s+/, ''), onNavigate)}
          </li>
        );
        return;
      }

      // Blank line
      if (!trimmed) {
        elements.push(<div key={idx} className="h-1.5" />);
        return;
      }

      // Regular paragraph
      elements.push(
        <p key={idx} className="text-xs sm:text-sm text-fg leading-relaxed my-1">
          {parseInlineLinks(trimmed, onNavigate)}
        </p>
      );
    });

    if (inTable) flushTable('end');

    return elements;
  }, [content, onNavigate]);

  return <div className="space-y-0.5">{renderedContent}</div>;
}

/**
 * Parses bold `**text**` and custom links `[label](receipt:id)` or `[label](product:id)`
 */
function parseInlineLinks(text, onNavigate) {
  // Regex to match markdown links: [Label](type:id)
  const regex = /\[(.*?)\]\((receipt|product):([a-f0-9]{24})\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, label, type, id] = match;
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      parts.push(parseBoldText(text.substring(lastIndex, startIndex)));
    }

    parts.push(
      <button
        key={`link-${type}-${id}-${startIndex}`}
        type="button"
        onClick={() => onNavigate(type, id)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 text-[11px] font-medium rounded-md bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 transition-all cursor-pointer align-baseline"
        title={`View ${type === 'receipt' ? 'Receipt' : 'Product'}`}
      >
        {type === 'receipt' ? (
          <ReceiptText className="w-3 h-3 shrink-0" />
        ) : (
          <Package className="w-3 h-3 shrink-0" />
        )}
        <span className="font-semibold underline decoration-accent/40">{label}</span>
        <ArrowUpRight className="w-2.5 h-2.5 opacity-70" />
      </button>
    );

    lastIndex = startIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(parseBoldText(text.substring(lastIndex)));
  }

  return parts.length > 0 ? parts : parseBoldText(text);
}

function parseBoldText(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Main AskBillBoxDrawer Component
 */
export function AskBillBoxDrawer() {
  const { isAskBillBoxOpen, closeAskBillBox } = useUiStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inputMessage, setInputMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load chat history from session storage for persistence during navigation
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('billbox_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const askMutation = useAskBillBoxMutation();
  const { data: starterSuggestions } = useChatSuggestionsQuery(isAskBillBoxOpen && messages.length === 0);

  // Sync session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('billbox_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not cache chat messages:', e);
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isAskBillBoxOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 180);
    }
  }, [isAskBillBoxOpen]);

  // Auto-scroll on new message
  useEffect(() => {
    if (isAskBillBoxOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, askMutation.isPending, isAskBillBoxOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAskBillBoxOpen) {
        closeAskBillBox();
      }
      // Global shortcut Cmd+J or Ctrl+J
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        if (isAskBillBoxOpen) {
          closeAskBillBox();
        } else {
          useUiStore.getState().openAskBillBox();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAskBillBoxOpen, closeAskBillBox]);

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || askMutation.isPending) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputMessage('');

    // Prepare history payload for API
    const apiHistory = updatedHistory.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    askMutation.mutate(
      { message: text, history: apiHistory },
      {
        onSuccess: (data) => {
          const assistantMessage = {
            role: 'assistant',
            content: data.reply,
            suggestions: data.suggestions || [],
            references: data.references || null,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: (err) => {
          const errorMsg =
            err.response?.data?.message ||
            'Unable to generate an answer right now. Please check your network or Gemini API key.';
          const assistantErrorMessage = {
            role: 'assistant',
            content: `⚠️ **Error:** ${errorMsg}`,
            isError: true,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantErrorMessage]);
          toast.error('AI query failed');
        },
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    sessionStorage.removeItem('billbox_chat_history');
    toast.success('Conversation cleared');
  };

  const handleCopyMessage = (content, index) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCitationNavigate = (type, id) => {
    if (type === 'receipt') {
      navigate(`/receipts/${id}`);
    } else if (type === 'product') {
      navigate(`/products/${id}`);
    }
  };

  if (!isAskBillBoxOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={closeAskBillBox}
        className="fixed inset-0 bg-scrim/50 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <m.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-screen max-w-full sm:max-w-xl flex flex-col bg-bg-app border-l border-line shadow-2xl overflow-hidden"
        >
          {/* 1. Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-line bg-surface/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-gradient-to-tr from-accent to-accent-hover text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-fg tracking-tight truncate">Ask BillBox</h2>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-accent/10 text-accent border border-accent/20">
                    Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-[11px] text-fg-3 truncate">Personal Vault & Warranty Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 rounded-md text-fg-3 hover:text-bad hover:bg-hover transition-colors cursor-pointer"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={closeAskBillBox}
                className="p-1.5 rounded-md text-fg-3 hover:text-fg hover:bg-hover transition-colors cursor-pointer"
                title="Close (Esc)"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* 2. Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
            {messages.length === 0 ? (
              // Empty State / Welcome Screen
              <div className="flex flex-col items-center justify-center min-h-[380px] text-center space-y-5 my-auto py-8">
                <div className="size-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-xs">
                  <Sparkles className="size-7" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-base font-semibold text-fg">
                    Hi {user?.name ? user.name.split(' ')[0] : 'there'}!
                  </h3>
                  <p className="text-xs text-fg-2 leading-relaxed">
                    Ask me anything about your scanned receipts, item warranties, spending habits, or store records.
                  </p>
                </div>

                {/* Quick-Prompt Suggestions */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left">
                  {(starterSuggestions && starterSuggestions.length > 0
                    ? starterSuggestions
                    : [
                        'Which warranties are expiring soon?',
                        'What is my total spending this month?',
                        'Which store do I spend the most at?',
                        'Show my 5 biggest purchases',
                      ]
                  ).map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(promptText)}
                      className="p-3 rounded-xl border border-line bg-surface hover:bg-hover hover:border-accent/30 text-xs font-medium text-fg flex items-start gap-2.5 transition-all group cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="size-3.5 text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="line-clamp-2">{promptText}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Chat Message History
              messages.map((message, idx) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex flex-col space-y-2',
                      isUser ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[88%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-2xs',
                        isUser
                          ? 'bg-accent text-white rounded-br-xs'
                          : 'bg-surface border border-line text-fg rounded-bl-xs'
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="space-y-2.5">
                          <MarkdownRenderer
                            content={message.content}
                            onNavigate={handleCitationNavigate}
                          />

                          {/* Reference Cards Preview */}
                          {message.references && (
                            <>
                              {message.references.products?.length > 0 && (
                                <div className="pt-2 border-t border-line/60 space-y-1.5">
                                  <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                                    Referenced Products
                                  </span>
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {message.references.products.map((p) => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleCitationNavigate('product', p.id)}
                                        className="p-2 rounded-lg border border-line bg-subtle hover:bg-hover/80 text-left flex items-center justify-between transition-colors cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Package className="size-3.5 text-accent shrink-0" />
                                          <div className="min-w-0">
                                            <p className="text-xs font-semibold text-fg truncate">{p.productName}</p>
                                            <p className="text-[10px] text-fg-3">{p.brand}</p>
                                          </div>
                                        </div>
                                        {p.daysRemaining != null && (
                                          <span
                                            className={cn(
                                              'text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold shrink-0 ml-2',
                                              p.daysRemaining <= 0
                                                ? 'bg-bad-bg text-bad-fg'
                                                : p.daysRemaining <= 30
                                                ? 'bg-warn-bg text-warn-fg'
                                                : 'bg-ok-bg text-ok-fg'
                                            )}
                                          >
                                            {p.daysRemaining <= 0
                                              ? 'Expired'
                                              : `${p.daysRemaining}d left`}
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {message.references.receipts?.length > 0 && (
                                <div className="pt-2 border-t border-line/60 space-y-1.5">
                                  <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider block">
                                    Referenced Receipts
                                  </span>
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {message.references.receipts.map((r) => (
                                      <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => handleCitationNavigate('receipt', r.id)}
                                        className="p-2 rounded-lg border border-line bg-subtle hover:bg-hover/80 text-left flex items-center justify-between transition-colors cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Store className="size-3.5 text-accent shrink-0" />
                                          <div className="min-w-0">
                                            <p className="text-xs font-semibold text-fg truncate">{r.storeName}</p>
                                            <p className="text-[10px] text-fg-3">
                                              {r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString() : 'Receipt'}
                                            </p>
                                          </div>
                                        </div>
                                        <span className="text-xs font-bold text-fg shrink-0 ml-2 font-mono">
                                          {formatCurrency(r.totalAmount, r.currency)}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {/* Copy Action */}
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(message.content, idx)}
                              className="text-[11px] text-fg-3 hover:text-fg flex items-center gap-1 transition-colors cursor-pointer px-1 py-0.5 rounded"
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className="size-3 text-ok" />
                                  <span className="text-ok">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  <span>Copy answer</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Follow-up suggestions from this message */}
                    {!isUser && message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 pl-1 max-w-[88%]">
                        {message.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSendMessage(sug)}
                            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface hover:bg-hover border border-line text-fg-2 hover:text-accent transition-colors cursor-pointer text-left shadow-2xs"
                          >
                            + {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Thinking / Loading Indicator */}
            {askMutation.isPending && (
              <div className="flex items-start gap-2.5">
                <div className="size-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <Sparkles className="size-3.5 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-bl-xs bg-surface border border-line px-4 py-2.5 shadow-2xs flex items-center gap-2 text-xs text-fg-2 font-medium">
                  <span className="animate-pulse">Analyzing your vault & warranties...</span>
                  <span className="flex items-center gap-1">
                    <span className="size-1 rounded-full bg-accent animate-ping" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 3. Input Footer */}
          <div className="p-3 sm:p-4 border-t border-line bg-surface/90 backdrop-blur-md shrink-0">
            <div className="relative flex items-end gap-2 bg-bg-app border border-line focus-within:border-accent rounded-xl p-2 transition-all shadow-2xs">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about spending, stores, warranties... (Enter to send)"
                rows={1}
                className="w-full max-h-32 bg-transparent text-xs sm:text-sm text-fg placeholder:text-fg-3 focus:outline-none resize-none py-1 px-1.5"
                style={{ minHeight: '38px' }}
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || askMutation.isPending}
                className={cn(
                  'size-9 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer',
                  inputMessage.trim() && !askMutation.isPending
                    ? 'bg-accent hover:bg-accent-hover text-white shadow-xs'
                    : 'bg-subtle text-fg-3 cursor-not-allowed opacity-50'
                )}
                title="Send query"
                aria-label="Send query"
              >
                <Send className="size-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-fg-3 px-1 pt-1.5">
              <span>Press Enter to send · Shift+Enter for new line</span>
              <kbd className="hidden sm:inline font-mono text-[9px] px-1 py-0.2 bg-subtle border border-line rounded">
                Esc to close
              </kbd>
            </div>
          </div>
        </m.div>
      </div>
    </div>
  );
}

export default AskBillBoxDrawer;
