import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  getDoc, 
  setDoc,
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

/**
 * Uploads all current local Dexie tables and settings to the user's Firestore cloud storage.
 */
export async function uploadLocalToCloud(userId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Unauthorized: Active authenticated session does not match the target user ID.');
  }

  const userRef = doc(firestore, 'users', userId);

  // 1. Upload settings & rest day config
  const settings = getSettings();
  const restDaysConfig = localStorage.getItem('rest_days_config_v1');
  
  await setDoc(doc(userRef, 'profile', 'settings'), {
    settings,
    restDaysConfig: restDaysConfig ? JSON.parse(restDaysConfig) : null,
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
        const docId = (item as any).id || (item as any).date;
        const docRef = doc(collection(userRef, colName), docId);
        batch.set(docRef, item, { merge: true });
      }

      await batch.commit();
    }
  }

  // Set meta doc indicating data exists
  await setDoc(doc(userRef, 'meta', 'sync'), {
    lastSyncedAt: serverTimestamp(),
    initialized: true
  });
}

/**
 * Downloads all data from the user's Firestore cloud storage into local Dexie.
 */
export async function downloadCloudToLocal(userId: string): Promise<boolean> {
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

    const items: any[] = [];
    snapshot.forEach(docSnap => {
      items.push(docSnap.data());
    });

    await table.clear();
    if (items.length > 0) {
      await table.bulkAdd(items);
    }
  }

  return true;
}

/**
 * Initializes synchronization when a user logs in.
 * If this is the user's first time logging in and cloud is empty, it backs up local data to cloud.
 * If cloud already has data, it pulls cloud data down to local.
 */
export async function handleUserLoginSync(userId: string): Promise<'uploaded_local' | 'pulled_cloud'> {
  const userRef = doc(firestore, 'users', userId);
  const metaSnap = await getDoc(doc(userRef, 'meta', 'sync'));

  if (!metaSnap.exists()) {
    // Cloud is empty for this user: back up local to cloud
    await uploadLocalToCloud(userId);
    return 'uploaded_local';
  } else {
    // Cloud has data: pull down to local
    await downloadCloudToLocal(userId);
    return 'pulled_cloud';
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
}
