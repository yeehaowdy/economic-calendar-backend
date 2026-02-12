require('dotenv').config();

const { initializeApp } = require("firebase/app");
const { initializeFirestore, doc, setDoc, serverTimestamp } = require("firebase/firestore");
const fetch = require("node-fetch");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

async function uploadData() {
  try {
    console.log("1. Lekérés...");
    const response = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json");
    const data = await response.json();
    
    console.log(`2. ${data.length} elem feldolgozása...`);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      // Szuper-biztonságos ID: csak számok és betűk, rövidítve
      const safeId = `event_${i}_${item.date.split('T')[0]}`; 

      try {
        const docRef = doc(db, "calendar_events", safeId);
        
        await setDoc(docRef, {
          title: item.title || "n/a",
          country: item.country || "n/a",
          date: item.date || "",
          impact: item.impact || "n/a",
          forecast: item.forecast || "",
          previous: item.previous || "",
          lastUpdated: serverTimestamp()
        }, { merge: true });

        if (i % 10 === 0) console.log(`${i} feltöltve...`);
      } catch (innerError) {
        console.error(`Hiba a(z) ${i}. elemnél (${item.title}):`, innerError.message);
      }
    }

    console.log("3. KÉSZ!");
    process.exit();
  } catch (error) {
    console.error("Fő hiba:", error.message);
    process.exit(1);
  }
}

uploadData();