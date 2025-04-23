// firebase-init.js
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyChPjlnBqYg1ayXdz8EaMK6sghCy3IJ9mo",
    authDomain: "flavorfuljourneys-6e7b1.firebaseapp.com",
    databaseURL: "https://flavorfuljourneys-6e7b1-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "flavorfuljourneys-6e7b1",
    storageBucket: "flavorfuljourneys-6e7b1.appspot.com",
    messagingSenderId: "340704507906",
    appId: "1:340704507906:web:4ca44f06aebc9ea1d08f1b",
    measurementId: "G-RQX2XSLNZJ"
};

// ✅ Only initialize ONCE
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };
