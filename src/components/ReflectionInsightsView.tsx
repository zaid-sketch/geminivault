import { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  BarChart3, 
  Flame, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Tag as TagIcon,
  Smile, 
  Plus, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Bookmark, 
  Trash2, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  History,
  CheckCircle2,
  X
} from 'lucide-react';
import type { JournalEntry, MoodType, ReflectionInsight, ReflectionGenerationPayload } from '../types';
import { VALID_MOODS } from '../services/journalService';
import { 
  generateReflectionWithGemini, 
  saveReflectionInsight, 
  subscribeToUserReflections, 
  deleteReflectionInsight 
} from '../services/reflectionService';

interface ReflectionInsightsViewProps {
  userId: string;
  entries: JournalEntry[];
  onNavigateToNew: () => void;
  onUseQuestionAsPrompt?: (prompt: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, details?: string) => void;
}

const MOOD_EMOJIS: Record<MoodType, string> = {
  peaceful: '🕊️',
  energized: '⚡',
  reflective: '🌙',
  grateful: '🙏',
  focused: '🎯',
  anxious: '🌊',
  tired: '💤',
};

const MOOD_COLORS: Record<MoodType, string> = {
  peaceful: 'bg-teal-500',
  energized: 'bg-amber-500',
  reflective: 'bg-indigo-500',
  grateful: 'bg-emerald-500',
  focused: 'bg-blue-500',
  anxious: 'bg-orange-500',
  tired: 'bg-stone-500',
};

type ViewMode = 'engine' | 'history' | 'trends';

