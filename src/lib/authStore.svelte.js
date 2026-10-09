import { auth, db } from '#lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const authState = $state({
  user: null,
  profile: null,
  loading: true
});

if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    authState.user = user;
    if (user) {
      try {
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          authState.profile = { id: docSnap.id, ...docSnap.data() };
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      }
    } else {
      authState.profile = null;
    }
    authState.loading = false;
  });
}

export const logout = async () => {
  await signOut(auth);
};
