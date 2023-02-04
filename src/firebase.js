// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging,  getToken } from "firebase/messaging";


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBxMqWxQwI1OBhLk7wrzv0UhunvMTTgcgU",
    authDomain: "petanque-draw.firebaseapp.com",
    projectId: "petanque-draw",
    storageBucket: "petanque-draw.appspot.com",
    messagingSenderId: "774303828599",
    appId: "1:774303828599:web:78c14845b68be7fd4e5472"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const messaging = getMessaging(app);
getToken(messaging, {vapidKey: "BMGD4Al6TGUV0IPrRTyhJoLyFznaTd-Q190wgKE3vpvopFUpt1qRr0t2g7NpVyzUlaE-MsrfPLPB2RUwGxvMB9A"}).then((currentToken) => {
    if (currentToken) {
        console.log("token is " + currentToken);
        // Send the token to your server and update the UI if necessary
        // ...
    } else {
        // Show permission request UI
        console.log('No registration token available. Request permission to generate one.');
        // ...
    }
}).catch((err) => {
    console.log('An error occurred while retrieving token. ', err);
    // ...
});


