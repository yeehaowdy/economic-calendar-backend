// api/calendar.js
const { initializeApp, getApps } = require("firebase/app");
const { initializeFirestore, collection, getDocs, query, orderBy } = require("firebase/firestore");

// 1. Firebase Config (Környezeti változókból)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// 2. Firebase Inicializálás (fontos a "getApps", hogy ne inicializálja újra feleslegesen)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

module.exports = async (req, res) => {
  // 3. CORS Beállítások (Hogy a Netlify elérje)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Ha a böngésző csak ellenőrzi a kapcsolatot (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const calendarRef = collection(db, "calendar_events");
    // Sorba rendezzük dátum szerint
    const q = query(calendarRef, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    
    const events = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Átalakítjuk a Firebase Timestamp-et ISO dátummá, hogy a React értse
      events.push({ 
        id: doc.id, 
        ...data,
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date 
      });
    });

    // 4. JSON válasz küldése
    res.status(200).json(events);
  } catch (error) {
    console.error("Firebase Error:", error);
    res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
};