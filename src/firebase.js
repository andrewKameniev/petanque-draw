// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import {getDatabase} from "firebase/database";


const firebaseConfig = {
    apiKey: "AIzaSyBxMqWxQwI1OBhLk7wrzv0UhunvMTTgcgU",
    authDomain: "petanque-draw.firebaseapp.com",
    databaseURL: "https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "petanque-draw",
    storageBucket: "petanque-draw.appspot.com",
    messagingSenderId: "774303828599",
    appId: "1:774303828599:web:78c14845b68be7fd4e5472"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

const database = getDatabase(app);
const messaging = getMessaging(app);

export {database, messaging}

