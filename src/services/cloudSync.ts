import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  getDoc, 
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { db } from '../db';
import { getSettings, saveSettings } from '../utils/settings';

const SYNC_COLLECTIONS = [
  'habits',
  'habitLogs',
  'hourLogs',
  'hourCategories',
  'goals',
  'goalMeasurements',
  'exercises',
  'exerciseLogs',
  'dayEntries',
  'tasks'
] as const;

export type SyncCollectionName = typeof SYNC_COLLECTIONS[number];

const ACTIVE_UID_KEY = 'dt_active_uid';
let isUploadInProgress = false;
let lastUploadTimestamp = 0;
const UPLOAD_COOLDOWN_MS = 6000;

/**
 * Uploads all current local Dexie tables and settings to the user's Firestore cloud storage.
 */
export async function uploadLocalToCloud(userId: string, force = false): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized: Active authenticated session does not match the target user ID.');
  }

  if (isUploadInProgress) {
    return;
  }

  const now = Date.now();
  if (!force && (now - lastUploadTimestamp < UPLOAD_COOLDOWN_MS)) {
    return;
  }

  isUploadInProgress = true;

  try {
    const userRef = doc(firestore, 'users', userId);

    // 1. Upload settings & rest day config
    const settings = getSettings();
    const restDaysConfig = localStorage.getItem('rest_days_config_v1');
    const cleanSettings = settings ? JSON.parse(JSON.stringify(settings)) : {};
    const cleanRestDays = restDaysConfig ? JSON.parse(restDaysConfig) : null;
    
    await setDoc(doc(userRef, 'profile', 'settings'), {
      settings: cleanSettings,
      restDaysConfig: cleanRestDays,
      updatedAt: new Date().toISOString()
    });

    // 2. Upload collections in batches (max 500 per batch in Firestore)
    for (const colName of SYNC_COLLECTIONS) {
      const table = (db as any)[colName];
      if (!table) continue;

      const items = await table.toArray();
      if (items.length === 0) continue;

      // Split into batches of 400
      const chunkSize = 400;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);

        for (const item of chunk) {
          const rawId = (item as any).id ?? (item as any).date;
          const docId = rawId ? String(rawId) : Math.random().toString(36).substring(2, 9);
          const docRef = doc(collection(userRef, colName), docId);
          const cleanItem = JSON.parse(JSON.stringify(item));
          batch.set(docRef, cleanItem, { merge: true });
        }

        await batch.commit();

        // Pacing delay between large batch chunks to prevent resource exhaustion
        if (i + chunkSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }

    // Set meta doc indicating data exists
    await setDoc(doc(userRef, 'meta', 'sync'), {
      lastSyncedAt: serverTimestamp(),
      initialized: true
    });

    lastUploadTimestamp = Date.now();
  } finally {
    isUploadInProgress = false;
  }
}

/**
 * Downloads all data from the user's Firestore cloud storage into local Dexie.
 */
export async function downloadCloudToLocal(userId: string, strategy: 'merge' | 'overwrite' = 'merge'): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized: Active authenticated session does not match the target user ID.');
  }

  const userRef = doc(firestore, 'users', userId);
  const metaSnap = await getDoc(doc(userRef, 'meta', 'sync'));

  if (!metaSnap.exists()) {
    return false; // Cloud account has no data yet
  }

  // 1. Restore settings
  try {
    const settingsSnap = await getDoc(doc(userRef, 'profile', 'settings'));
    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      if (data.settings) {
        saveSettings(data.settings);
      }
      if (data.restDaysConfig) {
        localStorage.setItem('rest_days_config_v1', JSON.stringify(data.restDaysConfig));
      }
    }
  } catch (err) {
    console.error('Failed to sync settings:', err);
  }

  // 2. Restore collections
  for (const colName of SYNC_COLLECTIONS) {
    const table = (db as any)[colName];
    if (!table) continue;

    const colRef = collection(userRef, colName);
    const snapshot = await getDocs(colRef);

    const cloudItems: any[] = [];
    snapshot.forEach(docSnap => {
      cloudItems.push(docSnap.data());
    });

    if (strategy === 'overwrite') {
      await table.clear();
      if (cloudItems.length > 0) {
        await table.bulkAdd(cloudItems);
      }
    } else {
      // Non-destructive merge: preserve local records while integrating cloud history
      for (const item of cloudItems) {
        await table.put(item);
      }
    }
  }

  return true;
}

