import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAuDGxuzfOVNBZMj4aN6pC0Yu5xqBV0720",
  authDomain: "casa-legal-inmobiliaria.firebaseapp.com",
  projectId: "casa-legal-inmobiliaria",
  storageBucket: "casa-legal-inmobiliaria.firebasestorage.app",
  messagingSenderId: "294512233346",
  appId: "1:294512233346:web:def9126d3926aa0be25d9b",
  measurementId: "G-7410VBFE98"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app, "casalegalbolivia");
const storage = getStorage(app);

// Conditionally initialize analytics only in the browser environment
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };
