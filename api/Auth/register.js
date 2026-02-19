import { auth, db } from '../db.js';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { felhasznaloNev, jelszo, email } = req.body; // Firebase-hez kell egy email is!

  try {
    // 1. Ellenőrizzük, hogy a felhasználónév foglalt-e a Firestore-ban
    const q = query(collection(db, "users"), where("username", "==", felhasznaloNev));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return res.status(400).json({ message: "Ez a felhasználónév már foglalt!" });
    }

    // 2. Felhasználó létrehozása Firebase Auth-ban
    // Megjegyzés: Ha nincs email-ed, használhatsz egy "felhasznalonev@domain.com" formátumot is.
    const userCredential = await createUserWithEmailAndPassword(auth, email, jelszo);
    const user = userCredential.user;

    // 3. Felhasználói adatok mentése Firestore-ba
    await setDoc(doc(db, "users", user.uid), {
      username: felhasznaloNev,
      email: email,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ message: "Sikeres regisztráció!", userId: user.uid });
  } catch (err) {
    console.error("Regisztrációs hiba:", err);
    return res.status(500).json({ message: err.message });
  }
}