import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB0mdIjNyCOWqZo3H6coKSh0WCx8kRr9GE",
  authDomain: "shahseatery-909d2.firebaseapp.com",
  projectId: "shahseatery-909d2",
  storageBucket: "shahseatery-909d2.firebasestorage.app",
  messagingSenderId: "266181911753",
  appId: "1:266181911753:web:d2d0a9903605d1562ed918",
  measurementId: "G-VZEVE52E2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Configure Google provider with custom parameters
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Set custom parameters to help with popup issues
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;