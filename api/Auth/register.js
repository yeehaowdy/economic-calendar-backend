import { auth, db } from '../../db.js';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { felhasznaloNev, jelszo, email } = req.body;

  if (!felhasznaloNev || !jelszo || !email) {
    return res.status(400).json({ message: "Hiányzó adatok (felhasználónév, email vagy jelszó)!" });
  }

  try {
    // 1. Ellenőrizzük, hogy a displayName foglalt-e a Firestore-ban
    const q = query(collection(db, "users"), where("displayName", "==", felhasznaloNev));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return res.status(400).json({ message: "Ez a felhasználónév már foglalt!" });
    }

    // 2. Felhasználó létrehozása Firebase Auth-ban
    const userCredential = await createUserWithEmailAndPassword(auth, email, jelszo);
    const user = userCredential.user;

    // 3. Felhasználói adatok mentése Firestore-ba (displayName-vel)
    await setDoc(doc(db, "users", user.uid), {
      displayName: felhasznaloNev,
      email: email,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ 
      message: "Sikeres regisztráció!", 
      userId: user.uid,
      displayName: felhasznaloNev 
    });

  } catch (err) {
    console.error("Regisztrációs hiba:", err);

    if (err.code === 'auth/email-already-in-use') {
      return res.status(400).json({ message: "Ez az email cím már használatban van!" });
    }
    if (err.code === 'auth/weak-password') {
      return res.status(400).json({ message: "A jelszó túl gyenge (min. 6 karakter)!" });
    }

    return res.status(500).json({ message: "Szerver hiba történt." });
  }
}