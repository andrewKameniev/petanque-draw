importScripts('https://www.gstatic.com/firebasejs/8.2.7/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.2.7/firebase-messaging.js')

const firebaseConfig = {
    apiKey: "AIzaSyBxMqWxQwI1OBhLk7wrzv0UhunvMTTgcgU",
    authDomain: "petanque-draw.firebaseapp.com",
    projectId: "petanque-draw",
    storageBucket: "petanque-draw.appspot.com",
    messagingSenderId: "774303828599",
    appId: "1:774303828599:web:78c14845b68be7fd4e5472"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
    };
    return self.registration.showNotification(notificationTitle,
        notificationOptions);
});
self.addEventListener('notificationclick', event => {
    console.log(event)
});