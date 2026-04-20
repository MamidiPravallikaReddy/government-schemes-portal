const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// First, download your service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate New Private Key

const serviceAccount = require('../../firebase-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

class FirebaseOTPService {
  async sendOTP(phoneNumber, otp) {
    try {
      // Format phone number (add +91 for India)
      let formattedNumber = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        formattedNumber = phoneNumber.length === 10 ? '+91' + phoneNumber : '+' + phoneNumber;
      }
      
      // Firebase doesn't have a direct OTP API - you use Firebase Auth
      // But you can generate custom tokens or use Firebase Auth REST API
      
      // Alternative: Use Firebase Auth with Phone Number
      // For custom OTP, you'd need to send via another method
      // Firebase Authentication provides built-in phone auth with 10k free/month
      
      return { success: true, provider: 'firebase' };
    } catch (error) {
      console.error('Firebase OTP error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FirebaseOTPService();