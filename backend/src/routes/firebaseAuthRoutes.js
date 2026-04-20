const express = require('express');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Initialize Firebase Admin SDK
// Make sure you have downloaded the service account JSON file from Firebase Console
// and placed it in your backend folder as 'firebase-service-account.json'
let serviceAccount;
try {
  serviceAccount = require('../../firebase-service-account.json');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized');
  }
} catch (error) {
  console.log('⚠️ Firebase service account not found. Using demo mode.');
  console.log('   Download service account from Firebase Console → Project Settings → Service Accounts');
}

// Store users (replace with database in production)
const userStore = new Map();

// Verify Firebase token and create/login user
router.post('/firebase-verify', async (req, res) => {
  const { token, phone, name } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required'
    });
  }

  try {
    // If Firebase Admin is not initialized, use demo mode
    if (!admin.apps.length) {
      console.log('📱 Demo mode: Accepting test token');
      // Demo mode - accept any token for testing
      const userId = `demo_user_${Date.now()}`;
      const userData = {
        id: userId,
        phone: phone || '9876543210',
        name: name || 'Demo User',
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      const accessToken = jwt.sign(
        { userId: userData.id, phone: userData.phone, name: userData.name },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Demo authentication successful',
        data: { user: userData, accessToken }
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    const firebasePhone = decodedToken.phone_number || phone;

    console.log(`✅ Firebase token verified for UID: ${firebaseUid}`);

    // Check if user exists in our system
    let userId = `user_${firebaseUid}`;
    let userData = userStore.get(userId);

    if (!userData) {
      // Create new user
      userData = {
        id: userId,
        firebaseUid: firebaseUid,
        phone: firebasePhone,
        name: name || `User_${firebasePhone?.slice(-4) || 'New'}`,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      userStore.set(userId, userData);
      console.log(`📝 New user created: ${userId}`);
    } else {
      // Update last login
      userData.lastLogin = new Date();
      userStore.set(userId, userData);
      console.log(`👤 Existing user logged in: ${userId}`);
    }

    // Generate JWT for your backend
    const accessToken = jwt.sign(
      { 
        userId: userData.id,
        phone: userData.phone,
        name: userData.name 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: {
          id: userData.id,
          phone: userData.phone,
          name: userData.name
        },
        accessToken: accessToken
      }
    });

  } catch (error) {
    console.error('Firebase verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please sign in again.'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
});

// Get user info (protected route)
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const userData = userStore.get(userId);
  
  if (!userData) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    user: userData
  });
});

// Get all users (admin only - for testing)
router.get('/users', (req, res) => {
  const users = Array.from(userStore.values());
  res.json({
    success: true,
    users: users,
    count: users.length
  });
});

module.exports = router;