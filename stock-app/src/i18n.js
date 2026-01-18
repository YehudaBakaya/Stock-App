import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        stocks: 'Stocks',
        trading: 'Trading',
        portfolio: 'Portfolio',
        profile: 'Profile'
      },
      profile: {
        title: 'Profile & Settings',
        subtitle: 'Manage your personal account and security.',
        profileInfo: 'Profile Information',
        fullName: 'Full Name',
        email: 'Email',
        phone: 'Phone',
        memberSince: 'Member Since',
        updateProfile: 'Update Profile',
        appSettings: 'App Settings',
        darkMode: 'Dark Mode',
        language: 'Language',
        notifications: 'Notifications',
        emailAlerts: 'Email Alerts',
        priceAlerts: 'Price Alerts',
        newsUpdates: 'News Updates',
        twoFactor: 'Two-Factor Auth',
        security: 'Security',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm New Password',
        changePassword: 'Change Password',
        apiKeys: 'Manage API Keys',
        newKeyLabel: 'New Key Label',
        createKey: 'Create Key',
        revoke: 'Revoke',
        noKeys: 'No API keys yet.',
        keyCreated: 'API key created.',
        keyRevoked: 'API key revoked.'
      }
    }
  },
  he: {
    translation: {
      nav: {
        dashboard: 'דשבורד',
        stocks: 'שוק המניות',
        trading: 'טריידינג',
        portfolio: 'תיק השקעות',
        profile: 'פרופיל'
      },
      profile: {
        title: 'פרופיל והגדרות',
        subtitle: 'ניהול חשבון אישי ואבטחה.',
        profileInfo: 'פרטי פרופיל',
        fullName: 'שם מלא',
        email: 'אימייל',
        phone: 'טלפון',
        memberSince: 'חבר מאז',
        updateProfile: 'עדכן פרופיל',
        appSettings: 'הגדרות אפליקציה',
        darkMode: 'מצב כהה',
        language: 'שפה',
        notifications: 'התראות',
        emailAlerts: 'התראות אימייל',
        priceAlerts: 'התראות מחיר',
        newsUpdates: 'עדכוני חדשות',
        twoFactor: 'אימות דו-שלבי',
        security: 'אבטחה',
        currentPassword: 'סיסמה נוכחית',
        newPassword: 'סיסמה חדשה',
        confirmPassword: 'אימות סיסמה',
        changePassword: 'שנה סיסמה',
        apiKeys: 'ניהול מפתחות API',
        newKeyLabel: 'שם מפתח חדש',
        createKey: 'צור מפתח',
        revoke: 'בטל',
        noKeys: 'אין מפתחות API עדיין.',
        keyCreated: 'מפתח API נוצר.',
        keyRevoked: 'מפתח API בוטל.'
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
