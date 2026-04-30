import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import axios from 'axios';

// NOTE: These are now loaded from your frontend .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = (topic) => {
  return getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY })
    .then((currentToken) => {
      if (currentToken) {
        console.log('Current token for client: ', currentToken);
        // Register token with backend for the specific topic
        return axios.post(`${import.meta.env.VITE_API_URL}/orders/register-token`, {
          token: currentToken,
          topic: topic
        }).then(res => {
          console.log('✅ Token registered successfully:', res.data);
        }).catch(err => {
          console.error('❌ Token registration failed:', err.response?.data || err.message);
        });
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    })
    .catch((err) => {
      console.log('An error occurred while retrieving token. ', err);
    });
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Payload received: ", payload);
      resolve(payload);
    });
  });

export default app;
