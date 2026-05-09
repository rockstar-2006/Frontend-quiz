import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBDgFAoU_4Xo8ufe3PU5sDtq1NNXzhFxMw",
  authDomain: "shreyas-9086d.firebaseapp.com",
  databaseURL: "https://shreyas-9086d-default-rtdb.firebaseio.com",
  projectId: "shreyas-9086d",
  storageBucket: "shreyas-9086d.firebasestorage.app",
  messagingSenderId: "659920111975",
  appId: "1:659920111975:web:e1fb96991afb8fcc3dc7c2",
  measurementId: "G-ZHRKDKSFR7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export default app;
