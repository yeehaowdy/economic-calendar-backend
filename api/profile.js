const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Felhasználó lekérése az egyedi numerikus ID alapján
 */
const getUserById = async (numericId) => {
  try {
    const userRef = db.collection('users');
    const snapshot = await userRef.where('id', '==', parseInt(numericId)).limit(1).get();

    if (snapshot.empty) {
      return { success: false, message: 'Felhasználó nem található.' };
    }

    // Visszaadjuk az adatokat és a dokumentum belső ID-ját a későbbi frissítéshez
    const doc = snapshot.docs[0];
    return { success: true, docId: doc.id, data: doc.data() };
  } catch (error) {
    console.error('Backend hiba (get):', error);
    throw error;
  }
};

/**
 * Felhasználói adatok frissítése
 * @param {number} numericId - A felhasználó numerikus azonosítója
 * @param {Object} updateData - A frissítendő mezők (displayName, photoURL, stb.)
 */
const updateUser = async (numericId, updateData) => {
  try {
    const userSearch = await getUserById(numericId);
    
    if (!userSearch.success) return userSearch;

    const userDocRef = db.collection('users').doc(userSearch.docId);
    await userDocRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() // Opcionális időbélyeg
    });

    return { success: true, message: 'Profil sikeresen frissítve.' };
  } catch (error) {
    console.error('Backend hiba (update):', error);
    throw error;
  }
};

/**
 * Admin jogosultság állítása (Kizárólag backendről hívható!)
 */
const setAdminStatus = async (numericId, isAdmin) => {
  return await updateUser(numericId, { admin: Boolean(isAdmin) });
};

module.exports = {
  getUserById,
  updateUser,
  setAdminStatus
};