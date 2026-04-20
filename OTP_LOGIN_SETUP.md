# OTP-Based Login Setup Guide

This guide explains how to set up and configure the OTP-based authentication system for the Government Schemes Portal.

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [SMS Providers](#sms-providers)
4. [Installation & Setup](#installation--setup)
5. [Environment Configuration](#environment-configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The OTP-based login system provides secure, phone-number-based authentication without passwords. Key features:

- ✅ **Multi-provider SMS support** - Choose from 5+ SMS services
- ✅ **10-minute OTP validity** - Automatic expiry and database cleanup
- ✅ **Rate limiting** - Max 5 verification attempts per phone
- ✅ **Development mode** - Test without sending real SMS
- ✅ **User registration** - Automatic account creation on first login
- ✅ **JWT tokens** - Secure authentication with access & refresh tokens

---

## 🏗️ System Architecture

### Flow Diagram

```
User Phone Input
      ↓
[Send OTP] → OTP Service → SMS Provider → User's Phone
      ↓
OTP Stored in MongoDB (TTL: 10 minutes)
      ↓
User Enters OTP
      ↓
[Verify OTP] → Database Check → JWT Generation
      ↓
Login Success / Account Created
```

### Component Files

| Component | Location | Purpose |
|-----------|----------|---------|
| **OTP Service** | `/backend/src/services/otpService.js` | Handles SMS delivery via multiple providers |
| **OTP Model** | `/backend/src/models/OTP.js` | MongoDB schema for OTP storage |
| **Auth Controller** | `/backend/src/controllers/authController.js` | Business logic for send/verify OTP |
| **Auth Routes** | `/backend/src/routes/authRoutes.js` | API endpoints |
| **Frontend Component** | `/frontend/src/components/OTPLogin.jsx` | React UI for OTP login |

---

## 📱 SMS Providers

The system supports **5 SMS providers**. Choose one based on your region and requirements:

### 1. **Twilio** (Recommended - Global)

**Pros:**
- Excellent uptime and reliability
- Global coverage
- Free trial credits
- Detailed documentation

**Cons:**
- Pay-per-SMS model (higher cost)
- Requires additional setup

**Setup:**

1. Sign up at https://www.twilio.com/
2. Get your free phone number
3. Navigate to Console → API Keys & tokens
4. Note your:
   - `ACCOUNT_SID`
   - `AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER` (your Twilio number, e.g., +1234567890)

**Environment Variables:**
```bash
OTP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Cost:** $0.0075 per SMS (approx ₹0.60 per SMS in India)

---

### 2. **AWS SNS** (Best for AWS Infrastructure)

**Pros:**
- Integrated with AWS ecosystem
- Automatic scaling
- Pay-per-SMS

**Cons:**
- Requires AWS account setup
- More complex configuration

**Setup:**

1. Create AWS account: https://aws.amazon.com/
2. Go to IAM → Create new user with SNS permissions
3. Generate Access Key & Secret Access Key
4. Note your region (e.g., `ap-south-1` for India)

**Environment Variables:**
```bash
OTP_PROVIDER=aws-sns
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
```

**Cost:** $0.00645 per SMS in India

---

### 3. **Vonage** (Formerly Nexmo)

**Pros:**
- Good coverage
- Affordable pricing
- REST API

**Cons:**
- Less popular in India

**Setup:**

1. Sign up at https://www.vonage.com/
2. Go to Settings → API keys
3. Note your:
   - `API_KEY`
   - `API_SECRET`

**Environment Variables:**
```bash
OTP_PROVIDER=vonage
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_BRAND_NAME=YourAppName
```

**Cost:** $0.05 per SMS (approx)

---

### 4. **MSG91** ⭐ (Best for India)

**Pros:**
- India-specific provider
- Lowest cost
- Government organizations use this
- Local support

**Cons:**
- India-specific only

**Setup:**

1. Sign up at https://msg91.com/
2. Go to Dashboard → Integrations → REST API
3. Note your:
   - `AUTH_KEY` (API Key)
   - `SENDER_ID` (Your brand name)

**Environment Variables:**
```bash
OTP_PROVIDER=msg91
MSG91_AUTH_KEY=your_auth_key
MSG91_SENDER_ID=YourBrand
```

**Cost:** ₹0.40-₹0.80 per SMS (lowest in India)

**Recommended for Government Schemes Portal** ✅

---

### 5. **FastOTP** (Alternative India Provider)

**Pros:**
- India-focused
- Simple integration
- Competitive pricing

**Setup:**

1. Sign up at https://www.fastotp.com/
2. Get your API credentials
3. Note your:
   - `API_KEY`

**Environment Variables:**
```bash
OTP_PROVIDER=fastotp
FASTOTP_API_KEY=your_api_key
```

---

## 🔧 Installation & Setup

### Step 1: Backend Dependencies

All required packages are already installed. Verify:

```bash
cd backend
npm list axios  # Should be installed
npm list bcryptjs  # Should be installed
```

If missing:
```bash
npm install axios bcryptjs
```

### Step 2: MongoDB Setup

Ensure MongoDB is running:

```bash
# Windows
net start MongoDB

# Linux/Mac
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 mongo
```

Verify connection in your database config.

### Step 3: Environment Variables

Create `.env` file in `/backend` directory:

**For development (using MSG91 - recommended for India):**

```bash
# Server
PORT=5000
NODE_ENV=development
SECRET_KEY=your-super-secret-key-min-32-chars-here

# Database
MONGODB_URI=mongodb://localhost:27017/government-schemes
REDIS_URL=redis://localhost:6379

# OTP Configuration (MSG91 - India)
OTP_PROVIDER=msg91
MSG91_AUTH_KEY=your_msg91_auth_key_here
MSG91_SENDER_ID=GOVSCH

# OTP Settings
OTP_EXPIRY_MINUTES=10
MAX_OTP_ATTEMPTS=5

# JWT
JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# Firebase (if using Firebase auth)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_email
```

**For production (choose your provider):**

```bash
NODE_ENV=production
OTP_PROVIDER=msg91  # Change to twilio/aws-sns/vonage/fastotp if needed
MSG91_AUTH_KEY=prod_auth_key_here
```

### Step 4: Create `.env.example`

Commit this to version control (without sensitive values):

```bash
# Server Config
PORT=5000
NODE_ENV=development
SECRET_KEY=your-secret-key

# Database
MONGODB_URI=mongodb://localhost:27017/government-schemes
REDIS_URL=redis://localhost:6379

# OTP Provider (twilio, aws-sns, vonage, msg91, fastotp)
OTP_PROVIDER=msg91
MSG91_AUTH_KEY=your_key_here
MSG91_SENDER_ID=GOVSCH
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1234567890
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_REGION=ap-south-1
VONAGE_API_KEY=your_key_here
VONAGE_API_SECRET=your_secret_here
FASTOTP_API_KEY=your_key_here

# OTP Settings
OTP_EXPIRY_MINUTES=10
MAX_OTP_ATTEMPTS=5

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
```

---

## 🧪 Testing

### Test 1: Send OTP

**Using cURL:**

```bash
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "type": "login"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 600
  }
}
```

**Check logs for OTP in development mode:**
```
[OTP] Generated OTP for +919876543210: 123456
```

---

### Test 2: Verify OTP

**Using cURL:**

```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "code": "123456",
    "type": "login"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "phone": "9876543210",
      "name": "User_3210",
      "isVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### Test 3: Frontend Login

1. Start the frontend: `npm start` in `/frontend`
2. Navigate to OTP Login component
3. Enter phone: `9876543210`
4. Click "Send OTP"
5. Check backend logs for OTP code (development mode)
6. Enter OTP in frontend
7. Click "Verify OTP"
8. Should see success toast and redirect

---

## 🐛 Troubleshooting

### Issue: "OTP service not found"

**Solution:**
```bash
# Verify file exists
ls backend/src/services/otpService.js

# Check imports in authController.js
grep -n "require.*otpService" backend/src/controllers/authController.js
```

---

### Issue: "Provider credentials invalid"

**Check:**
1. Environment variables are set correctly
2. Provider credentials are not expired
3. Network connectivity to SMS provider

**Debug:**
```bash
# In backend/.env, temporarily set NODE_ENV=development
# This will log OTP to console instead of sending SMS
NODE_ENV=development npm start
```

---

### Issue: "MONGODB Connection Error"

**Check:**
1. MongoDB is running: `mongo` or `mongosh`
2. MONGODB_URI is correct
3. Database exists

---

### Issue: "Request timeout"

**Check SMS Provider:**
1. API keys are valid
2. Provider service is up (check status page)
3. Network firewall allows outbound HTTPS

**Fallback:**
- Use development mode to test
- Switch to different provider temporarily

---

### Issue: "OTP expires too quickly"

**Solution:**
Adjust in `.env`:
```bash
OTP_EXPIRY_MINUTES=15  # Increase from 10 to 15
```

Then restart backend server.

---

## 📊 Monitoring & Logs

### Check OTP Delivery

**Development Mode** (logs to console):
```
[OTP Service] Sending OTP to 919876543210
[OTP] Generated OTP for +919876543210: 456789
[Demo Mode] OTP not sent (development mode - check console)
```

**Production Mode** (calls provider API):
```
[OTP Service] Sending via MSG91
[HTTP] POST https://api.msg91.com/...
[Response] Delivery Status: Submitted
```

### Database

Check stored OTPs:
```bash
# MongoDB shell
use government-schemes
db.otps.find({phone: "9876543210"}).pretty()

# Check expiry
db.otps.find({expiresAt: {$gt: new Date()}}).count()
```

---

## 🚀 Recommended Configuration

### For Development:

```bash
OTP_PROVIDER=development  # Uses console logs
NODE_ENV=development
```

### For Testing (Indian Government Schemes):

```bash
OTP_PROVIDER=msg91
MSG91_AUTH_KEY=<your-key>
MSG91_SENDER_ID=GOVSCH
NODE_ENV=production
```

### For Production (Global Scale):

```bash
OTP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
TWILIO_PHONE_NUMBER=<your-number>
NODE_ENV=production
```

---

## 📚 Additional Resources

- [Twilio Documentation](https://www.twilio.com/docs)
- [MSG91 API Docs](https://msg91.com/apidoc/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [Vonage Documentation](https://developer.vonage.com/)

---

## ✅ Implementation Checklist

- [ ] Choose SMS provider
- [ ] Create provider account and get credentials
- [ ] Create `.env` file with credentials
- [ ] Test backend OTP endpoints with cURL
- [ ] Test frontend OTP login component
- [ ] Verify database OTP storage and expiry
- [ ] Set up monitoring/logging
- [ ] Test with real phone numbers (production)
- [ ] Implement rate limiting middleware (optional)
- [ ] Add SMS delivery tracking (optional)

---

## 🎓 Next Steps

1. **Implement Email OTP** (as alternative)
2. **Add Two-Factor Authentication** (optional security layer)
3. **SMS Template Customization** (personalized messages)
4. **OTP Analytics** (track delivery rates)
5. **Webhook Integration** (SMS delivery confirmation)

---

**Last Updated:** 2024
**Version:** 1.0
