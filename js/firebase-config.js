// Firebase Configuration
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyC5g7KviI5TDvT1rQtQIw6un-aHu0SR7lk",
  authDomain: "student-system-de732.firebaseapp.com",
  projectId: "student-system-de732",
  storageBucket: "student-system-de732.firebasestorage.app",
  messagingSenderId: "423822794173",
  appId: "1:423822794173:web:59fbcd29ee2df82dc046d4",
  measurementId: "G-VLRC3FPVPQ"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
