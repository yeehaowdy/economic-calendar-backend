import { auth, db } from '../../db.js';
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Hiányzó adatok!" });
  }

  try {
    // 1. Keresés a Firestore-ban: a "displayName" mezőt hasonlítjuk a megadott username-hez
    const q = query(collection(db, "users"), where("displayName", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ message: 'Hibás felhasználónév!' });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const email = userData.email;

    // 2. Bejelentkezés Firebase Auth-val (email + jelszó)
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return res.status(200).json({ 
      message: 'Sikeres belépés',
      user: { 
        id: user.uid, 
        displayName: userData.displayName 
      } 
    });

  } catch (error) {
    console.error("Belépési hiba:", error);
    
    let üzenet = "Szerver hiba";
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      üzenet = "Hibás felhasználónév vagy jelszó!";
    }
    
    return res.status(401).json({ message: üzenet });
  }
}