// EXAMPLE: How to Translate the Chatbot Component
// File: src/components/Chatbot.jsx

// BEFORE (Without Translation)
/*
import React from 'react';

const Chatbot = ({ isOpen, onClose, user }) => {
  return (
    <div>
      <h2>Scheme Assistant</h2>
      <p>Hello! I can help you find government schemes. Ask me anything!</p>
      <input placeholder="Type your question..." />
      <button>Send</button>
    </div>
  );
};
*/

// AFTER (With Translation)
import React from 'react';
import { useTranslation } from 'react-i18next';

const Chatbot = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('chatbot.title')}</h2>
      <p>{t('chatbot.welcome')}</p>
      <input placeholder={t('chatbot.placeholder')} />
      <button>{t('chatbot.send')}</button>
    </div>
  );
};

export default Chatbot;

// ====================================
// STEP 1: Add Translation Keys to en.json
// ====================================
/*
File: src/locales/en.json

{
  "chatbot": {
    "title": "Scheme Assistant",
    "welcome": "Hello! I can help you find government schemes. Ask me anything!",
    "placeholder": "Type your question...",
    "send": "Send"
  }
}
*/

// ====================================
// STEP 2: Add Translation Keys to hi.json
// ====================================
/*
File: src/locales/hi.json

{
  "chatbot": {
    "title": "योजना सहायक",
    "welcome": "नमस्ते! मैं आपको सरकारी योजनाएं खोजने में मदद कर सकता हूं।",
    "placeholder": "अपना प्रश्न लिखें...",
    "send": "भेजें"
  }
}
*/

// ====================================
// STEP 3: Add Translation Keys to ta.json
// ====================================
/*
File: src/locales/ta.json

{
  "chatbot": {
    "title": "திட்ட உதவியாளர்",
    "welcome": "வணக்கம்! அரசு திட்டங்களைக் கண்டறிய உங்களுக்கு உதவ முடியும்.",
    "placeholder": "உங்கள் கேள்வியை தட்டவும்...",
    "send": "அனுப்பவும்"
  }
}
*/

// ====================================
// STEP 4: Add Translation Keys to te.json
// ====================================
/*
File: src/locales/te.json

{
  "chatbot": {
    "title": "పథక సహాయకుడు",
    "welcome": "హలో! ప్రభుత్వ పథకాలను కనుగొనడంలో మీకు సహాయం చేయవచ్చు.",
    "placeholder": "మీ ప్రశ్నను టైప్ చేయండి...",
    "send": "పంపించు"
  }
}
*/

// ====================================
// EXAMPLE 2: OTPLogin Component
// ====================================
/*
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const OTPLogin = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    try {
      // API call
      setOtpSent(true);
    } catch (err) {
      setError(t('auth.error.send_otp')); // Translation key for error
    }
  };

  const handleVerifyOTP = async () => {
    try {
      // API call
      if (success) {
        // Success message
      }
    } catch (err) {
      setError(t('auth.error.invalid_otp')); // Translation key for error
    }
  };

  return (
    <div>
      <h1>{t('auth.title')}</h1>
      <p>{t('auth.subtitle')}</p>
      
      {!otpSent ? (
        <>
          <label>{t('auth.phone_label')}</label>
          <input 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('auth.phone_placeholder')}
          />
          <button onClick={handleSendOTP}>
            {t('auth.send_otp_btn')}
          </button>
        </>
      ) : (
        <>
          <label>{t('auth.otp_label')}</label>
          <input 
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t('auth.otp_placeholder')}
          />
          <button onClick={handleVerifyOTP}>
            {t('auth.verify_btn')}
          </button>
        </>
      )}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default OTPLogin;

// Translations needed in all locale files:
{
  "auth": {
    "title": "OTP Login",
    "subtitle": "Enter your phone number to login",
    "phone_label": "Phone Number",
    "phone_placeholder": "+91 XXXXXXXXXX",
    "send_otp_btn": "Send OTP",
    "otp_label": "Enter OTP",
    "otp_placeholder": "Enter 6-digit OTP",
    "verify_btn": "Verify",
    "error": {
      "send_otp": "Failed to send OTP",
      "invalid_otp": "Invalid OTP entered"
    }
  }
}
*/

// ====================================
// EXAMPLE 3: Using useTranslation with Parameters
// ====================================
/*
import { useTranslation } from 'react-i18next';

function SchemeCard({ scheme, count }) {
  const { t } = useTranslation();
  
  return (
    <div>
      <h3>{scheme.name}</h3>
      
      // Simple translation
      <p>{t('scheme.benefits')}</p>
      
      // With parameters
      <p>{t('scheme.count', { count: count })}</p>
      
      // With multiple parameters
      <p>{t('scheme.info', { 
        category: scheme.category,
        benefits: scheme.benefits 
      })}</p>
    </div>
  );
}

// Corresponding translation keys:
{
  "scheme": {
    "benefits": "Benefits",
    "count": "Found {{count}} schemes",
    "info": "Category: {{category}}, Benefits: {{benefits}}"
  }
}

// In Hindi (hi.json):
{
  "scheme": {
    "benefits": "लाभ",
    "count": "{{count}} योजनाएं मिलीं",
    "info": "श्रेणी: {{category}}, लाभ: {{benefits}}"
  }
}
*/

// ====================================
// EXAMPLE 4: Pluralization
// ====================================
/*
// In translation file:
{
  "schemes_found": {
    "one": "1 scheme found",
    "other": "{{count}} schemes found"
  }
}

// In component:
const { t } = useTranslation();
<p>{t('schemes_found', { count: count })}</p>
*/

// ====================================
// EXAMPLE 5: Language-specific Formatting
// ====================================
/*
import { useTranslation } from 'react-i18next';

function DateDisplay({ date }) {
  const { i18n } = useTranslation();
  
  const formatDate = (d) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(d).toLocaleDateString(i18n.language, options);
  };
  
  return <p>{formatDate(date)}</p>;
}

// Output examples:
// English: January 15, 2024
// Hindi: 15 जनवरी 2024
// Tamil: 15 ஜனவரி 2024
*/

// ====================================
// EXAMPLE 6: Conditional Rendering Based on Language
// ====================================
/*
import { useTranslation } from 'react-i18next';

function RTLCheck() {
  const { i18n } = useTranslation();
  
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  
  return (
    <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Content */}
    </div>
  );
}
*/

// ====================================
// QUICK REFERENCE: Translation Pattern
// ====================================
/*
1. Import hook:
   import { useTranslation } from 'react-i18next';

2. Use in component:
   const { t, i18n } = useTranslation();

3. Add keys to all locale files

4. Use in JSX:
   <h1>{t('section.key')}</h1>

5. Test by changing language

6. Verify all text is translated
*/
