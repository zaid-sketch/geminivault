import { useState, useMemo, type FormEvent } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Eye, 
  Pin, 
  Bookmark, 
  LayoutGrid, 
  List, 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  Sparkles,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import type { JournalEntry, MoodType, JournalEntryInput } from '../types';
import { VALID_MOODS } from '../services/journalService';

interface JournalHistoryViewProps {
  entries: JournalEntry[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onNavigateToNew: () => void;
  onUpdateEntry: (entryId: string, updates: Partial<JournalEntryInput>) => Promise<boolean>;
  onDeleteEntry: (entryId: string) => Promise<boolean>;
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

export function JournalHistoryView({
  entries,
  isLoading,
  error,
  onRetry,
  onNavigateToNew,
  onUpdateEntry,
  onDeleteEntry,
}: JournalHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterPinned, setFilterPinned] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'wordCount'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<JournalEntry | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<MoodType>('reflective');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesContent = entry.content.toLowerCase().includes(q);
        const matchesTags = entry.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }

      // Mood filter
      if (selectedMoodFilter !== 'all' && entry.mood !== selectedMoodFilter) {
        return false;
      }

      // Favorite filter
      if (filterFavorites && !entry.favorite) {
        return false;
      }

      // Pinned filter
      if (filterPinned && !entry.pinned) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Always prioritize pinned entries first unless sorting by something else explicitly
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      if (sortBy === 'oldest') {
        return a.createdAt - b.createdAt;
      }
      if (sortBy === 'wordCount') {
        return (b.wordCount || 0) - (a.wordCount || 0);
      }
      return b.createdAt - a.createdAt;
    });
  }, [entries, searchQuery, selectedMoodFilter, filterFavorites, filterPinned, sortBy]);

  const handleOpenEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditMood(entry.mood || 'reflective');
    setEditTags(entry.tags || []);
    setActionError(null);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    if (!editTitle.trim()) {
      setActionError('Title cannot be empty');
      return;
    }
    if (!editContent.trim()) {
      setActionError('Content cannot be empty');
      return;
    }

    setIsUpdating(true);
    setActionError(null);
    try {
      const ok = await onUpdateEntry(editingEntry.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        mood: editMood,
        tags: editTags,
      });

      if (ok) {
        setEditingEntry(null);
      } else {
        setActionError('Failed to update journal in Firestore. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating entry';
      setActionError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEntry) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const ok = await onDeleteEntry(deletingEntry.id);
      if (ok) {
        if (viewingEntry?.id === deletingEntry.id) {
          setViewingEntry(null);
        }
        setDeletingEntry(null);
      } else {
        setActionError('Failed to delete entry from Firestore.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting entry';
      setActionError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#27272A] min-w-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
            <span>Journal History</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#1E1E22] text-indigo-400 border border-[#27272A]">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5 break-words">
            Real-time synchronization with your owner-isolated Cloud Firestore database.
          </p>
        </div>

        {/* Quick Action to Write */}
        <button
          id="history-write-new-btn"
          type="button"
          onClick={onNavigateToNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs transition-colors self-start md:self-auto cursor-pointer shadow-sm shadow-indigo-950/40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#141417] border border-[#27272A] space-y-3 max-w-full min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 min-w-0">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-0 w-full">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="history-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, titles, or #tags..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-[#0F0F12] border border-[#27272A] text-white placeholder:text-[#71717A] focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mood Filter Dropdown */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full lg:w-auto min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] shrink-0">
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span>Mood:</span>
            </div>
            <select
              id="mood-filter-select"
              value={selectedMoodFilter}
              onChange={(e) => setSelectedMoodFilter(e.target.value)}
              className="flex-1 sm:flex-initial text-xs px-2.5 py-2 rounded-lg bg-[#0F0F12] border border-[#27272A] text-[#E4E4E7] focus:outline-none focus:border-indigo-500 cursor-pointer min-w-0"
            >
              <option value="all">All States of Mind</option>
              {VALID_MOODS.map(m => (
                <option key={m} value={m}>
                  {MOOD_EMOJIS[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <select
              id="history-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'wordCount')}
              className="flex-1 sm:flex-initial text-xs px-2.5 py-2 rounded-lg bg-[#0F0F12] border border-[#27272A] text-[#E4E4E7] focus:outline-none focus:border-indigo-500 cursor-pointer min-w-0"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="wordCount">Most Words</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-[#0F0F12] p-1 rounded-lg border border-[#27272A] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded cursor-pointer ${viewMode === 'grid' ? 'bg-[#1E1E22] text-white' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1 rounded cursor-pointer ${viewMode === 'list' ? 'bg-[#1E1E22] text-white' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Attribute Toggles */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#27272A] text-xs flex-wrap">
          <button
            type="button"
            onClick={() => setFilterPinned(!filterPinned)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              filterPinned 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            <Pin className="w-3 h-3" />
            <span>Pinned Only</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              filterFavorites 
                ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60' 
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            <span>Favorites Only</span>
          </button>

          {(selectedMoodFilter !== 'all' || searchQuery || filterFavorites || filterPinned) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedMoodFilter('all');
                setFilterFavorites(false);
                setFilterPinned(false);
              }}
              className="text-[11px] text-[#71717A] hover:text-indigo-400 ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div id="journal-history-loading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-xl bg-[#141417] border border-[#27272A] space-y-3 animate-pulse">
              <div className="h-4 bg-[#1E1E22] rounded w-3/4" />
              <div className="h-3 bg-[#1E1E22]/60 rounded w-1/2" />
              <div className="space-y-1.5 pt-2">
                <div className="h-3 bg-[#1E1E22]/40 rounded w-full" />
                <div className="h-3 bg-[#1E1E22]/40 rounded w-5/6" />
                <div className="h-3 bg-[#1E1E22]/40 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div id="journal-history-error" className="p-6 rounded-xl bg-rose-950/40 border border-rose-800 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-base font-semibold text-rose-100">Unable to load journal entries</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">{error.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-xs font-semibold text-rose-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredEntries.length === 0 && (
        <div id="journal-history-empty" className="p-12 rounded-2xl bg-[#141417] border border-dashed border-[#27272A] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1E1E22] border border-[#27272A] flex items-center justify-center text-indigo-400 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              {entries.length === 0 ? 'Your Vault is Ready for Its First Entry' : 'No entries match your search'}
            </h3>
            <p className="text-xs text-[#A1A1AA] max-w-md mx-auto mt-1">
              {entries.length === 0
                ? 'Begin your journaling practice. All entries are encrypted and isolated in your private Cloud Firestore partition.'
                : 'Try adjusting your keywords or clearing the active filters to see all reflections.'}
            </p>
          </div>
          {entries.length === 0 ? (
            <button
              id="empty-state-create-btn"
              type="button"
              onClick={onNavigateToNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-indigo-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Write First Journal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedMoodFilter('all');
                setFilterFavorites(false);
                setFilterPinned(false);
              }}
              className="text-xs text-indigo-400 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && !error && filteredEntries.length > 0 && viewMode === 'grid' && (
        <div id="journal-history-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              id={`journal-card-${entry.id}`}
              className="flex flex-col p-5 rounded-xl bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] transition-all group relative min-w-0 overflow-hidden"
            >
              {/* Card Top Row: Mood & Pin/Favorite */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-[#0F0F12] border border-[#27272A] text-[#E4E4E7]">
                  <span>{MOOD_EMOJIS[entry.mood] || '🌙'}</span>
                  <span className="capitalize text-[11px] font-medium">{entry.mood}</span>
                </span>

                <div className="flex items-center gap-1 text-[#71717A]">
                  {entry.pinned && (
                    <span title="Pinned Entry" className="text-indigo-400 p-1">
                      <Pin className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {entry.favorite && (
                    <span title="Favorited Entry" className="text-rose-400 p-1">
                      <Bookmark className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 
                onClick={() => setViewingEntry(entry)}
                className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 cursor-pointer break-words"
              >
                {entry.title}
              </h3>

              {/* Timestamp & Reading Time */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#71717A] mt-1 mb-2.5 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0" /> {formatDate(entry.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" /> {entry.wordCount} words
                </span>
              </div>

              {/* Content Excerpt */}
              <p 
                onClick={() => setViewingEntry(entry)}
                className="text-xs text-[#A1A1AA] leading-relaxed line-clamp-3 mb-4 flex-1 cursor-pointer break-words"
              >
                {entry.content}
              </p>

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4 max-w-full">
                  {entry.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0F0F12] text-[#71717A] border border-[#27272A] truncate max-w-[120px]"
                    >
                      #{tag}
                    </span>
                  ))}
                  {entry.tags.length > 3 && (
                    <span className="text-[10px] text-[#71717A] self-center">
                      +{entry.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#27272A] text-xs">
                <button
                  type="button"
                  onClick={() => setViewingEntry(entry)}
                  className="inline-flex items-center gap-1 text-[#71717A] hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Read</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(entry)}
                    className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-[#1E1E22] transition-colors cursor-pointer"
                    title="Edit entry"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingEntry(entry)}
                    className="p-1.5 rounded-lg text-[#71717A] hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && !error && filteredEntries.length > 0 && viewMode === 'list' && (
        <div id="journal-history-list" className="space-y-2 min-w-0">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] transition-colors group gap-3 min-w-0"
            >
              <div 
                onClick={() => setViewingEntry(entry)}
                className="flex-1 min-w-0 sm:pr-4 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{MOOD_EMOJIS[entry.mood]}</span>
                  <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 truncate">
                    {entry.title}
                  </h4>
                  {entry.pinned && <Pin className="w-3 h-3 text-indigo-400 shrink-0" />}
                  {entry.favorite && <Bookmark className="w-3 h-3 text-rose-400 shrink-0" />}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#71717A] font-mono">
                  <span>{formatDate(entry.createdAt)}</span>
                  <span>•</span>
                  <span>{entry.wordCount} words</span>
                  {entry.tags && entry.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">#{entry.tags.join(' #')}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingEntry(entry)}
                  className="p-2 text-[#71717A] hover:text-indigo-400 cursor-pointer"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(entry)}
                  className="p-2 text-[#71717A] hover:text-white cursor-pointer"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingEntry(entry)}
                  className="p-2 text-[#71717A] hover:text-rose-400 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL ENTRY VIEW MODAL */}
      {viewingEntry && (
        <div 
          id="entry-view-modal"
          className="fixed inset-0 z-50 bg-[#0A0A0B]/85 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-2xl w-full max-h-[85vh] bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col overflow-hidden min-w-0">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#141417]">
              <div className="flex items-center gap-2">
                <span className="text-lg">{MOOD_EMOJIS[viewingEntry.mood]}</span>
                <span className="text-xs uppercase font-mono tracking-wider text-indigo-400">
                  {viewingEntry.mood}
                </span>
                {viewingEntry.pinned && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    Pinned
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewingEntry(null)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white hover:bg-[#1E1E22] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-white break-words">{viewingEntry.title}</h2>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#71717A] font-mono border-b border-[#27272A] pb-3">
                <span>{formatDate(viewingEntry.createdAt)}</span>
                <span>{viewingEntry.wordCount} words</span>
                <span>~{viewingEntry.readingTimeMinutes || 1} min read</span>
              </div>

              {viewingEntry.aiPromptUsed && (
                <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 break-words">
                  <strong className="block text-indigo-400 mb-0.5">Reflection Prompt Used:</strong>
                  "{viewingEntry.aiPromptUsed}"
                </div>
              )}

              <div className="text-[#E4E4E7] text-sm leading-relaxed whitespace-pre-wrap font-serif break-words">
                {viewingEntry.content}
              </div>

              {viewingEntry.tags && viewingEntry.tags.length > 0 && (
                <div className="pt-4 border-t border-[#27272A] flex flex-wrap gap-1.5">
                  {viewingEntry.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#0F0F12] text-[#A1A1AA] border border-[#27272A]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#27272A] bg-[#0F0F12] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <span className="text-[#71717A] font-mono text-[11px] truncate max-w-full">
                ID: {viewingEntry.id}
              </span>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(viewingEntry);
                    setViewingEntry(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1E1E22] hover:bg-[#27272A] text-white border border-[#27272A] transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeletingEntry(viewingEntry);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* EDIT ENTRY MODAL */}
      {editingEntry && (
        <div 
          id="entry-edit-modal"
          className="fixed inset-0 z-50 bg-[#0A0A0B]/85 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-2xl w-full max-h-[90vh] bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Edit Journal Entry</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {actionError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                  {actionError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A1A1AA] uppercase">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={150}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#0F0F12] border border-[#27272A] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A1A1AA] uppercase">Mood</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {VALID_MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditMood(m)}
                      className={`p-2 rounded-lg border text-xs text-center cursor-pointer transition-colors ${
                        editMood === m
                          ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-sm'
                          : 'bg-[#0F0F12] border-[#27272A] text-[#71717A] hover:text-white'
                      }`}
                    >
                      {MOOD_EMOJIS[m]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A1A1AA] uppercase">Content</label>
                <textarea
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#0F0F12] border border-[#27272A] text-white focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A1A1AA] uppercase">Tags</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {editTags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded bg-[#1E1E22] text-[#E4E4E7] border border-[#27272A] flex items-center gap-1"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => setEditTags(editTags.filter(tag => tag !== t))}
                        className="text-[#71717A] hover:text-rose-400 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const clean = newTagInput.trim().toLowerCase().replace(/^#/, '');
                      if (clean && !editTags.includes(clean)) {
                        setEditTags([...editTags, clean]);
                        setNewTagInput('');
                      }
                    }
                  }}
                  placeholder="+ Add tag (press Enter)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#0F0F12] border border-[#27272A] text-white placeholder:text-[#71717A] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-[#27272A] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#71717A] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer shadow-sm shadow-indigo-950/40"
                >
                  {isUpdating ? 'Saving Updates...' : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingEntry && (
        <div 
          id="entry-delete-modal"
          className="fixed inset-0 z-50 bg-[#0A0A0B]/85 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md w-full bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Permanently Delete Entry?</h3>
              <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                This action will delete "<strong>{deletingEntry.title}</strong>" from your private Cloud Firestore partition. This action cannot be reversed.
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEntry(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#71717A] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
