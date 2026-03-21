import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInAnonymously,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const debugLog = (payload: Record<string, unknown>) => {
  // #region agent log
  fetch('http://127.0.0.1:7703/ingest/33bd8a87-b60f-41cb-9ea1-3de7baf2f1a8',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain','X-Debug-Session-Id':'fb1f24'},body:JSON.stringify({sessionId:'fb1f24',...payload,timestamp:Date.now()})}).catch(()=>{});
  // #endregion
};

// Use the Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
debugLog({
  runId: 'pre-fix',
  hypothesisId: 'H2',
  location: 'src/firebase.ts:config-check',
  message: 'Firebase env presence',
  data: {
    hasApiKey: Boolean(firebaseConfig.apiKey),
    hasAuthDomain: Boolean(firebaseConfig.authDomain),
    hasProjectId: Boolean(firebaseConfig.projectId),
    hasStorageBucket: Boolean(firebaseConfig.storageBucket),
    hasMessagingSenderId: Boolean(firebaseConfig.messagingSenderId),
    hasAppId: Boolean(firebaseConfig.appId),
  },
});

let app;
try {
  app = initializeApp(firebaseConfig);
  debugLog({
    runId: 'pre-fix',
    hypothesisId: 'H2',
    location: 'src/firebase.ts:initialize',
    message: 'Firebase initialized',
    data: { ok: true },
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  debugLog({
    runId: 'pre-fix',
    hypothesisId: 'H2',
    location: 'src/firebase.ts:initialize',
    message: 'Firebase initialization failed',
    data: { error: message },
  });
  throw error;
}
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    debugLog({
      runId: 'pre-fix',
      hypothesisId: 'H3',
      location: 'src/firebase.ts:test-connection',
      message: 'Firestore connection test error',
      data: { error: message },
    });
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInAsGuest = () => signInAnonymously(auth);
export { RecaptchaVerifier, signInWithPhoneNumber };
export const logout = () => signOut(auth);
