import { db } from '../db.js';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default async function handler(req, res) {
    // Vercel alatt a CORS-t és a metódust manuálisan kezeljük
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // OPTIONS kérés kezelése (preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const calendarRef = collection(db, "calendar_events");
        const q = query(calendarRef, orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);
        
        const events = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Biztonságos dátumkezelés: 
            // Ha a Firestore-ban Timestamp van, toDate()-et hívunk, ha sima string, hagyjuk.
            let formattedDate = data.date;
            if (data.date && typeof data.date.toDate === 'function') {
                formattedDate = data.date.toDate().toISOString();
            }

            events.push({ 
                id: doc.id, 
                ...data,
                date: formattedDate
            });
        });

        res.status(200).json(events);
    } catch (error) {
        console.error("Firebase Error a naptárnál:", error);
        res.status(500).json({ 
            error: "Szerver hiba történt az események lekérésekor", 
            details: error.message 
        });
    }
}