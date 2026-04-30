const admin = require('firebase-admin');
const path = require('path');

let serviceAccount;
try {
  if (process.env.FIREBASE_CREDENTIALS) {
    const creds = process.env.FIREBASE_CREDENTIALS.trim();
    console.log('📦 Loading Firebase credentials from ENV...');
    
    let decoded;
    if (creds.startsWith('{')) {
      console.log('📄 Credentials detected as raw JSON');
      decoded = creds;
    } else {
      console.log('🔐 Credentials detected as Base64, decoding...');
      try {
        decoded = Buffer.from(creds, 'base64').toString('utf8');
        // Basic check to see if decoding worked
        if (!decoded.trim().startsWith('{')) {
          console.error('❌ Decoding failed: Result does not start with {');
        }
      } catch (decodeErr) {
        console.error('❌ Base64 Decode Error:', decodeErr.message);
        decoded = creds; // fallback
      }
    }
    
    serviceAccount = JSON.parse(decoded);
  } else {
    const serviceAccountPath = path.join(__dirname, '../Config/firebase-service-account.json');
    serviceAccount = require(serviceAccountPath);
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin Initialized');
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin Initialization Failed');
  console.error('Error Detail:', error.message);
  if (process.env.FIREBASE_CREDENTIALS) {
    console.log('Hint: Check if FIREBASE_CREDENTIALS in .env is valid JSON or Base64 encoded JSON.');
  }
}

const sendNotification = async (token, title, body, data = {}) => {
  if (!token) return;
  
  const message = {
    notification: { title, body },
    data,
    token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

const sendToTopic = async (topic, title, body, data = {}) => {
  const message = {
    notification: { title, body },
    data,
    topic
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent to topic:', response);
    return response;
  } catch (error) {
    console.error('Error sending to topic:', error);
  }
};

module.exports = { sendNotification, sendToTopic };
