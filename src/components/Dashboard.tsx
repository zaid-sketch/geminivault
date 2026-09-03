import { useState, useEffect } from 'react';
import { 
  Navbar 
} from './Navbar';
import { 
  NewJournalView 
} from './NewJournalView';
import { 
  JournalHistoryView 
} from './JournalHistoryView';
import { 
  AIAssistantView 
} from './AIAssistantView';
import { 
  ReflectionInsightsView 
} from './ReflectionInsightsView';
import { 
  UserProfileModal 
} from './UserProfileModal';
import { 
  ToastContainer 
} from './Toast';
import { 
  subscribeToUserEntries, 
  createJournalEntry, 
  updateJournalEntry, 
  deleteJournalEntry 
} from '../services/journalService';
import type { 
  UserProfile, 
  DashboardTab, 
  JournalEntry, 
  JournalEntryInput, 
  ToastMessage 
} from '../types';

interface DashboardProps {
  user: UserProfile;
  onSignOut: () => void;
}

export function Dashboard({ user, onSignOut }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('history');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<Error | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [transferredPrompt, setTransferredPrompt] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string, details?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, type, message, details };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time Firestore entries subscription
  useEffect(() => {
    if (!user.uid) return;

    setIsLoading(true);
    setDataError(null);

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setIsLoading(false);
      },
      (err) => {
        setDataError(err);
        setIsLoading(false);
        addToast('error', 'Database Connection Alert', err.message);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user.uid]);

  // Handle creating a new entry
  const handleCreateEntry = async (entryInput: JournalEntryInput): Promise<boolean> => {
    const result = await createJournalEntry(user.uid, entryInput);
    if (result.success) {
      addToast('success', 'Journal Entry Encrypted & Saved', 'Stored in your isolated Firestore partition.');
      setTransferredPrompt('');
      return true;
    } else {
      addToast('error', 'Save Operation Failed', result.error);
      return false;
    }
  };

  // Handle updating an existing entry
  const handleUpdateEntry = async (
    entryId: string, 
    updates: Partial<JournalEntryInput>
  ): Promise<boolean> => {
    const result = await updateJournalEntry(user.uid, entryId, updates);
    if (result.success) {
      addToast('success', 'Entry Updated Successfully');
      return true;
    } else {
      addToast('error', 'Update Failed', result.error);
      return false;
    }
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (entryId: string): Promise<boolean> => {
    const result = await deleteJournalEntry(user.uid, entryId);
    if (result.success) {
      addToast('success', 'Journal Entry Removed');
      return true;
    } else {
      addToast('error', 'Delete Failed', result.error);
      return false;
    }
  };

  // Transfer prompt from AI Assistant to New Journal
  const handleUsePrompt = (prompt: string) => {
    setTransferredPrompt(prompt);
    setActiveTab('new');
    addToast('info', 'Reflection Prompt Loaded', 'Ready to compose in your journal.');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] flex flex-col selection:bg-indigo-500 selection:text-white max-w-full overflow-x-hidden">
      
      {/* Navigation Header */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSignOut={onSignOut}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
        {activeTab === 'new' && (
          <NewJournalView
            userId={user.uid}
            initialPrompt={transferredPrompt}
            onSaveEntry={handleCreateEntry}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'history' && (
          <JournalHistoryView
            entries={entries}
            isLoading={isLoading}
            error={dataError}
            onRetry={() => {
              setIsLoading(true);
              setDataError(null);
            }}
            onNavigateToNew={() => setActiveTab('new')}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        )}

        {activeTab === 'ai-assistant' && (
          <AIAssistantView
            onUsePromptInNewJournal={handleUsePrompt}
          />
        )}

        {activeTab === 'insights' && (
          <ReflectionInsightsView
            userId={user.uid}
            entries={entries}
            onNavigateToNew={() => setActiveTab('new')}
            onUseQuestionAsPrompt={handleUsePrompt}
            onShowToast={addToast}
          />
        )}
      </main>

      {/* Account & Security Audit Modal */}
      <UserProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSignOut={onSignOut}
      />

      {/* Global Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />

    </div>
  );
}
