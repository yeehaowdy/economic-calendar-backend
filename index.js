import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, getApps } from "firebase/app";
import { initializeFirestore, collection, getDocs, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp, limit, startAt, count, getCountFromServer } from "firebase/firestore";

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = initializeFirestore(firebaseApp, { experimentalForceLongPolling: true });

// GET /api/calendar
app.get('/api/calendar', async (req, res) => {
  try {
    const calendarRef = collection(db, "calendar_events");
    const q = query(calendarRef, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    
    const events = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      events.push({ 
        id: doc.id, 
        ...data,
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date 
      });
    });

    res.status(200).json(events);
  } catch (error) {
    console.error("Firebase Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.post('/api/calendar', async (req, res) => {
  try {
    const docId = `event_${Date.now()}`;
    await setDoc(doc(db, "calendar_events", docId), {
      ...req.body,
      lastUpdated: serverTimestamp()
    });
    res.status(201).json({ message: "Esemény létrehozva", id: docId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/calendar/:id', async (req, res) => {
  try {
    await setDoc(doc(db, "calendar_events", req.params.id), {
      ...req.body,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    res.status(200).json({ message: "Esemény frissítve" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/calendar/:id', async (req, res) => {
  try {
    await deleteDoc(doc(db, "calendar_events", req.params.id));
    res.status(200).json({ message: "Esemény törölve" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/news
app.get('/api/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    
    const newsRef = collection(db, "economic_news");

    const totalSnapshot = await getCountFromServer(newsRef);
    const totalCount = totalSnapshot.data().count;
    const totalPages = Math.ceil(totalCount / pageSize);
    const q = query(
      newsRef, 
      orderBy("pubDate", "desc"), 
      limit(pageSize * page)
    );

    const querySnapshot = await getDocs(q);
    
    const allFetched = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allFetched.push({ 
        id: doc.id, 
        ...data,
        pubDate: data.pubDate?.toDate ? data.pubDate.toDate().toISOString() : data.pubDate 
      });
    });

    const startIndex = (page - 1) * pageSize;
    const paginatedNews = allFetched.slice(startIndex, startIndex + pageSize);

    res.status(200).json({
      data: paginatedNews,
      totalPages: totalPages,
      currentPage: page
    });

  } catch (error) {
    console.error("Firebase News Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.get('/api/news/admin', async (req, res) => {
  try {
    const newsRef = collection(db, "economic_news");
    const q = query(newsRef, orderBy("pubDate", "desc"));
    const querySnapshot = await getDocs(q);
    const news = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      news.push({
        id: doc.id,
        ...data,
        pubDate: data.pubDate?.toDate ? data.pubDate.toDate().toISOString() : data.pubDate
      });
    });

    res.status(200).json(news);
  } catch (error) {
    console.error("Firebase News Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const newsData = req.body;
    const docId = `manual_${Date.now()}`; 
    const docRef = doc(db, "economic_news", docId);
    
    await setDoc(docRef, {
      ...newsData,
      lastUpdated: serverTimestamp()
    });
    
    res.status(201).json({ message: "News created successfully", id: docId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, "economic_news", id);
    await setDoc(docRef, {
      ...req.body,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    res.status(200).json({ message: "News updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDoc(doc(db, "economic_news", id));
    res.status(200).json({ message: "News Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const Port = process.env.PORT || 3000;
app.listen(Port, () => {
  console.log(`Backend is running on http://localhost:${Port}`);
});