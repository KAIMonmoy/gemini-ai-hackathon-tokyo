// Firestore data access. Model:
//   users/{uid}            -> BusinessProfile (company info + watch-list items)
//   users/{uid}/runs/{id}  -> Brief (one analysis result)
//
// Note: the watch list is kept as an `items` array inside the profile doc rather
// than a separate `watchlist` subcollection — it's a handful of items, well under
// Firestore's 1MB/doc limit, and updating it atomically is simpler.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { addDoc } from 'firebase/firestore'

import { db } from './firebase'
import type { Brief, BusinessProfile } from './types'

export async function loadProfile(uid: string): Promise<BusinessProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as BusinessProfile) : null
}

export async function saveProfile(uid: string, profile: BusinessProfile): Promise<void> {
  await setDoc(doc(db, 'users', uid), { ...profile, updated_at: Date.now() }, { merge: true })
}

export async function saveRun(uid: string, brief: Brief): Promise<void> {
  await addDoc(collection(db, 'users', uid, 'runs'), { ...brief, created_at: serverTimestamp() })
}

export async function loadLatestRun(uid: string): Promise<Brief | null> {
  const q = query(collection(db, 'users', uid, 'runs'), orderBy('created_at', 'desc'), limit(1))
  const snap = await getDocs(q)
  return snap.empty ? null : (snap.docs[0].data() as Brief)
}
