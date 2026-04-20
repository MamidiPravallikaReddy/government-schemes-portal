# 🚀 OTP Login - Quick Start Guide

Get the Government Schemes Portal OTP-based authentication up and running in 5 minutes!

---

## ✅ What You'll Get

A complete OTP login system with:
- 📱 SMS-based OTP authentication
- 🔐 Secure JWT token management
- 👤 Automatic user registration
- ⏱️ 10-minute OTP expiry
- 🌍 5 SMS providers (Twilio, AWS SNS, Vonage, MSG91, FastOTP)

---

## 📦 Components Included

✅ **Backend OTP Service** (`/backend/src/services/otpService.js`)
- Multi-provider SMS support
- Demo mode for development
- Error handling and logging

✅ **Database Models** (`/backend/src/models/OTP.js`, `/backend/src/models/User.js`)
- OTP schema with TTL index
- User profile storage
- Verification tracking

✅ **API Endpoints** (`/backend/src/routes/authRoutes.js`)
- `POST /api/v1/auth/send-otp` - Send OTP to phone
- `POST /api/v1/auth/verify-otp` - Verify OTP and login

✅ **Frontend Component** (`/frontend/src/components/OTPLogin.jsx`)
- Professional UI with gradients
- Two-step flow: phone → OTP
- Toast notifications
- Mobile responsive

---

## 🏃 Quick Start (Development)

### 1️⃣ Setup Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env - Use development mode (no SMS costs!)
# OTP_PROVIDER=development
```

### 2️⃣ Start Backend

```bash
npm install  # Install if not done
npm start
```

You should see:
```
✅ Server running on port 5000
✅ MongoDB connected
✅ OTP Service initialized (Development Mode)
```

### 3️⃣ Start Frontend

```bash
cd frontend
npm start
```

Open: http://localhost:3000

### 4️⃣ Test OTP Login

1. Click "OTP Login" button
2. Enter any 10-digit number: `9876543210`
3. Click "Send OTP"
4. Check backend console for OTP (example: `Generated OTP: 456789`)
5. Copy OTP and paste in frontend
6. Click "Verify OTP"
7. ✅ You're logged in!

---

## 🛠️ Production Setup

### Choose SMS Provider

**For India (Recommended: MSG91):**

```bash
# In .env
OTP_PROVIDER=msg91
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=GOVSCH
```

1. Sign up: https://msg91.com/
2. Get AUTH_KEY from dashboard
3. Update `.env`
4. Restart server

**For Global (Twilio):**

```bash
# In .env
OTP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

1. Sign up: https://www.twilio.com/
2. Get credentials from console
3. Update `.env`
4. Restart server

### Testing Real SMS

```bash
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","type":"login"}'
```

Check your phone for OTP!

---

## 📱 Frontend Integration

The OTP component is already integrated. Just import and use:

```jsx
import OTPLogin from './components/OTPLogin';

export default function App() {
  const handleLoginSuccess = (user) => {
    console.log('User logged in:', user);
    // Redirect to dashboard
  };

  return <OTPLogin onLoginSuccess={handleLoginSuccess} />;
}
```

### Token Management

After login, tokens are stored:
```javascript
localStorage.getItem('accessToken')    // For API calls
localStorage.getItem('refreshToken')   // For token refresh
localStorage.getItem('user')           // User profile
```

---

## 🔑 Environment Variables

### Minimum Required

```bash
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gov_schemes
OTP_PROVIDER=development
```

### With SMS Provider

```bash
OTP_PROVIDER=msg91
MSG91_AUTH_KEY=abc123xyz789
MSG91_SENDER_ID=GOVSCH
```

See `.env.example` for complete list.

---

## 📊 API Reference

### Send OTP

**Request:**
```bash
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "type": "login"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 600
  }
}
```

---

### Verify OTP

**Request:**
```bash
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "code": "456789",
  "type": "login"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "phone": "9876543210",
      "name": "User",
      "isVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 🐛 Troubleshooting

### OTP not showing?

**Check:**
- Backend is running: `npm start` in `/backend`
- PORT is 5000: `lsof -i :5000`
- MongoDB is running: `mongo --version`

---

### SMS not received?

**Check:**
- `OTP_PROVIDER` is set correctly
- Provider credentials are valid
- Node is in production mode: `NODE_ENV=production`

**Debug:**
```bash
# Test provider credentials
curl https://api.msg91.com/api/sendhttp.php?authkey=KEY&...
```

---

### Frontend not connecting?

**Check:**
- Backend URL is correct: `http://localhost:5000`
- CORS is enabled in backend
- Frontend is on `localhost:3000`

---

## 📚 Complete Documentation

For detailed setup and troubleshooting, see: **[OTP_LOGIN_SETUP.md](./OTP_LOGIN_SETUP.md)**

Topics covered:
- Detailed SMS provider setup
- Environment configuration
- Testing procedures
- Monitoring and logs
- Recommended configurations

---

## ✨ Features

✅ **Multi-step verification**
- Phone number entry
- 6-digit OTP input with auto-focus
- Individual input fields for OTP digits

✅ **Security**
- 10-minute OTP expiry
- Max 5 verification attempts
- Password hashing with bcryptjs
- JWT token-based authentication

✅ **User Experience**
- Toast notifications
- Loading states
- Resend OTP timer
- Change phone number option
- Professional gradient UI

✅ **Developer Friendly**
- Development mode (no SMS costs)
- Multi-provider support
- Comprehensive logging
- Easy configuration

---

## 🎯 Next Steps

1. ✅ **Now:** Test with development mode (this guide)
2. ✅ **Next:** Choose SMS provider and add credentials
3. ✅ **Then:** Deploy to production
4. ⭐ **Enhance:** Add 2FA, email OTP, analytics

---

## 💡 Tips

- Use **MSG91** in India (lowest cost: ₹0.40/SMS)
- Use **Twilio** for global deployments (reliable)
- Keep `MAX_OTP_ATTEMPTS=5` for security
- Set `OTP_EXPIRY_MINUTES=10` for user convenience
- Always use HTTPS in production

---

## 📞 Support

For issues:
1. Check backend logs: `tail -f logs/app.log`
2. Check frontend console: Browser DevTools → Console
3. Review detailed docs: `OTP_LOGIN_SETUP.md`
4. Debug with cURL: `curl -X POST http://localhost:5000/api/v1/auth/send-otp ...`

---

**Happy Coding! 🚀**

Last updated: 2024 | Version: 1.0
