importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

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
    console.log('Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        data: {url: payload.notification.url},
        icon: 'https://i.imgur.com/S8zDbo4.png',
        vibrate: [200, 100, 200, 100],
        actions: [{action: "open_url", title: "Open"}]
    };
    return self.registration.showNotification(notificationTitle,
        notificationOptions);
});
self.addEventListener('notificationclick', event => {
    console.log(event);
    let url = event.notification.data.url;
    event.notification.close(); // Android needs explicit close.
    event.waitUntil(
        clients.matchAll({type: 'window'}).then( windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // If so, just focus it.
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});