/**
 * Initializes synchronization when a user logs in.
 * If cloud is empty, it backs up local data to cloud.
 * If cloud has data, it merges cloud data with local records non-destructively and backs up the combined set.
 */
export async function handleUserLoginSync(userId: string): Promise<'uploaded_local' | 'merged_cloud'> {
  const previousUserId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_UID_KEY) : null;
  // Account switch isolation: If a different authenticated user owned local storage previously on this device,
  // wipe the previous user's local tables before loading the current user's dataset to avoid cross-tenant data bleed
  if (previousUserId && previousUserId !== userId) {
    await clearLocalDataOnSignOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTIVE_UID_KEY, userId);
  }

  const userRef = doc(firestore, 'users', userId);
  const metaSnap = await getDoc(doc(userRef, 'meta', 'sync'));

  if (!metaSnap.exists()) {
    // Cloud is empty for this user: back up local to cloud
    await uploadLocalToCloud(userId, true);
    return 'uploaded_local';
  } else {
    // Cloud has data: merge non-destructively and update cloud with unified dataset
    await downloadCloudToLocal(userId, 'merge');
    await uploadLocalToCloud(userId, true);
    return 'merged_cloud';
  }
}

/**
 * Wipes local database when signing out so the next user starts fresh.
 */
export async function clearLocalDataOnSignOut(): Promise<void> {
  for (const colName of SYNC_COLLECTIONS) {
    const table = (db as any)[colName];
    if (table) {
      await table.clear();
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACTIVE_UID_KEY);
  }
}

/**
 * Deletes all documents in the specified Firestore collections for a given user.
 */
export async function wipeCloudCollectionsForUser(
  userId: string,
  collections: readonly SyncCollectionName[] = SYNC_COLLECTIONS
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized: Active authenticated session does not match the target user ID.');
  }

  const userRef = doc(firestore, 'users', userId);

  for (const colName of collections) {
    const colRef = collection(userRef, colName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) continue;

    const chunkSize = 400;
    const docSnaps = snapshot.docs;
    for (let i = 0; i < docSnaps.length; i += chunkSize) {
      const chunk = docSnaps.slice(i, i + chunkSize);
      const batch = writeBatch(firestore);
      for (const docSnap of chunk) {
        batch.delete(docSnap.ref);
      }
      await batch.commit();

      if (i + chunkSize < docSnaps.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }
}

/**
 * Completely purges all cloud subcollections and resets profile settings in Firestore.
 */
export async function wipeCloudDataForUser(userId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized: Active authenticated session does not match the target user ID.');
  }

  // Purge all synced subcollections
  await wipeCloudCollectionsForUser(userId, SYNC_COLLECTIONS);

  // Reset settings & rest days in cloud profile
  const userRef = doc(firestore, 'users', userId);
  const settings = getSettings();
  const cleanSettings = settings ? JSON.parse(JSON.stringify(settings)) : {};

  await setDoc(doc(userRef, 'profile', 'settings'), {
    settings: cleanSettings,
    restDaysConfig: null,
    updatedAt: new Date().toISOString()
  });

  // Update sync metadata
  await setDoc(doc(userRef, 'meta', 'sync'), {
    lastSyncedAt: serverTimestamp(),
    initialized: true
  });

  lastUploadTimestamp = Date.now();
}

/**
 * Deletes a goal and all its cascade measurements from Firestore cloud storage.
 */
export async function deleteGoalFromCloud(userId: string, goalId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;

  try {
    const userRef = doc(firestore, 'users', userId);

    // 1. Delete the goal document
    await deleteDoc(doc(collection(userRef, 'goals'), String(goalId)));

    // 2. Cascade delete all goal measurements in Firestore
    const measurementsRef = collection(userRef, 'goalMeasurements');
    const q = query(measurementsRef, where('goalId', '==', String(goalId)));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const batch = writeBatch(firestore);
      snapshot.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn(`[CloudSync] Failed to delete goal ${goalId} from Firestore:`, err);
  }
}

/**
 * Deletes a single document from a user's Firestore cloud collection.
 */
export async function deleteDocumentFromCloud(
  userId: string, 
  colName: SyncCollectionName, 
  docId: string
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;

  try {
    const userRef = doc(firestore, 'users', userId);
    await deleteDoc(doc(collection(userRef, colName), String(docId)));
  } catch (err) {
    console.warn(`[CloudSync] Failed to delete document ${docId} from ${colName}:`, err);
  }
}


