# ✅ OTP Login Implementation Checklist

Complete these steps to verify your OTP authentication system is working correctly.

---

## 📋 Pre-Setup Checklist

- [ ] Node.js installed (`node --version` returns v14+)
- [ ] MongoDB running locally or connection string configured
- [ ] Redis available (or remove from requirements)
- [ ] Backend dependencies installed (`npm install` in `/backend`)
- [ ] Frontend dependencies installed (`npm install` in `/frontend`)

---

## 🔧 Backend Setup

### Step 1: Environment Configuration
- [ ] Create `backend/.env` file (copy from `.env.example`)
- [ ] Set `OTP_PROVIDER=development` (for testing, no SMS costs)
- [ ] Set `NODE_ENV=development`
- [ ] Set valid `MONGODB_URI` (e.g., `mongodb://localhost:27017/gov_schemes`)
- [ ] Generate random `SECRET_KEY` (min 32 characters)
- [ ] Generate random `JWT_SECRET` (min 32 characters)

**Sample .env for development:**
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gov_schemes
OTP_PROVIDER=development
JWT_SECRET=your-super-long-secret-key-here-minimum-32-chars
SECRET_KEY=another-super-long-secret-key-here-minimum-32-chars
```

### Step 2: Database Verification
- [ ] MongoDB is running
  - [ ] Test: `mongo --version` or `mongosh --version`
  - [ ] Test: `mongo` (should connect to local instance)
- [ ] Database collections will auto-create on first insert

### Step 3: Start Backend
- [ ] Navigate to `backend` directory
  ```bash
  cd backend
  ```
- [ ] Start the server
  ```bash
  npm start
  ```
- [ ] Verify output shows:
  ```
  ✅ Server running on port 5000
  ✅ MongoDB connected
  ✅ OTP Service initialized
  ```

**Expected Console Logs:**
```
[INFO] Application started
[INFO] Database connected
[INFO] Routes configured
[INFO] Server listening on port 5000
```

### Step 4: Test Backend OTP Endpoints

#### Test 1: Send OTP
- [ ] Open terminal/Postman/Insomnia
- [ ] Run:
  ```bash
  curl -X POST http://localhost:5000/api/v1/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{
      "phone": "9876543210",
      "type": "login"
    }'
  ```
- [ ] Check response: Should return `"success": true`
- [ ] Check backend logs: Should show generated OTP
  ```
  [DEMO MODE] OTP for 919876543210: 456789
  ```

#### Test 2: Verify OTP
- [ ] Note the OTP from logs (e.g., `456789`)
- [ ] Run:
  ```bash
  curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{
      "phone": "9876543210",
      "code": "456789",
      "type": "login"
    }'
  ```
- [ ] Check response: Should return `accessToken` and `refreshToken`
- [ ] Verify response includes user object with:
  - [ ] `phone: "9876543210"`
  - [ ] `isVerified: true`
  - [ ] `accessToken` (long JWT string)
  - [ ] `refreshToken` (long JWT string)

---

## 🎨 Frontend Setup

### Step 1: Environment (if needed)
- [ ] Frontend `.env` is optional
- [ ] Default API URL: `http://localhost:5000` ✅
- [ ] If different, update in `OTPLogin.jsx`:
  ```javascript
  const API_URL = 'http://localhost:5000/api/v1/auth';
  ```

### Step 2: Start Frontend
- [ ] Navigate to `frontend` directory
  ```bash
  cd frontend
  ```
- [ ] Start development server
  ```bash
  npm start
  ```
- [ ] Browser should open: `http://localhost:3000`
- [ ] Should see app loading

### Step 3: Navigate to OTP Login
- [ ] Look for OTP Login component/page
- [ ] Should see professional UI with:
  - [ ] Government Schemes Portal header
  - [ ] Purple/blue gradient background
  - [ ] Phone number input field
  - [ ] "+91" country code selector

---

## 🧪 Frontend Testing

### Test 1: Phone Input
- [ ] Clear any previous input
- [ ] Enter phone number: `9876543210`
- [ ] Verify:
  - [ ] Only 10 digits accepted
  - [ ] Can't enter letters or special characters
  - [ ] "Send OTP" button is enabled

### Test 2: Send OTP
- [ ] Click "Send OTP" button
- [ ] Verify:
  - [ ] Button shows "⏳ Sending..." state
  - [ ] Toast notification appears: "✅ OTP sent to your mobile number"
  - [ ] UI transitions to OTP input screen
  - [ ] Shows text "Code sent to +91 3210" (last 4 digits)
  - [ ] Timer starts counting down from 10:00

