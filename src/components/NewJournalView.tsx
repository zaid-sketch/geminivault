import { useState, type FormEvent } from 'react';
import { 
  Send, 
  Sparkles, 
  Tag as TagIcon, 
  Bookmark, 
  Pin, 
  Check, 
  HelpCircle, 
  RefreshCw, 
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import type { MoodType, JournalEntryInput } from '../types';
import { VALID_MOODS, calculateReadingMetrics } from '../services/journalService';

interface NewJournalViewProps {
  userId: string;
  initialPrompt?: string;
  onSaveEntry: (entry: JournalEntryInput) => Promise<boolean>;
  onNavigateToHistory: () => void;
}

const MOOD_CONFIG: Record<MoodType, { label: string; icon: string; color: string; border: string }> = {
  peaceful: { label: 'Peaceful', icon: '🕊️', color: 'bg-teal-950/40 text-teal-300', border: 'border-teal-700/50' },
  energized: { label: 'Energized', icon: '⚡', color: 'bg-amber-950/40 text-amber-300', border: 'border-amber-700/50' },
  reflective: { label: 'Reflective', icon: '🌙', color: 'bg-indigo-950/40 text-indigo-300', border: 'border-indigo-700/50' },
  grateful: { label: 'Grateful', icon: '🙏', color: 'bg-emerald-950/40 text-emerald-300', border: 'border-emerald-700/50' },
  focused: { label: 'Focused', icon: '🎯', color: 'bg-blue-950/40 text-blue-300', border: 'border-blue-700/50' },
  anxious: { label: 'Anxious', icon: '🌊', color: 'bg-orange-950/40 text-orange-300', border: 'border-orange-700/50' },
  tired: { label: 'Tired', icon: '💤', color: 'bg-stone-800 text-stone-300', border: 'border-stone-700' },
};

const SUGGESTED_PROMPTS = [
  {
    theme: 'Daily Decompression',
    text: 'What was the single most meaningful conversation or interaction I had today, and why?',
  },
  {
    theme: 'Stoic Perspective',
    text: 'What was outside my control today that I spent energy on, and how can I release it?',
  },
  {
    theme: 'Gratitude Anchor',
    text: 'Name three small, ordinary things that brought genuine comfort or ease today.',
  },
  {
    theme: 'Clarity & Next Action',
    text: 'What is the one priority that, if accomplished tomorrow, will make everything else easier?',
  },
  {
    theme: 'Inner Growth',
    text: 'Where did I notice myself reacting rather than responding today, and what triggered it?',
  },
];

const SUGGESTED_TAGS = ['reflection', 'growth', 'gratitude', 'focus', 'work', 'mindset', 'evening'];

export function NewJournalView({
  userId: _userId,
  initialPrompt = '',
  onSaveEntry,
  onNavigateToHistory,
}: NewJournalViewProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('reflective');
  const [tags, setTags] = useState<string[]>(['reflection']);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [aiPromptUsed, setAiPromptUsed] = useState(initialPrompt);
  const [showPrompts, setShowPrompts] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const metrics = calculateReadingMetrics(content);

  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean) && tags.length < 10) {
      setTags([...tags, clean]);
      setCurrentTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleInsertPrompt = (promptText: string) => {
    setAiPromptUsed(promptText);
    if (!title) {
      setTitle(promptText.length > 50 ? promptText.slice(0, 47) + '...' : promptText);
    }
    const prefix = content ? `${content}\n\n> Prompt: ${promptText}\n\n` : `> Prompt: ${promptText}\n\n`;
    setContent(prefix);
    setShowPrompts(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!title.trim()) {
      setErrorMessage('Please give your journal entry a title.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Please write your thoughts before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: JournalEntryInput = {
        title: title.trim(),
        content: content.trim(),
        mood,
        tags,
        favorite,
        pinned,
        aiPromptUsed,
      };

      const success = await onSaveEntry(payload);
      if (success) {
        setSaveSuccess(true);
        // Clear fields on confirmed save
        setTitle('');
        setContent('');
        setTags(['reflection']);
        setAiPromptUsed('');
        setFavorite(false);
        setPinned(false);
      } else {
        setErrorMessage('Could not persist your journal entry to Firestore. Please retry.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during save';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6 min-w-0">
      
      {/* View Header with Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A] min-w-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 break-words">
            New Journal Entry
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5 break-words">
            Encrypted in your personal Firestore partition. Never shared across accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            id="toggle-ai-prompts-btn"
            type="button"
            onClick={() => setShowPrompts(!showPrompts)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E1E22] hover:bg-[#27272A] text-indigo-400 border border-indigo-500/30 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{showPrompts ? 'Hide AI Prompts' : 'Spark Reflection'}</span>
          </button>
        </div>
      </div>

      {/* Guided AI Prompts Drawer */}
      {showPrompts && (
        <div id="ai-prompts-drawer" className="p-4 rounded-xl bg-[#141417] border border-[#27272A] space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> Guided Reflection Prompts
            </span>
            <span className="text-[11px] text-[#71717A]">Click any prompt to insert into your entry</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {SUGGESTED_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsertPrompt(item.text)}
                className="text-left p-3 rounded-lg bg-[#0F0F12] hover:bg-[#1E1E22] border border-[#27272A] hover:border-indigo-500/40 transition-all group cursor-pointer"
              >
                <span className="text-[10px] font-mono text-indigo-400 uppercase block mb-1">
                  {item.theme}
                </span>
                <p className="text-xs text-[#A1A1AA] group-hover:text-white leading-snug">
                  "{item.text}"
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner with Retry Escalation */}
      {errorMessage && (
        <div 
          id="journal-save-error-banner"
          className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 flex items-start justify-between gap-3 text-sm"
          role="alert"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-100">Save Operation Failed</p>
              <p className="text-xs text-rose-300 mt-0.5">{errorMessage}</p>
              <p className="text-[11px] text-rose-400 mt-1">
                Your draft has been preserved. Check your network or permissions and click Save again.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-xs font-semibold text-rose-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>Retry Save</span>
          </button>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccess && (
        <div 
          id="journal-save-success-banner"
          className="p-4 rounded-xl bg-green-950/40 border border-green-800 text-green-200 flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-green-100">Journal Saved Successfully</p>
              <p className="text-xs text-green-300">Safely recorded in your isolated Firestore subcollection.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToHistory}
            className="px-3 py-1.5 rounded-lg bg-green-900/60 hover:bg-green-800 text-xs font-semibold text-green-100 transition-colors cursor-pointer"
          >
            View in History →
          </button>
        </div>
      )}

      {/* Main Journal Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Title Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="journal-title-input" className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
              Entry Title
            </label>
            <span className="text-[11px] text-[#71717A] font-mono">
              {title.length}/150
            </span>
          </div>
          <input
            id="journal-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="What is the focal theme of your day or mind?"
            className="w-full px-4 py-3 rounded-xl bg-[#141417] border border-[#27272A] text-white text-base placeholder:text-[#71717A] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Mood Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] block">
            State of Mind (Mood)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {VALID_MOODS.map((m) => {
              const cfg = MOOD_CONFIG[m];
              const isSelected = mood === m;
              return (
                <button
                  key={m}
                  id={`mood-btn-${m}`}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? `${cfg.color} ${cfg.border} ring-1 ring-indigo-400/50 shadow-sm`
                      : 'bg-[#141417] border-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#1E1E22]'
                  }`}
                >
                  <span className="text-lg mb-1">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active AI Prompt Banner if used */}
        {aiPromptUsed && (
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-indigo-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Active Prompt:</strong> "{aiPromptUsed}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAiPromptUsed('')}
              className="text-[11px] text-indigo-400 hover:text-indigo-200 underline ml-2 shrink-0 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="journal-content-textarea" className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Journal Content
            </label>
            <div className="flex items-center gap-3 text-[11px] text-[#71717A] font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#71717A]" /> ~{metrics.readingTimeMinutes} min read
              </span>
              <span>{metrics.wordCount} words</span>
            </div>
          </div>
          <textarea
            id="journal-content-textarea"
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write without judgment. This space is entirely yours — thoughts, decisions, struggles, gratitude, or quiet observations..."
            className="w-full px-4 py-3.5 rounded-xl bg-[#141417] border border-[#27272A] text-white text-sm sm:text-base leading-relaxed placeholder:text-[#71717A] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-y min-h-[260px]"
          />
        </div>

        {/* Tags & Attributes */}
        <div className="p-4 rounded-xl bg-[#141417] border border-[#27272A] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label htmlFor="journal-tag-input" className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5" /> Tags & Themes ({tags.length}/10)
            </label>
            <div className="flex items-center gap-4">
              {/* Pin Toggle */}
              <button
                id="toggle-pin-btn"
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  pinned 
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                    : 'bg-[#1E1E22] text-[#71717A] border-[#27272A] hover:text-white'
                }`}
              >
                <Pin className="w-3 h-3" />
                <span>{pinned ? 'Pinned to top' : 'Pin entry'}</span>
              </button>

              {/* Favorite Toggle */}
              <button
                id="toggle-favorite-btn"
                type="button"
                onClick={() => setFavorite(!favorite)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  favorite 
                    ? 'bg-rose-950/40 text-rose-300 border-rose-700/60' 
                    : 'bg-[#1E1E22] text-[#71717A] border-[#27272A] hover:text-white'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                <span>{favorite ? 'Favorited' : 'Favorite'}</span>
              </button>
            </div>
          </div>

          {/* Tag Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1E1E22] text-[#E4E4E7] text-xs border border-[#27272A]"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-400 ml-0.5 text-[#71717A] cursor-pointer"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="journal-tag-input"
              type="text"
              value={currentTagInput}
              onChange={(e) => setCurrentTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  handleAddTag(currentTagInput);
                }
              }}
              placeholder="+ Add tag (press Enter)"
              className="px-2.5 py-1 text-xs bg-[#0F0F12] border border-[#27272A] rounded-md text-white placeholder:text-[#71717A] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick Tag Suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-[#71717A]">Suggestions:</span>
            {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 5).map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleAddTag(sug)}
                className="text-[11px] text-[#71717A] hover:text-indigo-400 hover:underline cursor-pointer"
              >
                +{sug}
              </button>
            ))}
          </div>
        </div>

        {/* Form Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#27272A]">
          <div className="text-xs text-[#71717A] flex items-center gap-1.5 flex-wrap">
            <HelpCircle className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
            <span>Encrypted with Google OAuth UID isolation</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="save-journal-submit-btn"
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-sm transition-all disabled:opacity-60 shadow-md shadow-indigo-950/40 cursor-pointer"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Persisting to Firestore...' : 'Save to GeminiVault'}</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
