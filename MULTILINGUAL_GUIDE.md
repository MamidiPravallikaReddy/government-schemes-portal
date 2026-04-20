# Multilingual Support Setup Guide

## Overview
Your project now has full multilingual support using **i18next**, a powerful internationalization framework. It currently supports:
- 🇬🇧 English (en)
- 🇮🇳 Hindi (hi)
- 🇮🇳 Tamil (ta)
- 🇮🇳 Telugu (te)

## Project Structure

```
frontend/
├── src/
│   ├── config/
│   │   └── i18n.js              # Main i18n configuration
│   ├── locales/                 # Translation files
│   │   ├── en.json              # English translations
│   │   ├── hi.json              # Hindi translations
│   │   ├── ta.json              # Tamil translations
│   │   └── te.json              # Telugu translations
│   ├── components/
│   │   └── LanguageSelector.jsx # Language dropdown
│   ├── context/
│   │   └── LanguageContext.jsx  # Language context for state management
│   ├── pages/
│   │   └── ProfessionalDashboard.jsx # Example using translations
│   ├── App.js                   # App entry point
│   └── index.js                 # React root
```

## How It Works

### 1. **Translation Files** (`src/locales/`)
Each JSON file contains key-value pairs for translations:

```json
{
  "dashboard": {
    "title": "Govt Schemes AI Dashboard",
    "available_schemes": "Schemes Available"
  },
  "search": {
    "placeholder": "Search schemes...",
    "button": "Search"
  }
}
```

### 2. **Language Selector** 
Users can change language using the dropdown in the header:
- Located at: `src/components/LanguageSelector.jsx`
- Language preference is saved to `localStorage`
- Automatically detects browser language on first visit

### 3. **Using Translations in Components**

#### Method 1: Using `useTranslation()` Hook (Recommended)
```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('search.placeholder')}</p>
    </div>
  );
}
```

#### Method 2: Using Translation Variables
```jsx
const { t, i18n } = useTranslation();

// Get current language
console.log(i18n.language); // 'en', 'hi', 'ta', 'te'

// Change language
i18n.changeLanguage('hi');

// Translate with parameters
<h1>{t('welcome', { name: 'John' })}</h1>
// Add to translations: "welcome": "Hello, {{name}}"
```

## Adding a New Language

### Step 1: Create Translation File
Create `src/locales/[language-code].json`

Example for Gujarati (`gu.json`):
```json
{
  "dashboard": {
    "title": "સરકારી યોજનાઓ AI ડેશબોર્ડ",
    "available_schemes": "ઉપલબ્ધ યોજનાઓ"
  },
  "sidebar": {
    "government_schemes": "સરકારી યોજનાઓ",
    "find_schemes": "તમારી જરૂરિયાતો સાથે મેળ ખાતી યોજનાઓ શોધો"
  }
  // ... more translations
}
```

### Step 2: Update i18n Config
Edit `src/config/i18n.js`:

```javascript
import gu from './locales/gu.json';

i18n.init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ta: { translation: ta },
    te: { translation: te },
    gu: { translation: gu }  // Add new language
  }
});
```

### Step 3: Update Language Selector
Edit `src/components/LanguageSelector.jsx`:

```javascript
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' }  // Add here
];
```

## Adding Translation Keys to Components

### Example: Translating ProfessionalDashboard

**Before:**
```jsx
<h1>Govt Schemes AI Dashboard</h1>
<input placeholder="Search schemes by name, benefits, or eligibility..." />
<button>Search</button>
```

**After:**
```jsx
import { useTranslation } from 'react-i18next';

function ProfessionalDashboard() {
  const { t } = useTranslation();
  
  return (
    <>
      <h1>{t('dashboard.title')}</h1>
      <input placeholder={t('search.placeholder')} />
      <button>{t('search.button')}</button>
    </>
  );
}
```

## Best Practices

### 1. **Organize Translation Keys Hierarchically**
```json
{
  "sections": {
    "subsection": {
      "key": "value"
    }
  }
}
```

### 2. **Use Namespaces for Large Projects**
```jsx
const { t } = useTranslation('dashboard');
// Access: t('title') instead of t('dashboard.title')
```

### 3. **Handle Missing Translations Gracefully**
```jsx
const { t, i18n } = useTranslation();

useEffect(() => {
  // Fallback to English if translation doesn't exist
  i18n.setDefaultNamespace('translation');
}, [i18n]);
```

### 4. **Use Pluralization**
```json
{
  "item_count": {
    "one": "1 scheme found",
    "other": "{{count}} schemes found"
  }
}
```

### 5. **Context/Variable Support**
```json
{
  "greeting": "Hello, {{name}}! Welcome to {{platform}}"
}
```

Usage:
```jsx
{t('greeting', { name: 'John', platform: 'Government Schemes Portal' })}
```

## Translation Checklist

For a complete implementation, translate:
- ✅ Dashboard headers and titles
- ✅ Navigation menus
- ✅ Form labels and placeholders
- ✅ Button labels
- ✅ Error messages
- ✅ Success messages
- ✅ Tooltips and help text
- ✅ Category names
- ✅ Scheme information
- ✅ Chatbot messages

## Testing Languages

1. **Change Language:** Click the language selector in the header
2. **Verify Storage:** Check `localStorage.getItem('preferredLanguage')`
3. **Browser Persistence:** Reload page - language should persist
4. **Default Language:** Clear localStorage, language should default to English or browser language

## Performance Optimization

- Translations are loaded once on app initialization
- Language switching is instant (no reload needed)
- Supported for RTL languages (Arabic, Urdu) with automatic direction detection

## Common Issues & Solutions

### Issue: Translations not showing
**Solution:** Ensure:
1. Translation file exists in `src/locales/`
2. Language code matches in `i18n.js` resources
3. Component uses `useTranslation()` hook
4. Translation key exists in JSON file

### Issue: Wrong language after page reload
**Solution:** Check localStorage is not cleared by browser settings

### Issue: Missing translations in some languages
**Solution:** Use same keys in all language files; add fallback translations

## Next Steps

1. Add remaining language translations for all components
2. Set up a translation management system for non-technical users
3. Consider using **i18next-backend** for dynamic translation loading
4. Implement **i18next-browser-languagedetector** for smart language detection
5. Add RTL language support (Arabic, Urdu, Persian) if needed

## Useful Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next GitHub](https://github.com/i18next/i18next)
- [Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

## Support for Additional Indian Languages

You can easily add support for:
- 🇮🇳 Marathi (mr)
- 🇮🇳 Kannada (kn)
- 🇮🇳 Malayalam (ml)
- 🇮🇳 Punjabi (pa)
- 🇮🇳 Odia (or)
- 🇮🇳 Bengali (bn)

Follow the same steps as adding Gujarati above.
