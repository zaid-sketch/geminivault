import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  type Unsubscribe 
} from 'firebase/firestore';
import { db, sanitizePayload } from '../lib/firebase';
import type { JournalEntry, JournalEntryInput, MoodType } from '../types';

export const VALID_MOODS: MoodType[] = [
  'peaceful',
  'energized',
  'reflective',
  'grateful',
  'focused',
  'anxious',
  'tired',
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateJournalInput(input: Partial<JournalEntryInput>): ValidationResult {
  if (!input.title || input.title.trim().length === 0) {
    return { isValid: false, error: 'Journal title cannot be empty.' };
  }
  if (input.title.trim().length > 150) {
    return { isValid: false, error: 'Journal title cannot exceed 150 characters.' };
  }
  if (!input.content || input.content.trim().length === 0) {
    return { isValid: false, error: 'Journal content cannot be empty.' };
  }
  if (input.content.length > 50000) {
    return { isValid: false, error: 'Journal content exceeds the 50,000 character limit.' };
  }
  if (input.mood && !VALID_MOODS.includes(input.mood)) {
    return { isValid: false, error: 'Selected mood is not valid.' };
  }
  if (input.tags && input.tags.length > 10) {
    return { isValid: false, error: 'Maximum 10 tags allowed per journal entry.' };
  }
  return { isValid: true };
}

export function calculateReadingMetrics(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readingTimeMinutes };
}

/**
 * Creates a new user-isolated journal entry in Cloud Firestore.
 * Strictly adheres to Zero-Crash Payload Hygiene and user UID isolation.
 */
export async function createJournalEntry(
  userId: string,
  input: JournalEntryInput
): Promise<{ success: boolean; entryId?: string; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User is unauthenticated. Cannot create entry.' };
  }

  const validation = validateJournalInput(input);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  try {
    const entriesCollection = collection(db, 'users', userId, 'entries');
    const newEntryRef = doc(entriesCollection);
    const metrics = calculateReadingMetrics(input.content);

    const now = Date.now();
    const entryData: JournalEntry = {
      id: newEntryRef.id,
      userId,
      title: input.title.trim(),
      content: input.content.trim(),
      mood: input.mood || 'reflective',
      tags: Array.isArray(input.tags) 
        ? input.tags.map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean).slice(0, 10)
        : [],
      favorite: Boolean(input.favorite),
      pinned: Boolean(input.pinned),
      wordCount: metrics.wordCount,
      readingTimeMinutes: metrics.readingTimeMinutes,
      aiPromptUsed: input.aiPromptUsed?.trim() || '',
      reflections: input.reflections || [],
      createdAt: now,
      updatedAt: now,
    };

    const cleanPayload = sanitizePayload(entryData);
    await setDoc(newEntryRef, cleanPayload);

    return { success: true, entryId: newEntryRef.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save journal entry to Firestore';
    console.error('[GeminiVault] Firestore write rejection:', err);
    return { success: false, error: message };
  }
}

/**
 * Updates an existing user-isolated journal entry.
 */
export async function updateJournalEntry(
  userId: string,
  entryId: string,
  updates: Partial<JournalEntryInput>
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !entryId) {
    return { success: false, error: 'Missing user ID or entry ID.' };
  }

  if (updates.title !== undefined || updates.content !== undefined) {
    const validation = validateJournalInput({
      title: updates.title ?? 'Existing Title',
      content: updates.content ?? 'Existing Content',
      mood: updates.mood,
      tags: updates.tags,
    });
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }
  }

  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);
    const updatePayload: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (updates.title !== undefined) updatePayload.title = updates.title.trim();
    if (updates.content !== undefined) {
      updatePayload.content = updates.content.trim();
      const metrics = calculateReadingMetrics(updates.content);
      updatePayload.wordCount = metrics.wordCount;
      updatePayload.readingTimeMinutes = metrics.readingTimeMinutes;
    }
    if (updates.mood !== undefined) updatePayload.mood = updates.mood;
    if (updates.favorite !== undefined) updatePayload.favorite = updates.favorite;
    if (updates.pinned !== undefined) updatePayload.pinned = updates.pinned;
    if (updates.tags !== undefined) {
      updatePayload.tags = updates.tags
        .map(t => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean)
        .slice(0, 10);
    }
    if (updates.reflections !== undefined) updatePayload.reflections = updates.reflections;

    const cleanPayload = sanitizePayload(updatePayload);
    await updateDoc(entryRef, cleanPayload);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update journal entry';
    console.error('[GeminiVault] Firestore update error:', err);
    return { success: false, error: message };
  }
}

/**
 * Deletes a journal entry belonging to the authenticated user.
 */
export async function deleteJournalEntry(
  userId: string,
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !entryId) {
    return { success: false, error: 'Missing user ID or entry ID.' };
  }

  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(entryRef);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete journal entry';
    console.error('[GeminiVault] Firestore delete error:', err);
    return { success: false, error: message };
  }
}

/**
 * Real-time subscription to user's isolated journal entries.
 * Orders documents by creation timestamp descending.
 */
export function subscribeToUserEntries(
  userId: string,
  onEntries: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onEntries([]);
    return () => {};
  }

  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as JournalEntry);
      });
      onEntries(entries);
    },
    (err) => {
      console.error('[GeminiVault] Snapshot listener error:', err);
      onError(err);
    }
  );
}
