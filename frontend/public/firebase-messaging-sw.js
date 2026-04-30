// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyCd9hdXKYOlMsFxL9EED4pe8oFnKJoxTw0",
  authDomain: "fir-notifiactions.firebaseapp.com",
  projectId: "fir-notifiactions",
  storageBucket: "fir-notifiactions.firebasestorage.app",
  messagingSenderId: "877278051328",
  appId: "1:877278051328:web:f485d5d81c11972aa32ce5"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
