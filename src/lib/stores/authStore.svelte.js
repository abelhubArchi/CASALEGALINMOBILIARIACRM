import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '#lib/firebase/firebase.client.js';

export function createAuthStore() {
  let user = $state(null);
  let userData = $state(null); // Documento de la colección 'users' (rol, etc)
  let loading = $state(true);

  if (typeof window !== 'undefined') {
    onAuthStateChanged(auth, async (firebaseUser) => {
      user = firebaseUser;
      
      if (firebaseUser) {
        // Obtenemos los permisos del asesor desde la BD
        const docRef = doc(db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            userData = docSnap.data();
          }
        } catch (error) {
          console.error("Error obteniendo perfil del usuario:", error);
        }
      } else {
        userData = null;
      }
      
      loading = false;
    });
  }

  return {
    get user() { return user; },
    get userData() { return userData; },
    get loading() { return loading; }
  };
}

export const authStore = createAuthStore();
