const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (use database in production)
const otpStore = new Map();
const userStore = new Map();

// Helper Functions
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      phone: user.phone, 
      name: user.name,
      email: user.email,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ==================== AUTHENTICATION ROUTES ====================

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { phone, type = 'login' } = req.body;
  
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid 10-digit phone number required' 
    });
  }
  
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  // Store OTP
  otpStore.set(phone, { otp, expiresAt, attempts: 0, type });
  
  // Auto cleanup after 10 minutes
  setTimeout(() => {
    if (otpStore.has(phone)) {
      otpStore.delete(phone);
    }
  }, 10 * 60 * 1000);
  
  // Check if user exists for login type
  let userExists = userStore.has(phone);
  
  if (type === 'login' && !userExists) {
    return res.status(404).json({
      success: false,
      message: 'User not found. Please register first.'
    });
  }
  
  console.log(`📱 OTP for ${phone}: ${otp}`);
  
  res.json({
    success: true,
    message: 'OTP sent successfully',
    userExists: userExists,
    ...(process.env.NODE_ENV !== 'production' && { demoOTP: otp })
  });
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, code, name, email, type = 'login' } = req.body;
  
  if (!phone || !code) {
    return res.status(400).json({ 
      success: false, 
      message: 'Phone and OTP are required' 
    });
  }
  
  const storedData = otpStore.get(phone);
  
  if (!storedData) {
    return res.status(400).json({ 
      success: false, 
      message: 'OTP expired or not found. Please request a new OTP.' 
    });
  }
  
  if (storedData.expiresAt < Date.now()) {
    otpStore.delete(phone);
    return res.status(400).json({ 
      success: false, 
      message: 'OTP has expired. Please request a new OTP.' 
    });
  }
  
  if (storedData.attempts >= 5) {
    otpStore.delete(phone);
    return res.status(400).json({ 
      success: false, 
      message: 'Too many failed attempts. Please request a new OTP.' 
    });
  }
  
  if (storedData.otp !== code) {
    storedData.attempts++;
    otpStore.set(phone, storedData);
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid OTP. Please try again.' 
    });
  }
  
  // OTP verified successfully
  otpStore.delete(phone);
  
  // Get or create user
  let user = userStore.get(phone);
  
  if (!user && type === 'verification') {
    // Register new user
    user = {
      id: `user_${Date.now()}_${phone}`,
      phone: phone,
      name: name || `User_${phone.slice(-4)}`,
      email: email || '',
      role: 'user',
      createdAt: new Date().toISOString(),
      isVerified: true
    };
    userStore.set(phone, user);
    console.log(`✅ New user registered: ${phone}`);
  } else if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found. Please register first.'
    });
  } else {
    console.log(`✅ User logged in: ${phone}`);
  }
  
  // Generate JWT tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  // Store refresh token
  user.refreshToken = refreshToken;
  userStore.set(phone, user);
  
  res.json({
    success: true,
    message: type === 'verification' ? 'Registration successful!' : 'Login successful!',
    data: {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
});

// Refresh Token
app.post('/api/auth/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Find user by id
    let foundUser = null;
    for (const [key, value] of userStore) {
      if (value.id === decoded.id) {
        foundUser = value;
        break;
      }
    }
    
    if (!foundUser || foundUser.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    
    const newAccessToken = generateAccessToken(foundUser);
    
    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

// Logout
app.post('/api/auth/logout', verifyToken, async (req, res) => {
  const user = userStore.get(req.user.phone);
  if (user) {
    delete user.refreshToken;
    userStore.set(req.user.phone, user);
  }
  
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get User Profile
app.get('/api/auth/profile', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      phone: req.user.phone,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Check User Exists
app.post('/api/auth/check-user', async (req, res) => {
  const { phone } = req.body;
  const exists = userStore.has(phone);
  
  res.json({
    success: true,
    exists: exists
  });
});

// ==================== SCHEMES & CHATBOT ROUTES ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      ml: process.env.ML_SERVICE_URL || 'http://localhost:5001'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Government Schemes API is running',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'POST /api/auth/send-otp',
      'POST /api/auth/verify-otp',
      'POST /api/auth/refresh-token',
      'POST /api/auth/logout',
      'GET /api/auth/profile',
      'GET /api/schemes',
      'POST /api/chatbot/query'
    ]
  });
});

// Get all schemes
app.get('/api/schemes', async (req, res) => {
  try {
    const mlResponse = await axios.post('http://localhost:5001/search', {
      query: 'schemes',
      top_k: 10
    }).catch(() => ({ data: { results: [] } }));
    
    const schemes = mlResponse.data.results || [];
    
    res.json({
      success: true,
      schemes: schemes,
      count: schemes.length
    });
  } catch (error) {
    console.error('Error fetching schemes:', error.message);
    res.json({
      success: true,
      schemes: [
        { scheme_name: 'PM-KISAN', description: 'Financial support for farmers', benefits: '₹6000/year', eligibility: 'Small farmers' },
        { scheme_name: 'Scholarship Scheme', description: 'Education support for students', benefits: 'Up to ₹50000', eligibility: 'Meritorious students' },
        { scheme_name: 'Health Scheme', description: 'Medical insurance for families', benefits: '₹5 lakh cover', eligibility: 'BPL families' }
      ],
      count: 3,
      source: 'sample'
    });
  }
});

// Chatbot query endpoint
app.post('/api/chatbot/query', async (req, res) => {
  const startTime = Date.now();
  const { query, sessionId } = req.body;
  
  if (!query) {
    return res.status(400).json({ 
      success: false, 
      error: 'Query is required' 
    });
  }
  
  console.log(`📝 Processing query: "${query}"`);
  
  try {
    const mlResponse = await axios.post('http://localhost:5001/search', {
      query: query,
      top_k: 5,
      threshold: 0.2
    });
    
    const recommendations = mlResponse.data.results || [];
    console.log(`✅ Found ${recommendations.length} recommendations`);
    
    let message = '';
    if (recommendations.length === 0) {
      message = "I couldn't find specific schemes matching your query. Could you please rephrase or try different keywords? For example: 'farmers', 'education', 'health insurance'";
    } else {
      message = `I found ${recommendations.length} scheme(s) that might be relevant for you:\n\n`;
      recommendations.slice(0, 3).forEach((scheme, idx) => {
        message += `${idx + 1}. **${scheme.scheme_name}**\n`;
        if (scheme.description) message += `   ${scheme.description.substring(0, 100)}\n`;
        if (scheme.benefits) message += `   Benefits: ${scheme.benefits}\n`;
        message += `\n`;
      });
      message += `Would you like more details about any of these schemes?`;
    }
    
    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Response time: ${responseTime}ms`);
    
    res.json({
      success: true,
      message: message,
      schemes: recommendations,
      intent: detectIntent(query),
      responseTime: responseTime,
      sessionId: sessionId || `session_${Date.now()}`
    });
    
  } catch (error) {
    console.error(`❌ ML Service error:`, error.message);
    res.json({
      success: true,
      message: "I'm here to help you find government schemes. Please try asking about specific categories like 'farmers', 'students', 'women', 'health', or 'education'.",
      schemes: [],
      intent: 'general',
      fallback: true
    });
  }
});

// Intent detection helper
function detectIntent(query) {
  const q = query.toLowerCase();
  if (q.includes('eligib') || q.includes('who can') || q.includes('criteria')) return 'eligibility';
  if (q.includes('benefit') || q.includes('get') || q.includes('receive')) return 'benefits';
  if (q.includes('apply') || q.includes('process') || q.includes('how to')) return 'application';
  if (q.includes('document') || q.includes('need') || q.includes('require')) return 'documents';
  if (q.includes('amount') || q.includes('money') || q.includes('financial')) return 'amount';
  return 'general';
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Backend Server Started`);
  console.log('='.repeat(50));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📡 ML Service: ${process.env.ML_SERVICE_URL || 'http://localhost:5001'}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log(`🔐 OTP Auth: http://localhost:${PORT}/api/auth`);
  console.log(`💬 Chatbot: http://localhost:${PORT}/api/chatbot/query`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});