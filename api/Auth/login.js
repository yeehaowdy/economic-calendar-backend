import { auth, db } from '../../db.js';
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { username, password } = req.body;

  try {
    // 1. Megkeressük a felhasználó email címét a felhasználónév alapján a Firestore-ban
    const q = query(collection(db, "users"), where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ message: 'Hibás felhasználónév!' });
    }

    // Megvan a felhasználó doksi
    const userDoc = querySnapshot.docs[0];
    const email = userDoc.data().email;

    // 2. Bejelentkezés Firebase Auth-val
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return res.status(200).json({ 
      message: 'Sikeres belépés',
      user: { id: user.uid, username: username } 
    });

  } catch (error) {
    console.error("Belépési hiba:", error);
    let üzenet = "Szerver hiba";
    if (error.code === 'auth/wrong-password') üzenet = "Hibás jelszó!";
    return res.status(401).json({ message: üzenet });
  }
}