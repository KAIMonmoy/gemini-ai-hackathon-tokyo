// Firebase initialization: Auth + Firestore for the existing GCP project
// `tokyo-gemini-ai-hackathon`. Config comes from VITE_FIREBASE_* env vars.

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey)

// Named Firestore database (asia-northeast1), NOT the auto-created "(default)"
// in nam5. Override via VITE_FIREBASE_DATABASE_ID if needed.
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || 'sourcingsentinel'

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app, databaseId)
