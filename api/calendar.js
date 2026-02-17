import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, getApps } from "firebase/app";
import { initializeFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. Firebase Konfiguráció ---
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// --- 2. Firebase Inicializálás ---
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
// Itt javítottam: a firebaseApp-ot kell átadni, nem az Express app-ot!
const db = initializeFirestore(firebaseApp, { experimentalForceLongPolling: true });

// --- 3. Az API Route (Végpont) ---
app.get('/api/calendar', async (req, res) => {
  try {
    const calendarRef = collection(db, "calendar_events");
    const q = query(calendarRef, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    
    const events = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Biztonságos átalakítás ISO dátummá
      events.push({ 
        id: doc.id, 
        ...data,
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date 
      });
    });

    res.status(200).json(events);
  } catch (error) {
    console.error("Firebase Error:", error);
    res.status(500).json({ error: "Szerver hiba történt", details: error.message });
  }
});

// --- 4. Szerver indítása ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ A szerver fut a http://localhost:${PORT} címen`);
  console.log(`📅 Naptár adatok itt: http://localhost:${PORT}/api/calendar`);
});