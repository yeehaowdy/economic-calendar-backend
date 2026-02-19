import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// A környezeti változók beolvasása
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// --- 1. Firebase Inicializálás (Singleton minta) ---
// Ez megakadályozza, hogy minden egyes API híváskor újrainduljon a Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// --- 2. Szolgáltatások exportálása ---

// Firestore adatbázis (Vercel-optimalizált beállítással)
export const db = initializeFirestore(app, { 
  experimentalForceLongPolling: true 
});

// Autentikáció (ezt használod a login.js és register.js-ben)
export const auth = getAuth(app);

export default app;