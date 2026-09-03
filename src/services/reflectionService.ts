import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  type Unsubscribe 
} from 'firebase/firestore';
import { db, auth, sanitizePayload } from '../lib/firebase';
import type { JournalEntry, ReflectionInsight, ReflectionGenerationPayload } from '../types';

export interface GenerateReflectionOptions {
  userId: string;
  entries: JournalEntry[];
}

export interface GenerateReflectionResponse {
  success: boolean;
  insights?: ReflectionGenerationPayload;
  error?: string;
}

/**
 * Invokes the secure server-side Gemini Reflection endpoint.
 * Attaches the authenticated user's Firebase ID token for authorization.
 */
export async function generateReflectionWithGemini(
  userId: string,
  selectedEntries: JournalEntry[]
): Promise<GenerateReflectionResponse> {
  if (!userId) {
    return { success: false, error: 'User is not authenticated.' };
  }

  if (!selectedEntries || selectedEntries.length === 0) {
    return { success: false, error: 'Please select at least one journal entry for analysis.' };
  }

  try {
    // Obtain active Firebase ID token for authorization header
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'Active authentication session not found. Please sign in.' };
    }

    const idToken = await currentUser.getIdToken();

    // Map minimal entry payload (defensive parameterization)
    const sanitizedEntries = selectedEntries.map((e) => ({
      id: e.id,
      title: e.title.slice(0, 150),
      content: e.content.slice(0, 25000),
      mood: e.mood,
      tags: e.tags || [],
      createdAt: e.createdAt,
    }));

    const response = await fetch('/api/reflections/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        userId,
        entries: sanitizedEntries,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || `Server responded with status ${response.status}: Failed to generate insights.` 
      };
    }

    if (!data.success || !data.insights) {
      return { 
        success: false, 
        error: data.error || 'Server returned invalid reflection data structure.' 
      };
    }

    return {
      success: true,
      insights: data.insights,
    };
  } catch (err: unknown) {
    console.error('[GeminiVault] Reflection generation network error:', err);
    const message = err instanceof Error ? err.message : 'Network error communicating with AI reflection service.';
    return { success: false, error: message };
  }
}

/**
 * Persists an AI Reflection Insight into the user's isolated Firestore subcollection.
 * Strict zero-crash payload sanitation applied.
 */
export async function saveReflectionInsight(
  userId: string,
  insight: Omit<ReflectionInsight, 'id'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!userId) {
    return { success: false, error: 'Missing authenticated user ID.' };
  }

  try {
    const reflectionsCol = collection(db, 'users', userId, 'reflections');
    const newDocRef = doc(reflectionsCol);

    const record: ReflectionInsight = {
      id: newDocRef.id,
      userId,
      entryIds: insight.entryIds || [],
      entryTitles: insight.entryTitles || [],
      keyThemes: insight.keyThemes || [],
      emotionalPatterns: insight.emotionalPatterns || [],
      positiveProgress: insight.positiveProgress || [],
      recurringChallenges: insight.recurringChallenges || [],
      reflectionSummary: insight.reflectionSummary || '',
      followUpQuestions: insight.followUpQuestions || [],
      modelUsed: insight.modelUsed || 'gemini-3.6-flash',
      createdAt: insight.createdAt || Date.now(),
    };

    const cleanPayload = sanitizePayload(record);
    await setDoc(newDocRef, cleanPayload);

    return { success: true, id: newDocRef.id };
  } catch (err: unknown) {
    console.error('[GeminiVault] Firestore write rejection on reflections:', err);
    const message = err instanceof Error ? err.message : 'Failed to save reflection to Firestore.';
    return { success: false, error: message };
  }
}

/**
 * Subscribes in real-time to the authenticated user's saved reflection insights.
 */
export function subscribeToUserReflections(
  userId: string,
  onReflections: (reflections: ReflectionInsight[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onReflections([]);
    return () => {};
  }

  const reflectionsRef = collection(db, 'users', userId, 'reflections');
  const q = query(reflectionsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ReflectionInsight[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ReflectionInsight);
      });
      onReflections(items);
    },
    (err) => {
      console.error('[GeminiVault] Reflection subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Deletes a reflection insight belonging to the authenticated user.
 */
export async function deleteReflectionInsight(
  userId: string,
  reflectionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !reflectionId) {
    return { success: false, error: 'Missing user ID or reflection ID.' };
  }

  try {
    const docRef = doc(db, 'users', userId, 'reflections', reflectionId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: unknown) {
    console.error('[GeminiVault] Failed to delete reflection:', err);
    const message = err instanceof Error ? err.message : 'Failed to remove reflection.';
    return { success: false, error: message };
  }
}