export function ReflectionInsightsView({
  userId,
  entries,
  onNavigateToNew,
  onUseQuestionAsPrompt,
  onShowToast,
}: ReflectionInsightsViewProps) {
  const [activeMode, setActiveMode] = useState<ViewMode>('engine');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Default select up to 3 most recent entries if available
    const initial = new Set<string>();
    entries.slice(0, 3).forEach((e) => initial.add(e.id));
    return initial;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [moodFilter, setMoodFilter] = useState<string>('all');

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentInsight, setCurrentInsight] = useState<ReflectionGenerationPayload | null>(null);
  const [analyzedEntries, setAnalyzedEntries] = useState<JournalEntry[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Saved Reflections State
  const [savedReflections, setSavedReflections] = useState<ReflectionInsight[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [viewingSavedInsight, setViewingSavedInsight] = useState<ReflectionInsight | null>(null);

  // Real-time subscription to saved reflection insights
  useEffect(() => {
    if (!userId) return;
    setIsHistoryLoading(true);
    const unsubscribe = subscribeToUserReflections(
      userId,
      (items) => {
        setSavedReflections(items);
        setIsHistoryLoading(false);
      },
      (err) => {
        console.error('[GeminiVault] Failed to load saved reflections:', err);
        setIsHistoryLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  // Filter entries for selection
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch = 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesMood = moodFilter === 'all' || e.mood === moodFilter;
      return matchesSearch && matchesMood;
    });
  }, [entries, searchTerm, moodFilter]);

  // Selected entries calculation
  const selectedEntries = useMemo(() => {
    return entries.filter((e) => selectedIds.has(e.id));
  }, [entries, selectedIds]);

  const totalSelectedWords = useMemo(() => {
    return selectedEntries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
  }, [selectedEntries]);

  // Toggle selection
  const handleToggleEntry = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = new Set<string>();
    filteredEntries.forEach((e) => all.add(e.id));
    setSelectedIds(all);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleSelectRecent = (count: number) => {
    const recent = new Set<string>();
    entries.slice(0, count).forEach((e) => recent.add(e.id));
    setSelectedIds(recent);
  };

  // Generate AI Reflection Insights
  const handleGenerate = async () => {
    if (selectedEntries.length === 0) {
      if (onShowToast) onShowToast('info', 'No Entries Selected', 'Please select at least one entry to analyze.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setCurrentInsight(null);
    setIsSaved(false);

    const result = await generateReflectionWithGemini(userId, selectedEntries);

    setIsGenerating(false);

    if (result.success && result.insights) {
      setCurrentInsight(result.insights);
      setAnalyzedEntries(selectedEntries);
      if (onShowToast) {
        onShowToast('success', 'Reflection Insights Generated', `Grounded in ${selectedEntries.length} journal entries.`);
      }
    } else {
      setGenerationError(result.error || 'Failed to synthesize reflection insights. Please try again.');
      if (onShowToast) {
        onShowToast('error', 'AI Generation Failed', result.error);
      }
    }
  };

  // Save active reflection to Firestore
  const handleSaveToVault = async () => {
    if (!currentInsight || isSaved || isSaving) return;
    setIsSaving(true);

    const record = {
      userId,
      entryIds: analyzedEntries.map((e) => e.id),
      entryTitles: analyzedEntries.map((e) => e.title),
      keyThemes: currentInsight.keyThemes,
      emotionalPatterns: currentInsight.emotionalPatterns,
      positiveProgress: currentInsight.positiveProgress,
      recurringChallenges: currentInsight.recurringChallenges,
      reflectionSummary: currentInsight.reflectionSummary,
      followUpQuestions: currentInsight.followUpQuestions,
      modelUsed: currentInsight.modelUsed,
      createdAt: Date.now(),
    };

    const saveResult = await saveReflectionInsight(userId, record);
    setIsSaving(false);

    if (saveResult.success) {
      setIsSaved(true);
      if (onShowToast) {
        onShowToast('success', 'Saved to Reflection Vault', 'Stored securely under your isolated partition.');
      }
    } else {
      if (onShowToast) {
        onShowToast('error', 'Failed to Save Reflection', saveResult.error);
      }
    }
  };

  // Delete saved reflection from history
  const handleDeleteSaved = async (id: string) => {
    const res = await deleteReflectionInsight(userId, id);
    if (res.success) {
      if (viewingSavedInsight?.id === id) setViewingSavedInsight(null);
      if (onShowToast) onShowToast('info', 'Reflection Insight Removed');
    } else {
      if (onShowToast) onShowToast('error', 'Failed to remove reflection', res.error);
    }
  };

  // Export as Markdown
  const handleDownloadMarkdown = (insight: ReflectionGenerationPayload | ReflectionInsight) => {
    const md = `
# GeminiVault Cognitive Reflection Analysis
**Generated with**: ${insight.modelUsed || 'Gemini'}
**Date**: ${new Date().toLocaleString()}

## Reflection Summary
${insight.reflectionSummary}

## Key Themes
${insight.keyThemes.map((t) => `- ${t}`).join('\n')}

## Emotional Patterns
${insight.emotionalPatterns.map((p) => `- ${p}`).join('\n')}

## Positive Progress & Breakthroughs
${insight.positiveProgress.map((pr) => `- ${pr}`).join('\n')}

## Recurring Challenges & Frictions
${insight.recurringChallenges.map((c) => `- ${c}`).join('\n')}

## Follow-Up Reflection Questions
${insight.followUpQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

---
*Stored in GeminiVault under owner-isolated encryption.*
    `.trim();

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GeminiVault-Reflection-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute analytics for trends tab
  const analytics = useMemo(() => {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalWords: 0,
        avgWords: 0,
        streakDays: 0,
        moodCounts: {} as Record<MoodType, number>,
        topTags: [] as Array<{ tag: string; count: number }>,
        mostFrequentMood: null as MoodType | null,
      };
    }

    const totalEntries = entries.length;
    let totalWords = 0;
    const moodCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    VALID_MOODS.forEach((m) => { moodCounts[m] = 0; });
    const dates = new Set<string>();

    entries.forEach((e) => {
      totalWords += e.wordCount || 0;
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
      if (e.tags) {
        e.tags.forEach((t) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }
      const dateStr = new Date(e.createdAt).toISOString().split('T')[0];
      dates.add(dateStr);
    });

    const avgWords = Math.round(totalWords / totalEntries);
    const sortedDates = Array.from(dates).sort().reverse();
    let streakDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const d = new Date(sortedDates[i]);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === streakDays || diffDays === streakDays + 1) {
        streakDays++;
      } else {
        break;
      }
    }

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    let maxCount = -1;
    let mostFrequentMood: MoodType | null = null;
    Object.entries(moodCounts).forEach(([m, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        mostFrequentMood = m as MoodType;
      }
    });

    return {
      totalEntries,
      totalWords,
      avgWords,
      streakDays: Math.max(1, streakDays),
      moodCounts: moodCounts as Record<MoodType, number>,
      topTags,
      mostFrequentMood,
    };
  }, [entries]);

  return (
    <div className="max-w-5xl w-full mx-auto space-y-6 min-w-0">
      
      {/* Top Header */}
      <div className="pb-4 border-b border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-2 flex-wrap">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Confidential Cognitive AI Synthesis</span>
            <span className="text-[#71717A]">•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 shrink-0" /> Owner-Isolated
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white break-words">
            Reflection Insights & Intelligence
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1 break-words">
            Analyze your personal journal entries with Gemini to reveal emotional rhythms, breakthroughs, and thoughtful growth questions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            id="insights-new-journal-btn"
            type="button"
            onClick={onNavigateToNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-indigo-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>New Journal</span>
          </button>
        </div>
      </div>

      {/* Segmented Mode Navigation */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1 rounded-xl bg-[#141417] border border-[#27272A] w-full sm:w-fit max-w-full">
        <button
          id="tab-mode-engine"
          type="button"
          onClick={() => setActiveMode('engine')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeMode === 'engine'
              ? 'bg-[#1E1E22] text-white border border-[#27272A] shadow-sm'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeMode === 'engine' ? 'text-indigo-400' : 'text-[#71717A]'}`} />
          <span className="hidden sm:inline">AI Reflection Studio</span>
          <span className="sm:hidden">AI Studio</span>
        </button>

        <button
          id="tab-mode-history"
          type="button"
          onClick={() => setActiveMode('history')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeMode === 'history'
              ? 'bg-[#1E1E22] text-white border border-[#27272A] shadow-sm'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <History className={`w-3.5 h-3.5 shrink-0 ${activeMode === 'history' ? 'text-indigo-400' : 'text-[#71717A]'}`} />
          <span className="hidden sm:inline">Saved Vault Reflections</span>
          <span className="sm:hidden">Saved</span>
          {savedReflections.length > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
              {savedReflections.length}
            </span>
          )}
        </button>

        <button
          id="tab-mode-trends"
          type="button"
          onClick={() => setActiveMode('trends')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeMode === 'trends'
              ? 'bg-[#1E1E22] text-white border border-[#27272A] shadow-sm'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <BarChart3 className={`w-3.5 h-3.5 shrink-0 ${activeMode === 'trends' ? 'text-indigo-400' : 'text-[#71717A]'}`} />
          <span className="hidden sm:inline">Vault Metrics & Trends</span>
          <span className="sm:hidden">Trends</span>
        </button>
      </div>

      {/* MODE 1: AI REFLECTION STUDIO */}
      {activeMode === 'engine' && (
        <div className="space-y-6">
          
          {/* Empty State if user has zero journal entries */}
          {entries.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#141417] border border-dashed border-[#27272A] text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1E1E22] border border-[#27272A] flex items-center justify-center text-indigo-400 mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">No Journal Entries Available</h3>
                <p className="text-xs text-[#A1A1AA] max-w-md mx-auto">
                  Reflection Insights requires at least one journal entry to analyze themes, emotional dynamics, and growth questions.
                </p>
              </div>
              <button
                id="empty-first-entry-btn"
                type="button"
                onClick={onNavigateToNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-indigo-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Write Your First Journal Entry</span>
              </button>
            </div>
          ) : (
            <>
              {/* Entry Selection Workspace */}
              <div className="p-5 rounded-2xl bg-[#141417] border border-[#27272A] space-y-4">
                
                {/* Header & Quick Selectors */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>Select Journal Entries for Analysis</span>
                    </h3>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      Choose one or more entries. Gemini will synthesize overarching patterns while preserving strict tenant isolation.
                    </p>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelectRecent(3)}
                      className="px-2.5 py-1 rounded-md bg-[#1E1E22] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] transition-colors cursor-pointer"
                    >
                      Recent 3
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRecent(5)}
                      className="px-2.5 py-1 rounded-md bg-[#1E1E22] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] transition-colors cursor-pointer"
                    >
                      Recent 5
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2.5 py-1 rounded-md bg-[#1E1E22] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] transition-colors cursor-pointer"
                    >
                      Select All ({filteredEntries.length})
                    </button>
                    {selectedIds.size > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="px-2.5 py-1 rounded-md text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Search & Mood Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="entry-search-filter"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filter entries by title, tag, or content..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0F0F12] border border-[#27272A] text-xs text-[#E4E4E7] placeholder-[#71717A] focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="w-full sm:w-auto flex items-center gap-1.5">
                    <label htmlFor="mood-filter-select" className="text-xs text-[#71717A] whitespace-nowrap">Mood:</label>
                    <select
                      id="mood-filter-select"
                      value={moodFilter}
                      onChange={(e) => setMoodFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0F0F12] border border-[#27272A] text-xs text-[#E4E4E7] focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Moods</option>
                      {VALID_MOODS.map((m) => (
                        <option key={m} value={m}>
                          {MOOD_EMOJIS[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Entry List Grid */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredEntries.map((entry) => {
                    const isSelected = selectedIds.has(entry.id);
                    return (
                      <div
                        key={entry.id}
                        onClick={() => handleToggleEntry(entry.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isSelected
                            ? 'bg-indigo-950/20 border-indigo-500/50 text-white shadow-sm shadow-indigo-950/20'
                            : 'bg-[#0F0F12] border-[#27272A] text-[#E4E4E7] hover:border-[#3F3F46]'
                        }`}
                      >
                        {/* Custom Checkbox */}
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-[#3F3F46] bg-[#141417]'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {/* Entry Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span title={`Mood: ${entry.mood}`}>{MOOD_EMOJIS[entry.mood]}</span>
                            <h4 className="text-xs font-semibold truncate text-white">{entry.title}</h4>
                          </div>
                          <p className="text-[11px] text-[#A1A1AA] line-clamp-1 mt-0.5">
                            {entry.content}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#71717A] font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {entry.wordCount} words (~{entry.readingTimeMinutes}m)
                            </span>
                            {entry.tags && entry.tags.length > 0 && (
                              <span className="truncate">
                                #{entry.tags.slice(0, 2).join(' #')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Trigger & Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#27272A]">
                  <div className="text-xs text-[#A1A1AA]">
                    <span className="font-semibold text-white">{selectedEntries.length}</span> {selectedEntries.length === 1 ? 'entry' : 'entries'} selected 
                    <span className="text-[#71717A] font-mono ml-1.5">
                      (~{totalSelectedWords.toLocaleString()} words total)
                    </span>
                  </div>

                  <button
                    id="trigger-reflection-btn"
                    type="button"
                    disabled={selectedEntries.length === 0 || isGenerating}
                    onClick={handleGenerate}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer ${
                      selectedEntries.length === 0 || isGenerating
                        ? 'bg-[#1E1E22] text-[#71717A] border border-[#27272A] cursor-not-allowed'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-950/50'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Synthesizing with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Generate Reflection Insights</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* GENERATION LOADING STATE */}
              {isGenerating && (
                <div className="p-8 rounded-2xl bg-[#141417] border border-indigo-500/30 text-center space-y-4 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">
                      Analyzing Reflection Data with Gemini
                    </h3>
                    <p className="text-xs text-indigo-300/80 font-mono">
                      Executing resilient multi-model fallback ladder • Examining emotional valence & recurring themes
                    </p>
                  </div>
                  <div className="max-w-md mx-auto grid grid-cols-3 gap-2 text-[11px] text-[#A1A1AA] pt-2">
                    <div className="p-2 rounded-lg bg-[#0F0F12] border border-[#27272A]">
                      1. Ingest Entries
                    </div>
                    <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-semibold">
                      2. Cognitive Synthesizer
                    </div>
                    <div className="p-2 rounded-lg bg-[#0F0F12] border border-[#27272A]">
                      3. Actionable Prompts
                    </div>
                  </div>
                </div>
              )}

              {/* GENERATION ERROR STATE */}
              {generationError && !isGenerating && (
                <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3">
                  <div className="flex items-start gap-3 text-rose-300">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Reflection Synthesis Interrupted</h4>
                      <p className="text-xs text-rose-200/80 mt-0.5 leading-relaxed">{generationError}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="retry-reflection-btn"
                      type="button"
                      onClick={handleGenerate}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-white font-medium text-xs border border-rose-700/60 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Analysis</span>
                    </button>
                  </div>
                </div>
              )}

              {/* GENERATION SUCCESS STATE (STRUCTURED OUTPUT) */}
              {currentInsight && !isGenerating && (
                <div className="p-6 rounded-2xl bg-[#141417] border border-[#27272A] space-y-6">
                  
                  {/* AI Demarcation Banner */}
                  <div className="p-3.5 rounded-xl bg-[#0F0F12] border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            AI-Generated Cognitive Reflection
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {currentInsight.modelUsed || 'Gemini 3.6 Flash'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                          Synthesized across {analyzedEntries.length} selected journal entries. Completely private to your authenticated account.
                        </p>
                      </div>
                    </div>

                    {/* Report Action Buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        id="save-to-vault-btn"
                        type="button"
                        onClick={handleSaveToVault}
                        disabled={isSaved || isSaving}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                        <span>{isSaved ? 'Saved in Vault' : isSaving ? 'Saving...' : 'Save to Vault'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadMarkdown(currentInsight)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1E1E22] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] text-xs transition-colors cursor-pointer"
                        title="Export Markdown Report"
                      >
                        Download
                      </button>
                    </div>
                  </div>

                  {/* 1. Reflection Summary */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-indigo-400">
                      <span>Executive Reflection Summary</span>
                    </h3>
                    <div className="p-4 rounded-xl bg-[#0F0F12] border border-[#27272A] text-xs text-[#E4E4E7] leading-relaxed whitespace-pre-line">
                      {currentInsight.reflectionSummary}
                    </div>
                  </div>

                  {/* 2-Column: Key Themes & Emotional Patterns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Key Themes */}
                    <div className="p-4 rounded-xl bg-[#0F0F12] border border-[#27272A] space-y-2.5">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Key Themes & Focal Points</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {currentInsight.keyThemes.map((theme, i) => (
                          <li key={i} className="text-xs text-[#E4E4E7] flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                            <span>{theme}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Emotional Patterns */}
                    <div className="p-4 rounded-xl bg-[#0F0F12] border border-[#27272A] space-y-2.5">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Smile className="w-3.5 h-3.5 text-purple-400" />
                        <span>Emotional Patterns & Valence</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {currentInsight.emotionalPatterns.map((pat, i) => (
                          <li key={i} className="text-xs text-[#E4E4E7] flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                            <span>{pat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* 2-Column: Positive Progress & Recurring Challenges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Positive Progress */}
                    <div className="p-4 rounded-xl bg-[#0F0F12] border border-emerald-500/20 space-y-2.5">
                      <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Positive Progress & Breakthroughs</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {currentInsight.positiveProgress.map((item, i) => (
                          <li key={i} className="text-xs text-[#E4E4E7] flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recurring Challenges */}
                    <div className="p-4 rounded-xl bg-[#0F0F12] border border-amber-500/20 space-y-2.5">
                      <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Recurring Challenges & Obstacles</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {currentInsight.recurringChallenges.map((item, i) => (
                          <li key={i} className="text-xs text-[#E4E4E7] flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* 3 Follow-Up Reflection Questions */}
                  <div className="p-5 rounded-xl bg-[#0F0F12] border border-indigo-500/30 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Thoughtful Follow-Up Reflection Questions</span>
                      </h4>
                      <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                        Deepen your introspections. Click any question to begin a new journal entry seeded with it.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      {currentInsight.followUpQuestions.map((question, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg bg-[#141417] border border-[#27272A] hover:border-indigo-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-xs text-[#E4E4E7] font-medium leading-relaxed">
                              {question}
                            </p>
                          </div>

                          {onUseQuestionAsPrompt && (
                            <button
                              type="button"
                              onClick={() => onUseQuestionAsPrompt(question)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1E1E22] group-hover:bg-indigo-600 group-hover:text-white text-indigo-300 border border-[#27272A] group-hover:border-indigo-500 text-[11px] font-semibold transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                            >
                              <span>Reflect on This</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* MODE 2: SAVED VAULT REFLECTIONS */}
      {activeMode === 'history' && (
        <div className="space-y-4">
          
          {isHistoryLoading ? (
            <div className="p-8 text-center text-xs text-[#A1A1AA]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
              <span>Accessing isolated Firestore reflection archives...</span>
            </div>
          ) : savedReflections.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#141417] border border-dashed border-[#27272A] text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1E1E22] flex items-center justify-center text-[#71717A] mx-auto">
                <Bookmark className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Saved Reflections in Vault</h3>
              <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                Run an analysis in the AI Reflection Studio and click "Save to Vault" to archive structured psychological reports here.
              </p>
              <button
                type="button"
                onClick={() => setActiveMode('engine')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E1E22] hover:bg-[#27272A] text-white border border-[#27272A] text-xs font-semibold cursor-pointer"
              >
                <span>Go to Reflection Studio</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {savedReflections.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-[#A1A1AA] font-mono">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                        <span className="text-[#71717A]">•</span>
                        <span className="text-indigo-400">{item.modelUsed}</span>
                        <span className="text-[#71717A]">•</span>
                        <span>{item.entryIds?.length || 0} entries analyzed</span>
                      </div>
                      <h4 className="text-xs font-semibold text-white line-clamp-1 mt-1">
                        {item.reflectionSummary.slice(0, 100)}...
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingSavedInsight(item)}
                        className="px-2.5 py-1 rounded-lg bg-[#1E1E22] hover:bg-[#27272A] text-white border border-[#27272A] text-xs font-medium cursor-pointer"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(item.id)}
                        className="p-1.5 rounded-lg text-[#71717A] hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete from Vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Themes preview */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.keyThemes?.slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#0F0F12] border border-[#27272A] text-[10px] text-[#A1A1AA]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* MODE 3: VAULT METRICS & TRENDS (PRESERVED AESTHETIC INTEGRITY) */}
      {activeMode === 'trends' && (
        <div className="space-y-6">
          
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#141417] border border-[#27272A] space-y-1">
              <div className="flex items-center justify-between text-[#71717A]">
                <span className="text-xs font-semibold">Total Entries</span>
                <BookOpen className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{analytics.totalEntries}</p>
              <p className="text-[10px] text-[#71717A]">Archived in Firestore</p>
            </div>

            <div className="p-4 rounded-xl bg-[#141417] border border-[#27272A] space-y-1">
              <div className="flex items-center justify-between text-[#71717A]">
                <span className="text-xs font-semibold">Total Words</span>
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{analytics.totalWords.toLocaleString()}</p>
              <p className="text-[10px] text-[#71717A]">Written introspections</p>
            </div>

            <div className="p-4 rounded-xl bg-[#141417] border border-[#27272A] space-y-1">
              <div className="flex items-center justify-between text-[#71717A]">
                <span className="text-xs font-semibold">Avg Words/Entry</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{analytics.avgWords}</p>
              <p className="text-[10px] text-[#71717A]">Depth per reflection</p>
            </div>

            <div className="p-4 rounded-xl bg-[#141417] border border-[#27272A] space-y-1">
              <div className="flex items-center justify-between text-[#71717A]">
                <span className="text-xs font-semibold">Reflection Streak</span>
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">{analytics.streakDays} {analytics.streakDays === 1 ? 'day' : 'days'}</p>
              <p className="text-[10px] text-[#71717A]">Consistent habit</p>
            </div>
          </div>

          {/* Mood Distribution Card */}
          <div className="p-6 rounded-2xl bg-[#141417] border border-[#27272A] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Emotional State Spectrum</h3>
              </div>
              {analytics.mostFrequentMood && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#0F0F12] border border-[#27272A] text-[#E4E4E7]">
                  Dominant: {MOOD_EMOJIS[analytics.mostFrequentMood]} {analytics.mostFrequentMood}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {VALID_MOODS.map((m) => {
                const count = analytics.moodCounts[m] || 0;
                const percentage = analytics.totalEntries > 0 
                  ? Math.round((count / analytics.totalEntries) * 100) 
                  : 0;

                return (
                  <div key={m} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#E4E4E7]">
                      <span className="flex items-center gap-1.5 capitalize">
                        <span>{MOOD_EMOJIS[m]}</span>
                        <span>{m}</span>
                      </span>
                      <span className="font-mono text-[#71717A] text-[11px]">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#0F0F12] overflow-hidden">
                      <div
                        className={`h-full ${MOOD_COLORS[m]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recurring Tags & Themes */}
          <div className="p-6 rounded-2xl bg-[#141417] border border-[#27272A] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#27272A]">
              <TagIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">
                Recurring Reflection Themes & Focus Areas
              </h3>
            </div>

            {analytics.topTags.length === 0 ? (
              <p className="text-xs text-[#71717A] italic">
                Add tags to your journal entries (e.g. #growth, #work, #gratitude) to reveal thematic clusters over time.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analytics.topTags.map((item) => (
                  <div
                    key={item.tag}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F0F12] border border-[#27272A] text-xs"
                  >
                    <span className="font-mono text-[#E4E4E7]">#{item.tag}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* DETAIL MODAL FOR SAVED REFLECTIONS */}
      {viewingSavedInsight && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0B]/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#27272A] flex items-center justify-between bg-[#141417]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Archived Cognitive Reflection</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSavedInsight(null)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#E4E4E7]">
              <div className="flex items-center gap-3 text-[11px] text-[#A1A1AA] font-mono">
                <span>Date: {new Date(viewingSavedInsight.createdAt).toLocaleString()}</span>
                <span>•</span>
                <span className="text-indigo-300">{viewingSavedInsight.modelUsed}</span>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1 uppercase tracking-wider text-[10px] text-indigo-400">Summary</h4>
                <p className="leading-relaxed bg-[#0F0F12] p-3 rounded-lg border border-[#27272A] whitespace-pre-line">
                  {viewingSavedInsight.reflectionSummary}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1.5 uppercase tracking-wider text-[10px] text-indigo-400">Key Themes</h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingSavedInsight.keyThemes.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-[#0F0F12] border border-[#27272A] text-white font-mono text-[11px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1.5 uppercase tracking-wider text-[10px] text-purple-400">Emotional Patterns</h4>
                <ul className="space-y-1">
                  {viewingSavedInsight.emotionalPatterns.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-[#0F0F12] border border-emerald-500/20">
                  <h5 className="font-bold text-emerald-400 mb-1">Progress</h5>
                  <ul className="space-y-1">
                    {viewingSavedInsight.positiveProgress.map((pr, idx) => (
                      <li key={idx}>• {pr}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-[#0F0F12] border border-amber-500/20">
                  <h5 className="font-bold text-amber-400 mb-1">Recurring Challenges</h5>
                  <ul className="space-y-1">
                    {viewingSavedInsight.recurringChallenges.map((rc, idx) => (
                      <li key={idx}>• {rc}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2 uppercase tracking-wider text-[10px] text-indigo-400">Follow-Up Reflection Questions</h4>
                <div className="space-y-2">
                  {viewingSavedInsight.followUpQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#0F0F12] border border-[#27272A] flex items-center justify-between gap-3">
                      <span>{idx + 1}. {q}</span>
                      {onUseQuestionAsPrompt && (
                        <button
                          type="button"
                          onClick={() => {
                            onUseQuestionAsPrompt(q);
                            setViewingSavedInsight(null);
                          }}
                          className="px-2 py-1 rounded bg-[#1E1E22] hover:bg-indigo-600 text-indigo-300 hover:text-white border border-[#27272A] text-[11px] font-semibold shrink-0 cursor-pointer"
                        >
                          Journal
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#27272A] bg-[#141417] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDownloadMarkdown(viewingSavedInsight)}
                className="px-3 py-1.5 rounded-lg bg-[#1E1E22] hover:bg-[#27272A] text-white border border-[#27272A] text-xs cursor-pointer"
              >
                Download Markdown
              </button>
              <button
                type="button"
                onClick={() => setViewingSavedInsight(null)}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
