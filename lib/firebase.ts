import {getApp, getApps, initializeApp} from 'firebase/app';
import {GoogleAuthProvider, getAuth} from 'firebase/auth';
import {doc, getDocFromServer, getFirestore} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyBmXwINh9Yv05Qz571D5UF9ohIeSQp0TmA',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'christmaslist-6ccf4.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'christmaslist-6ccf4',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'christmaslist-6ccf4.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '966146072074',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:966146072074:web:ef103bf93a9ced6ec009f3',
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-MT5253QJKP',
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const db = getFirestore(firebaseApp);

let connectionChecked = false;

export async function testFirestoreConnection(): Promise<void> {
  if (typeof window === 'undefined' || connectionChecked) return;
  connectionChecked = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error(
        'Connexion Firestore impossible : vérifiez la configuration Firebase.'
      );
    }
  }
}
