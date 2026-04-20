# 🚀 Login → Dashboard Flow Guide

Your frontend is now configured to show a **login page on startup**, then redirect to the **dashboard after successful login**.

---

## ✅ How It Works

### Login Flow

```
App Opens
    ↓
Check localStorage for accessToken
    ↓
┌─────────────────────────┐
│ Token Found?            │
└─────────────────────────┘
    ↙                    ↘
  YES                    NO
    ↓                     ↓
 Dashboard           OTP Login Page
    ↓                     ↓
   User           Enter Phone Number
 Logged In               ↓
                    Send OTP
                     ↓
                  Enter OTP
                     ↓
              Verify & Get Tokens
                     ↓
               Store in localStorage
                     ↓
                  Dashboard
```

---

## 🏃 Quick Start

### Prerequisites

- Backend running on `http://localhost:5000`
- MongoDB connected
- Frontend dependencies installed

### Step 1: Start Backend

```bash
cd backend
npm start
```

**Expected output:**
```
✅ Server running on port 5000
✅ MongoDB connected
✅ OTP Service initialized (Development Mode)
```

### Step 2: Start Frontend

```bash
cd frontend
npm start
```

**Browser opens automatically to:** `http://localhost:3000`

---

## 📋 What You'll See

### **Screen 1: OTP Login Page** (First Time)

When you first open the app:

```
┌─────────────────────────────────┐
│   🏛️ Government Schemes Portal  │
│   Find schemes that match your  │
│         profile                 │
├─────────────────────────────────┤
│                                 │
│  📱 Mobile Number               │
│  ┌──────────┬──────────────────┐│
│  │  +91     │ 9876543210       ││
│  └──────────┴──────────────────┘│
│                                 │
│  [Send OTP]                     │
│                                 │
│  Don't have an account? Sign Up │
│                                 │
└─────────────────────────────────┘
```

**User Actions:**
1. Enter 10-digit phone number
2. Click "Send OTP"
3. Receive OTP (check backend logs in dev mode)
4. Enter 6-digit OTP
5. Click "Verify OTP"

### **Screen 2: Professional Dashboard** (After Login)

After successful login, you'll see:

```
┌────────────────────────────────────────────────────────────────┐
│ 🏛️ Government Schemes Portal | Language Selector | Hello User  │
│ [Logout]                                                       │
├────────────┬──────────────────────────────────────────────────┤
│ Categories │                                                  │
│            │  Search Schemes | Filter by Category            │
│ All Categ. │                                                  │
│ 🌾 Agric.  │  ┌──────────────┐ ┌──────────────┐             │
│ 📚 Educat. │  │ Scheme Card  │ │ Scheme Card  │             │
│ 🤝 Social  │  │              │ │              │             │
│ 💼 Busines │  └──────────────┘ └──────────────┘             │
│            │                                                  │
│            │  [Chatbot Widget] 💬                             │
│            │                                                  │
└────────────┴──────────────────────────────────────────────────┘
```

**Features Available:**
- Filter schemes by category
- Search for specific schemes
- View scheme details
- Apply for schemes (7-step process)
- Multilingual support
- Voice-enabled chatbot
- Logout button (top-right corner)

---

## 🔑 Key Features Implemented

### ✅ Authentication Check

The app checks for saved tokens on startup:

```javascript
// In App.js
useEffect(() => {
  const token = localStorage.getItem('accessToken');
  const savedUser = localStorage.getItem('user');
  
  if (token && savedUser) {
    // User is logged in → Show Dashboard
    setIsAuthenticated(true);
  } else {
    // User not logged in → Show Login Page
    setIsAuthenticated(false);
  }
}, []);
```

### ✅ Login Success Handler

After OTP verification, tokens are saved:

```javascript
// OTPLogin component saves:
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('user', JSON.stringify(user));

// Then triggers callback
onLoginSuccess(user); // → Sets isAuthenticated = true
```

### ✅ Logout Button

Dashboard now includes a logout button:

```
Header: [Language] [Hello User] [🚪 Logout]
                                    ↑
                                Click to logout
```

**Clicking logout:**
1. Clears tokens from localStorage
2. Clears user data
3. Redirects to login page

---

## 🧪 Testing the Flow

### Test 1: Fresh Login

1. **Open app:** `http://localhost:3000`
2. **See:** OTP Login page ✅
3. **Enter phone:** `9876543210`
4. **Click:** "Send OTP"
5. **Check logs:** Backend shows OTP code
6. **Enter OTP:** Paste code from backend logs
7. **Click:** "Verify OTP"
8. **See:** Dashboard appears ✅

### Test 2: Persistent Login

