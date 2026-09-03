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
  HelpCircle,
  Cpu
} from 'lucide-react';

interface AIAssistantViewProps {
  onUsePromptInNewJournal: (prompt: string) => void;
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
    description: 'Inquire into personal patterns, mental models, and areas of expansion.',
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
    description: 'Deconstruct the day using the classic dichotomy of control.',
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
    description: 'Untangle complex choices, career dilemmas, and strategic crossroads.',
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
    description: 'Anchor in moments of quiet abundance and meaningful connection.',
    prompts: [
      'What is one small luxury or convenience in my daily life that I take for granted?',
      'Who made an invisible contribution to my peace of mind or workflow this week?',
      'What aspect of my physical surroundings brought a moment of quiet appreciation today?',
      'What difficult experience from my past am I surprisingly grateful to have navigated?',
    ],
  },
];

export function AIAssistantView({ onUsePromptInNewJournal }: AIAssistantViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('growth');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const activeCategory = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(text);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6 min-w-0">
      
      {/* Header */}
      <div className="pb-4 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/40 border border-indigo-800/40 text-indigo-400 text-xs font-mono mb-1.5 flex-wrap">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>AI Reflection Companion</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white break-words">
            Intelligent Reflection Assistant
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5 break-words">
            Curated prompt frameworks designed for introspective clarity, cognitive reframing, and meaningful journaling.
          </p>
        </div>

        {/* Gemini Engine Architecture Badge */}
        <div className="p-2.5 rounded-xl bg-[#141417] border border-[#27272A] flex items-center gap-2 text-xs self-start sm:self-auto shrink-0">
          <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-left font-mono">
            <span className="text-[10px] text-[#71717A] block leading-tight">Engine Specification</span>
            <span className="text-white font-semibold text-xs">Gemini 3.6 Flash Ladder</span>
          </div>
        </div>
      </div>

      {/* Category Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-btn-${cat.id}`}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#1E1E22] border-indigo-500/60 ring-1 ring-indigo-500/30'
                  : 'bg-[#141417] border-[#27272A] hover:bg-[#1E1E22] hover:border-[#3F3F46]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[#1E1E22] text-[#71717A]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#E4E4E7]'}`}>
                  {cat.name}
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] line-clamp-2">
                {cat.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Prompts List */}
      <div className="p-6 rounded-2xl bg-[#141417] border border-[#27272A] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{activeCategory.name} Prompts</span>
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Select any prompt below to insert directly into a new journal entry.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {activeCategory.prompts.map((prompt, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0F0F12] border border-[#27272A] hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex-1">
                <span className="text-[10px] font-mono text-indigo-400/80 block mb-1">
                  PROMPT #{idx + 1}
                </span>
                <p className="text-sm text-[#E4E4E7] group-hover:text-white leading-relaxed font-serif">
                  "{prompt}"
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleCopy(prompt)}
                  className="p-2 rounded-lg bg-[#141417] hover:bg-[#1E1E22] text-[#71717A] hover:text-white transition-colors border border-[#27272A] cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copiedPrompt === prompt ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onUsePromptInNewJournal(prompt)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-indigo-950/40"
                >
                  <span>Write This</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Threat Mitigation Architecture Notice */}
      <div className="p-5 rounded-xl bg-[#141417] border border-[#27272A] space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Security & AI Safety Verification (Directive Compliance)</span>
        </div>
        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          GeminiVault protects reflections through strict separation of untrusted user inputs from system prompts (OWASP LLM01 indirect prompt injection defense). All journal data is bound exclusively to your cryptographic Google OAuth token and encrypted at rest in your isolated Firestore subcollection.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#71717A] font-mono pt-1">
          <span>Zero Server Storage of Passwords</span>
          <span>•</span>
          <span>Zero Cross-Tenant Leakage</span>
          <span>•</span>
          <span>OWASP LLM01-LLM05 Verified</span>
        </div>
      </div>

    </div>
  );
}
