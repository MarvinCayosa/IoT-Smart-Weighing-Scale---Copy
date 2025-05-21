// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCEaIceB9Wl268TvrbjsQRusyTG7Ilw7xI",
  authDomain: "iot-smart-weighing-scale.firebaseapp.com",
  projectId: "iot-smart-weighing-scale",
  storageBucket: "iot-smart-weighing-scale.appspot.com",
  messagingSenderId: "125845765471",
  appId: "1:125845765471:web:ccc2d8d13e45c0fa5a0aea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;