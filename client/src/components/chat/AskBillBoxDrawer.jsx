import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import {
  Sparkles,
  Send,
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
  Clock,
  Shield,
  CornerDownLeft,
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
 * - Headers, bold text, lists, and tables with rich styling
 */
function MarkdownRenderer({ content, onNavigate }) {
  const renderedContent = useMemo(() => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements = [];
    let inTable = false;
    let tableRows = [];

    const flushTable = (key) => {
      if (tableRows.length === 0) return;
      const headers = tableRows[0];
      const dataRows = tableRows.slice(1).filter((r) => !r.every((c) => /^-+$/.test(c.trim())));

      elements.push(
        <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-xl border border-line/80 bg-surface/90 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-subtle/70 text-fg-2 font-medium">
                {headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3 whitespace-nowrap font-semibold">
                    {parseInlineLinks(h.trim(), onNavigate)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-line/40 last:border-0 hover:bg-hover/50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-fg">
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

      // Headers (H3)
      if (trimmed.startsWith('### ')) {
        elements.push(
          <div key={idx} className="border-l-2 border-accent pl-2.5 my-2.5">
            <h4 className="text-sm font-semibold text-fg tracking-tight">
              {parseInlineLinks(trimmed.replace(/^###\s+/, ''), onNavigate)}
            </h4>
          </div>
        );
        return;
      }

      // Headers (H2)
      if (trimmed.startsWith('## ')) {
        elements.push(
          <div key={idx} className="border-l-2 border-accent pl-3 my-3">
            <h3 className="text-base font-bold text-fg tracking-tight">
              {parseInlineLinks(trimmed.replace(/^##\s+/, ''), onNavigate)}
            </h3>
          </div>
        );
        return;
      }

      // Bullet points
      if (/^[-*•]\s+/.test(trimmed)) {
        elements.push(
          <div key={idx} className="flex items-start gap-2 ml-1 my-1">
            <span className="size-1.5 rounded-full bg-accent mt-2 shrink-0 shadow-xs" />
            <span className="text-xs sm:text-sm text-fg leading-relaxed">
              {parseInlineLinks(trimmed.replace(/^[-*•]\s+/, ''), onNavigate)}
            </span>
          </div>
        );
        return;
      }

      // Numbered points
      if (/^\d+\.\s+/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)\./)[1];
        elements.push(
          <div key={idx} className="flex items-start gap-2 ml-1 my-1">
            <span className="text-[11px] font-mono font-bold text-accent mt-0.5 shrink-0 bg-accent/10 px-1.5 py-0.2 rounded">
              {num}
            </span>
            <span className="text-xs sm:text-sm text-fg leading-relaxed">
              {parseInlineLinks(trimmed.replace(/^\d+\.\s+/, ''), onNavigate)}
            </span>
          </div>
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
        className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 text-[11px] font-semibold rounded-lg bg-accent/10 hover:bg-accent/20 text-accent border border-accent/25 hover:border-accent/40 transition-all shadow-2xs hover:shadow-xs cursor-pointer align-baseline"
        title={`View ${type === 'receipt' ? 'Receipt' : 'Product'}`}
      >
        {type === 'receipt' ? (
          <ReceiptText className="size-3 shrink-0" />
        ) : (
          <Package className="size-3 shrink-0" />
        )}
        <span className="underline decoration-accent/40 hover:decoration-accent">{label}</span>
        <ArrowUpRight className="size-2.5 opacity-70" />
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
 * Professional, high-end AI assistant with ambient gradient canvas,
 * grounded vault intelligence, interactive citations, and follow-up suggestions.
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

  // Close on Escape key when drawer is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAskBillBoxOpen) {
        closeAskBillBox();
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
    closeAskBillBox();
    if (type === 'receipt') {
      navigate(`/receipts/${id}`);
    } else if (type === 'product') {
      navigate(`/products/${id}`);
    }
  };

  if (!isAskBillBoxOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* 1. Backdrop with deep blur and smooth fade */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={closeAskBillBox}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      />

      {/* 2. Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <m.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-screen max-w-full sm:max-w-xl flex flex-col bg-gradient-to-b from-surface via-subtle/25 to-surface dark:from-card dark:via-bg-app/90 dark:to-card backdrop-blur-2xl border-l border-line/90 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden"
        >
          {/* Ambient Lighting & Canvas Texture */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            {/* Top-Right Glowing Orb */}
            <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-accent/15 dark:bg-accent/20 blur-3xl" />
            {/* Bottom-Left Ambient Glow */}
            <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-3xl" />
            {/* Micro-dot pattern overlay for high-tech aesthetic */}
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
              style={{
                backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          {/* ── Header Bar ── */}
          <div className="relative flex items-center justify-between px-5 py-3.5 border-b border-line/70 bg-surface/80 dark:bg-card/80 backdrop-blur-xl shrink-0 z-10">
            {/* Subtle Gradient Hairline at bottom of header */}
            <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-accent/35 to-transparent pointer-events-none" />

            <div className="flex items-center gap-3 min-w-0">
              {/* Glowing Icon Badge with Active Ping */}
              <div className="relative size-9 rounded-xl bg-gradient-to-tr from-accent via-accent to-teal-400 text-white flex items-center justify-center shadow-md shadow-accent/25 shrink-0">
                <Sparkles className="size-4.5" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-surface animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-fg tracking-tight">Ask BillBox</h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                    Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-[11px] text-fg-3 truncate">
                  Personal Vault & Warranty Intelligence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-2 rounded-lg text-fg-3 hover:text-bad hover:bg-bad-bg/50 transition-colors cursor-pointer"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={closeAskBillBox}
                className="p-2 rounded-lg text-fg-3 hover:text-fg hover:bg-hover transition-colors cursor-pointer"
                title="Close (Esc)"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* ── Messages Scroll Area ── */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 space-y-4">
            {messages.length === 0 ? (
              // Empty State / Welcome Canvas
              <div className="flex flex-col items-center justify-center min-h-[420px] text-center space-y-6 my-auto py-8">
                {/* Glowing AI Orb */}
                <div className="relative size-16 rounded-3xl bg-gradient-to-tr from-accent/20 via-accent/10 to-transparent border border-accent/30 flex items-center justify-center text-accent shadow-lg shadow-accent/15 group">
                  <Sparkles className="size-8 text-accent animate-pulse" />
                  <div className="absolute -inset-2 rounded-3xl bg-accent/10 blur-md pointer-events-none -z-10" />
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="text-lg font-bold text-fg tracking-tight">
                    Hi, {user?.name ? user.name.split(' ')[0] : 'there'}!
                  </h3>
                  <p className="text-xs text-fg-2 leading-relaxed">
                    Ask me anything about your scanned receipts, item warranties, spending habits, or store records.
                  </p>
                </div>

                {/* Quick-Prompt Suggestions (Frosted Cards) */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
                  {(starterSuggestions && starterSuggestions.length > 0
                    ? starterSuggestions
                    : [
                        'Which of my items are under active warranty?',
                        'What is my total spending this month?',
                        'Which store do I spend the most money at?',
                        'Show my 5 most expensive purchases',
                      ]
                  ).map((promptText, idx) => {
                    const IconComponent =
                      idx === 0
                        ? ShieldCheck
                        : idx === 1
                        ? TrendingUp
                        : idx === 2
                        ? Store
                        : ReceiptText;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(promptText)}
                        className="relative p-3.5 rounded-xl border border-line/75 bg-surface/80 dark:bg-subtle/30 backdrop-blur-sm hover:bg-surface dark:hover:bg-subtle/70 hover:border-accent/45 hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 text-xs font-medium text-fg flex items-start justify-between gap-3 transition-all duration-200 group cursor-pointer text-left shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="size-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                            <IconComponent className="size-3.5" />
                          </div>
                          <span className="line-clamp-2 leading-snug">{promptText}</span>
                        </div>
                        <ArrowUpRight className="size-3.5 text-fg-3 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5" />
                      </button>
                    );
                  })}
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
                    {/* Message Bubble Container */}
                    <div
                      className={cn(
                        'max-w-[88%] sm:max-w-[85%] text-xs sm:text-sm',
                        isUser
                          ? 'rounded-2xl rounded-tr-xs bg-gradient-to-br from-accent via-accent to-accent/90 text-white shadow-md shadow-accent/20 px-4 py-3'
                          : 'relative rounded-2xl rounded-tl-xs bg-surface/90 dark:bg-card/90 backdrop-blur-xl border border-line/80 shadow-xs p-4.5 text-fg space-y-3'
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      ) : (
                        <div className="space-y-3">
                          {/* Assistant Meta Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-line/40 text-[11px] text-fg-3">
                            <div className="flex items-center gap-1.5 font-semibold text-accent">
                              <Sparkles className="size-3" />
                              <span>BillBox Assistant</span>
                            </div>
                            <span className="flex items-center gap-1 text-[10px]">
                              <Shield className="size-2.5 text-emerald-500" />
                              Vault Grounded
                            </span>
                          </div>

                          {/* Markdown Parsed Content */}
                          <MarkdownRenderer
                            content={message.content}
                            onNavigate={handleCitationNavigate}
                          />

                          {/* Reference Cards Preview */}
                          {message.references && (
                            <>
                              {message.references.products?.length > 0 && (
                                <div className="pt-2 border-t border-line/60 space-y-1.5">
                                  <span className="text-[10px] font-bold text-fg-3 uppercase tracking-wider block">
                                    Referenced Products
                                  </span>
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {message.references.products.map((p) => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleCitationNavigate('product', p.id)}
                                        className="p-2.5 rounded-xl border border-line/70 bg-subtle/50 hover:bg-hover text-left flex items-center justify-between transition-colors cursor-pointer group"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Package className="size-3.5 text-accent shrink-0 group-hover:scale-110 transition-transform" />
                                          <div className="min-w-0">
                                            <p className="text-xs font-semibold text-fg truncate">{p.productName}</p>
                                            <p className="text-[10px] text-fg-3">{p.brand || 'Product'}</p>
                                          </div>
                                        </div>
                                        {p.daysRemaining != null && (
                                          <span
                                            className={cn(
                                              'text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2',
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
                                  <span className="text-[10px] font-bold text-fg-3 uppercase tracking-wider block">
                                    Referenced Receipts
                                  </span>
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {message.references.receipts.map((r) => (
                                      <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => handleCitationNavigate('receipt', r.id)}
                                        className="p-2.5 rounded-xl border border-line/70 bg-subtle/50 hover:bg-hover text-left flex items-center justify-between transition-colors cursor-pointer group"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Store className="size-3.5 text-accent shrink-0 group-hover:scale-110 transition-transform" />
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

                          {/* Message Actions */}
                          <div className="flex items-center justify-between pt-1 border-t border-line/40 text-[11px] text-fg-3">
                            <span className="text-[10px] text-fg-3 flex items-center gap-1">
                              <Clock className="size-2.5" />
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleCopyMessage(message.content, idx)}
                              className="text-fg-3 hover:text-fg flex items-center gap-1 transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-hover"
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className="size-3 text-ok" />
                                  <span className="text-ok font-medium">Copied</span>
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
                            className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-surface/80 dark:bg-card/80 hover:bg-accent/10 border border-line/80 hover:border-accent/40 text-fg-2 hover:text-accent transition-all duration-150 cursor-pointer text-left shadow-2xs hover:shadow-xs flex items-center gap-1.5"
                          >
                            <span className="text-accent font-bold">+</span>
                            <span>{sug}</span>
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
                <div className="size-7 rounded-lg bg-gradient-to-tr from-accent to-teal-400 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Sparkles className="size-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-surface/90 dark:bg-card/90 border border-line/80 px-4 py-3 shadow-xs flex items-center gap-2.5 text-xs text-fg-2 font-medium">
                  <span className="animate-pulse">Consulting your receipts & warranties...</span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-accent animate-ping" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Composer Dock ── */}
          <div className="relative p-4 border-t border-line/70 bg-surface/85 dark:bg-card/85 backdrop-blur-2xl shrink-0 z-10">
            {/* Top Hairline Accent */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-line/80 to-transparent pointer-events-none" />

            <div className="relative flex items-end gap-2 bg-subtle/50 dark:bg-subtle/30 border border-line/80 focus-within:border-accent rounded-2xl p-2.5 transition-all shadow-inner">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about spending, stores, warranties... (Enter to send)"
                rows={1}
                className="w-full max-h-32 bg-transparent text-xs sm:text-sm text-fg placeholder:text-fg-3 focus:outline-none resize-none py-1 px-1.5 leading-relaxed"
                style={{ minHeight: '38px' }}
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || askMutation.isPending}
                className={cn(
                  'size-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer',
                  inputMessage.trim() && !askMutation.isPending
                    ? 'bg-gradient-to-tr from-accent to-accent-hover text-white shadow-md shadow-accent/25 hover:scale-105 active:scale-95'
                    : 'bg-subtle text-fg-3 cursor-not-allowed opacity-40'
                )}
                title="Send query"
                aria-label="Send query"
              >
                <Send className="size-4" />
              </button>
            </div>

            <div className="flex items-center text-[10px] text-fg-3 px-1 pt-2">
              <span className="flex items-center gap-1">
                <CornerDownLeft className="size-2.5 opacity-70" />
                Press Enter to send · Shift+Enter for new line
              </span>
            </div>
          </div>
        </m.div>
      </div>
    </div>
  );
}

export default AskBillBoxDrawer;
