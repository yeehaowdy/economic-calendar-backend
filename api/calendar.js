const { initializeApp } = require("firebase/app");
const { initializeFirestore, collection, getDocs, query, orderBy } = require("firebase/firestore");

// Config beolvasása a környezeti változókból
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

module.exports = async (req, res) => {
  // CORS beállítások, hogy a Netlify-ról elérhető legyen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const calendarRef = collection(db, "calendar_events");
    // Lekérdezés dátum szerint sorba rendezve
    const q = query(calendarRef, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    
    const events = [];
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};