### Test 3: OTP Input
- [ ] See 6 input boxes (one per digit)
- [ ] Click first box and start typing OTP
- [ ] Verify:
  - [ ] Auto-focus to next box after each digit
  - [ ] Can use backspace to go back
  - [ ] Can paste full 6-digit OTP (Ctrl+V)
  - [ ] Only numeric input accepted

### Test 4: OTP Verification
- [ ] From backend logs, get OTP (e.g., `456789`)
- [ ] Enter OTP into frontend input boxes
- [ ] Click "Verify OTP" button
- [ ] Verify:
  - [ ] Button shows "⏳ Verifying..." state
  - [ ] Toast shows: "🎉 Login successful" (or similar)
  - [ ] localStorage contains:
    - [ ] `accessToken` (should be set)
    - [ ] `refreshToken` (should be set)
    - [ ] `user` (should contain phone number)
  - [ ] Callback `onLoginSuccess` is triggered

**Check localStorage:**
```javascript
// In browser console (F12)
localStorage.getItem('accessToken')   // Should return long JWT
localStorage.getItem('user')          // Should return user object
JSON.parse(localStorage.getItem('user'))  // Pretty print user
```

---

## 🔄 Full Integration Test

### Complete User Flow Test
1. [ ] **Clear State**
   - [ ] Close frontend browser tab
   - [ ] Clear browser localStorage (DevTools → Application → Storage)
   - [ ] Don't restart backend

2. [ ] **Fresh Login**
   - [ ] Reopen frontend: `http://localhost:3000`
   - [ ] Navigate to OTP Login component
   - [ ] Enter new phone: `9988776655`
   - [ ] Click "Send OTP"
   - [ ] Note OTP from backend logs
   - [ ] Enter OTP in frontend
   - [ ] Click "Verify OTP"
   - [ ] Should successfully login
   - [ ] Check `localStorage`

3. [ ] **Verify User Created**
   - [ ] Open MongoDB client (Compass or `mongosh`)
   - [ ] Find user in database:
     ```javascript
     use gov_schemes
     db.users.findOne({phone: "9988776655"})
     ```
   - [ ] Should show:
     - [ ] `phone: "9988776655"`
     - [ ] `isVerified: true`
     - [ ] `refreshToken` present
     - [ ] `createdAt` timestamp

4. [ ] **Verify OTP Stored**
   - [ ] Check OTP in database:
     ```javascript
     db.otps.findOne({phone: "9988776655"})
     ```
   - [ ] Should show:
     - [ ] `code: "123456"` (6 digits)
     - [ ] `expiresAt` (10 minutes in future)
     - [ ] `isUsed: true` (after verification)

---

## 🚨 Error Handling Tests

### Test Wrong OTP
- [ ] Enter phone: `9876543210`
- [ ] Send OTP
- [ ] Enter wrong OTP: `000000`
- [ ] Click "Verify OTP"
- [ ] Should show error toast: "❌ Invalid OTP"
- [ ] Should NOT login
- [ ] Should allow retry

### Test Maximum Attempts
- [ ] Continue entering wrong OTP 5 times
- [ ] After 5th wrong attempt:
  - [ ] Should show: "❌ Maximum attempts exceeded"
  - [ ] Should reset to phone input screen
  - [ ] Should allow resending OTP

### Test OTP Expiry
- [ ] Send OTP
- [ ] Wait for timer to reach 0:00
- [ ] Timer should show: "❌ Code expired"
- [ ] Should show "Resend OTP" button
- [ ] Click "Resend OTP" and repeat process

### Test Network Error (optional)
- [ ] Stop backend server: `Ctrl+C`
- [ ] Try to send OTP from frontend
- [ ] Should show error: "Failed to send OTP"
- [ ] Restart backend: `npm start`

---

## ✅ Production Readiness Checks

### Code Quality
- [ ] No console errors in browser (F12)
- [ ] No console errors in backend logs
- [ ] All warnings addressed
- [ ] Code follows project conventions

### Security
- [ ] JWT tokens are long random strings (not hardcoded)
- [ ] Passwords would be hashed (bcryptjs)
- [ ] No credentials in frontend code
- [ ] No passwords logged
- [ ] HTTPS recommended for production

### Performance
- [ ] OTP sends within 2-3 seconds
- [ ] Frontend UI responsive (no freezing)
- [ ] No memory leaks in browser
- [ ] Database queries optimized

### Mobile Compatibility
- [ ] Test on mobile browser (Chrome DevTools mobile mode)
- [ ] [ ] UI is fully responsive
- [ ] [ ] Touch input works correctly
- [ ] [ ] Fonts are readable
- [ ] [ ] All buttons clickable

---

## 📊 Database Verification

### Check OTP Collection
```bash
# In MongoDB shell or Compass
use gov_schemes
db.otps.find().pretty()
```