1. **After logging in:** Refresh the page (F5)
2. **Expected:** Dashboard loads directly (no login page)
3. **Reason:** Token saved in localStorage

### Test 3: Logout

1. **On dashboard:** Click "🚪 Logout" button (top-right)
2. **Expected:** Redirects to OTP login page
3. **localStorage:** Tokens cleared
4. **Verify:** `localStorage.getItem('accessToken')` returns `null` in console

### Test 4: Mobile Responsiveness

1. **Desktop:** App looks professional
2. **Mobile:** 
   - Open DevTools (F12)
   - Click Device Toggle (mobile icon)
   - Resize to mobile width
   - All elements should be responsive

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── App.js ← Main routing logic
│   ├── components/
│   │   └── OTPLogin.jsx ← Login page
│   └── pages/
│       └── ProfessionalDashboard.jsx ← Dashboard (updated with logout)
└── package.json
```

### Key Changes Made

1. **App.js**: Already had login/dashboard routing ✅
2. **OTPLogin.jsx**: Redesigned with real API calls ✅
3. **ProfessionalDashboard.jsx**: Added logout button ✅

---

## 🔐 Security Features

- ✅ Tokens stored in localStorage (accessible only via JavaScript)
- ✅ OTP expires after 10 minutes
- ✅ Max 5 verification attempts
- ✅ Phone validation (10-digit format)
- ✅ Automatic logout on token expiry (can be enhanced)

---

## 🐛 Troubleshooting

### "Stuck on Loading Screen"

**Problem:** App shows "Checking authentication..." forever

**Solutions:**
1. Check backend is running: `npm start` in `/backend`
2. Check browser console for errors (F12)
3. Clear localStorage: 
   ```javascript
   localStorage.clear(); // In console
   location.reload(); // Then refresh
   ```

### "Login doesn't work"

**Problem:** Click "Send OTP" but nothing happens

**Solutions:**
1. Check backend URL in `OTPLogin.jsx`: Should be `http://localhost:5000/api/v1/auth`
2. Check MongoDB is running
3. Check backend logs for errors
4. Try with development mode (OTP_PROVIDER=development in .env)

### "After login, stuck on login page"

**Problem:** OTP verifies successfully but dashboard doesn't load

**Solutions:**
1. Check browser console for errors (F12)
2. Check localStorage: `localStorage.getItem('accessToken')` should have a value
3. Check `onLoginSuccess` callback is being called
4. Verify ProfessionalDashboard imports are correct

### "Logout button not visible"

**Problem:** Can't see logout button in header

**Solutions:**
1. Check browser is updated (F5 to force refresh)
2. Check header is displaying correctly (check React DevTools)
3. Verify ProfessionalDashboard.jsx has the logout button code

---

## 💡 Tips

1. **Development Mode:**
   - Use `OTP_PROVIDER=development` in backend `.env`
   - OTP shows in backend logs (no SMS costs)

2. **Check Login State:**
   ```javascript
   // In browser console (F12)
   localStorage.getItem('accessToken')
   localStorage.getItem('user')
   ```

3. **Clear Cache if Issues:**
   ```javascript
   // Browser console
   localStorage.clear();
   location.reload();
   ```

4. **Monitor Backend:**
   ```bash
   # In another terminal, watch backend logs
   tail -f backend.log
   ```

---

## 📊 User Flow Summary

| Step | Screen | Action | Expected Result |
|------|--------|--------|-----------------|
| 1 | Login | Enter phone | Phone stored |
| 2 | Login | Send OTP | OTP generated, sent |
| 3 | Login | Enter OTP | OTP validated |
| 4 | Dashboard | Auto-loaded | User logged in |
| 5 | Dashboard | Click Logout | Redirects to login |
| 6 | Login | Refresh page | Shows login (no cache) |

---

## ✅ Success Criteria

You're done when:
- ✅ Opening app shows login page
- ✅ Can send OTP successfully
- ✅ Can verify OTP and login
- ✅ Dashboard loads after login
- ✅ Logout button works
- ✅ Refreshing page keeps you logged in
- ✅ No console errors

---

## 🚀 Next Steps (Optional)

1. **Add Email Notifications** - Send login confirmations
2. **SMS Notifications** - Real SMS via MSG91/Twilio
3. **Two-Factor Authentication** - Extra security
4. **Session Timeout** - Auto-logout after inactivity
5. **Remember Me** - Extended session duration

---

**Last Updated:** 2024 | **Status:** ✅ Ready to Use

---

## 🎬 Quick Commands

Start everything:

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend  
npm start

# Opens http://localhost:3000 automatically
```

Done! Your app is ready to use. 🎉
