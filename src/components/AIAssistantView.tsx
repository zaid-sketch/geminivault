import { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Compass,
  BookOpen,
  Lightbulb,
  Cpu,
  Send,
  RotateCcw,
  Loader2,
  Bot,
  User,
} from 'lucide-react';
import { auth } from '../lib/firebase';

interface AIAssistantViewProps {
  onUsePromptInNewJournal: (prompt: string) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface PromptCategory {
  id: string;
  name: string;
  icon: typeof Sparkles;
  description: string;
  prompts: string[];
}

const CATEGORIES: PromptCategory[] = [
  {
    id: 'growth',
    name: 'Personal Growth & Self-Awareness',
    icon: Compass,
    description: 'Explore personal patterns, mental models, and areas of growth.',
    prompts: [
      'What is an assumption I made this week that might be limiting my perspective?',
      'Where did I feel friction recently, and what need was struggling to be heard?',
      'If I looked at today through the eyes of an impartial, compassionate mentor, what would they notice?',
      'What is a boundary I either maintained well or need to gently reinforce?',
    ],
  },
  {
    id: 'stoic',
    name: 'Stoic Evening Reflection',
    icon: ShieldCheck,
    description: 'Deconstruct the day using the dichotomy of control.',
    prompts: [
      'What event today triggered worry, and was any part of it within my direct control?',
      'How did I respond to unexpected friction or delays today: with grace or irritation?',
      'What is one task or action I postponed, and what fear was behind that hesitation?',
      'What can I let go of right now before resting so my mind is completely clear?',
    ],
  },
  {
    id: 'clarity',
    name: 'Decision Making & Clarity',
    icon: Lightbulb,
    description: 'Untangle complex choices and strategic crossroads.',
    prompts: [
      'What decision am I currently overthinking, and what is the simplest first test?',
      'If both choices succeed, which outcome aligns better with who I want to be in three years?',
      'What information am I truly missing versus merely delaying out of fear of committing?',
      'What would I advise my closest friend to do if they faced this exact situation?',
    ],
  },
  {
    id: 'gratitude',
    name: 'Deep Gratitude & Grounding',
    icon: BookOpen,
    description: 'Reflect on meaningful moments and quiet abundance.',
    prompts: [
      'What is one small luxury or convenience in my daily life that I take for granted?',
      'Who made an invisible contribution to my peace of mind or workflow this week?',
      'What aspect of my physical surroundings brought a moment of quiet appreciation today?',
      'What difficult experience from my past am I surprisingly grateful to have navigated?',
    ],
  },
];

export function AIAssistantView({
  onUsePromptInNewJournal,
}: AIAssistantViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('growth');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const activeCategory =
    CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPrompt(text);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const handleSendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? chatInput).trim();

    if (!text || isSending) return;

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setChatError('You must be signed in to use the AI Reflection Companion.');
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', text },
    ];

    setMessages(nextMessages);
    setChatInput('');
    setChatError(null);
    setIsSending(true);

    try {
      const idToken = await currentUser.getIdToken();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          messages: nextMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gemini chat request failed.');
      }

      setMessages([
        ...nextMessages,
        {
          role: 'model',
          text: String(data.message || ''),
        },
      ]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : 'Unable to contact the AI Reflection Companion.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setChatInput('');
    setChatError(null);
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6 min-w-0">

      {/* Header */}
      <div className="pb-4 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/40 border border-indigo-800/40 text-indigo-400 text-xs font-mono mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Reflection Companion</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Intelligent Reflection Assistant
          </h2>

          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Secure multi-turn reflection powered by Gemini.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-[#141417] border border-[#27272A] flex items-center gap-2 text-xs">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <div className="font-mono">
            <span className="text-[10px] text-[#71717A] block">
              Gemini Engine
            </span>
            <span className="text-white font-semibold">
              Server-Side Secure
            </span>
          </div>
        </div>
      </div>

      {/* MULTI-TURN GEMINI CHAT */}
      <div className="rounded-2xl bg-[#141417] border border-indigo-500/30 overflow-hidden">

        <div className="p-4 border-b border-[#27272A] flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              Gemini Conversation
            </h3>

            <p className="text-[11px] text-[#A1A1AA] mt-1">
              Previous turns are securely included so Gemini can maintain context.
            </p>
          </div>

          <button
            type="button"
            onClick={handleNewConversation}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#3F3F46] text-xs text-[#D4D4D8] hover:text-white hover:bg-[#1E1E22]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Conversation
          </button>
        </div>

        <div className="p-4 space-y-3 min-h-[240px] max-h-[460px] overflow-y-auto">

          {messages.length === 0 && (
            <div className="py-10 text-center">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">
                Start a reflection conversation
              </p>
              <p className="text-xs text-[#71717A] mt-1">
                Ask Gemini about a decision, feeling, challenge, or idea.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-2 ${
                message.role === 'user'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {message.role === 'model' && (
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#0F0F12] border border-[#27272A] text-[#E4E4E7]'
                }`}
              >
                {message.text}
              </div>

              {message.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#27272A] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#D4D4D8]" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              Gemini is reflecting...
            </div>
          )}
        </div>

        {chatError && (
          <div className="mx-4 mb-3 p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-xs text-red-300">
            {chatError}
          </div>
        )}

        <div className="p-4 border-t border-[#27272A]">
          <div className="flex gap-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              placeholder="Talk to Gemini about what is on your mind..."
              rows={2}
              maxLength={4000}
              disabled={isSending}
              className="flex-1 resize-none rounded-xl bg-[#0A0A0B] border border-[#27272A] px-3 py-2.5 text-sm text-white placeholder:text-[#52525B] focus:outline-none focus:border-indigo-500"
            />

            <button
              type="button"
              onClick={() => void handleSendMessage()}
              disabled={!chatInput.trim() || isSending}
              className="self-end p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white"
              title="Send message"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-[10px] text-[#71717A] mt-2 font-mono">
            Authenticated request • Firebase ID token • Server-side Gemini API
          </p>
        </div>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-[#1E1E22] border-indigo-500/60'
                  : 'bg-[#141417] border-[#27272A] hover:bg-[#1E1E22]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-white">
                  {cat.name}
                </span>
              </div>

              <p className="text-[11px] text-[#A1A1AA]">
                {cat.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Reflection Prompts */}
      <div className="p-6 rounded-2xl bg-[#141417] border border-[#27272A] space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            {activeCategory.name} Prompts
          </h3>

          <p className="text-xs text-[#A1A1AA] mt-1">
            Start a Gemini conversation or use a prompt directly in your journal.
          </p>
        </div>

        <div className="space-y-3">
          {activeCategory.prompts.map((prompt, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0F0F12] border border-[#27272A]"
            >
              <p className="text-sm text-[#E4E4E7] leading-relaxed">
                "{prompt}"
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => void handleSendMessage(prompt)}
                  disabled={isSending}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask Gemini
                </button>

                <button
                  type="button"
                  onClick={() => onUsePromptInNewJournal(prompt)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1E1E22] border border-[#3F3F46] text-white text-xs"
                >
                  Write This
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => void handleCopy(prompt)}
                  className="p-2 rounded-lg border border-[#27272A] text-[#A1A1AA]"
                  title="Copy"
                >
                  {copiedPrompt === prompt ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="p-5 rounded-xl bg-[#141417] border border-[#27272A] space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Authenticated Gemini Conversation</span>
        </div>

        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          Gemini requests are sent through the authenticated GeminiVault
          backend. The browser does not contain the Gemini API key, and the
          server verifies the Firebase identity before processing each
          conversation.
        </p>
      </div>

    </div>
  );
}
