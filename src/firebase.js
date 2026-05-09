import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import {getDatabase} from "firebase/database";
import { getAuth } from "firebase/auth";

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
const auth = getAuth(app);

const database = getDatabase(app);

async function initializeMessaging() {
    if (await isSupported()) {
        return getMessaging(app);
    }    return null;
}

export {database, initializeMessaging, auth}