Should show documents like:
```javascript
{
  _id: ObjectId(...),
  phone: "9876543210",
  code: "456789",
  expiresAt: ISODate("2024-01-15T10:30:00.000Z"),
  isUsed: true,
  type: "login",
  attempts: 0,
  createdAt: ISODate("2024-01-15T10:20:00.000Z")
}
```

### Check User Collection
```bash
db.users.find().pretty()
```

Should show documents like:
```javascript
{
  _id: ObjectId(...),
  phone: "9876543210",
  name: "User_3210",
  email: null,
  isVerified: true,
  role: "user",
  profile: { age: null, gender: null, ... },
  savedSchemes: [],
  refreshToken: "eyJhbGci...",
  lastLogin: ISODate("2024-01-15T10:20:05.000Z"),
  createdAt: ISODate("2024-01-15T10:20:00.000Z"),
  updatedAt: ISODate("2024-01-15T10:20:05.000Z")
}
```

---

## 🔌 SMS Provider Setup (Optional)

When ready to use real SMS:

### Switch to MSG91 (Recommended for India)
1. [ ] Sign up at https://msg91.com/
2. [ ] Get AUTH_KEY from dashboard
3. [ ] Update `backend/.env`:
   ```bash
   OTP_PROVIDER=msg91
   MSG91_AUTH_KEY=your_actual_key_here
   MSG91_SENDER_ID=GOVSCH
   ```
4. [ ] Restart backend: `npm start`
5. [ ] Test send OTP from frontend
6. [ ] Check your phone for real SMS

### Switch to Twilio (Global)
1. [ ] Sign up at https://www.twilio.com/
2. [ ] Get ACCOUNT_SID and AUTH_TOKEN
3. [ ] Update `backend/.env`:
   ```bash
   OTP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_sid_here
   TWILIO_AUTH_TOKEN=your_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```
4. [ ] Restart backend: `npm start`
5. [ ] Test send OTP from frontend

---

## 📝 Final Verification Checklist

### Backend
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] OTP service initialized
- [ ] All routes registered
- [ ] Send OTP endpoint working
- [ ] Verify OTP endpoint working
- [ ] JWT tokens generated correctly
- [ ] User created in database
- [ ] OTP stored in database

### Frontend
- [ ] Component renders without errors
- [ ] Professional UI visible
- [ ] Phone input validation works
- [ ] Send OTP button functional
- [ ] OTP input with 6 boxes works
- [ ] Auto-focus between boxes works
- [ ] Timer counts down correctly
- [ ] Verify OTP button functional
- [ ] Tokens stored in localStorage
- [ ] Success callback triggered

### Integration
- [ ] Full login flow works end-to-end
- [ ] User created in database
- [ ] OTP auto-expires after 10 minutes
- [ ] Attempt limiting works (5 max)
- [ ] Error handling works
- [ ] Mobile responsive design works
- [ ] Toast notifications display correctly
- [ ] No security issues

### Documentation
- [ ] `OTP_LOGIN_SETUP.md` reviewed
- [ ] `QUICK_START_OTP.md` reviewed
- [ ] `.env.example` configured
- [ ] README updated (optional)

---

## 🎉 Success Criteria

✅ **You're Done When:**
- Backend OTP endpoints respond correctly
- Frontend login form displays professionally
- Can send OTP without SMS provider credentials
- Can verify OTP with code from logs
- User is created in database
- Tokens are stored in localStorage
- No errors in console or logs
- Mobile UI is responsive
- All 6 test scenarios pass

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/v1/auth/send-otp" | Backend not running. Run `npm start` in `/backend` |
| "Network Error" in frontend | Check backend URL in OTPLogin.jsx matches `http://localhost:5000` |
| "MongoDB connection failed" | Start MongoDB or check connection string |
| OTP not showing in console | Check `NODE_ENV=development` in `.env` |
| Frontend won't start | Check port 3000 not in use, or change in `package.json` |
| "EADDRINUSE" error | Port 5000 already in use, kill process or change PORT |

---

## 📞 Next Steps After Verification

1. ✅ All tests passing → **Production ready!**
2. Choose SMS provider (MSG91 for India)
3. Add credentials to `.env`
4. Test with real phone numbers
5. Deploy to production
6. Set up monitoring/logging
7. Configure HTTPS
8. Enable rate limiting

---

## 📚 Reference Files

- **Setup Guide:** `/OTP_LOGIN_SETUP.md`
- **Quick Start:** `/QUICK_START_OTP.md`
- **Implementation Summary:** `/IMPLEMENTATION_SUMMARY.md`
- **Environment Config:** `/backend/.env.example`

---

**Last Updated:** 2024 | **Status:** ✅ Complete

Once all checkboxes are ticked, your OTP system is fully functional! 🚀
