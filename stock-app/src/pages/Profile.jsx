import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, Shield, User, Settings2, Mail, Phone, Moon, Sun, Globe, Bell } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Switch from '../components/ui/Switch';
import { useAuth } from '../context/AuthContext';
import {
  getMe,
  updateMe,
  changePassword,
  listApiKeys,
  createApiKey,
  revokeApiKey
} from '../api/profileApi';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Toasts = ({ items, onRemove }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {items.map((toast) => (
      <div
        key={toast.id}
        className={`px-4 py-3 rounded-xl text-sm border shadow-lg ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
        }`}
        onClick={() => onRemove(toast.id)}
      >
        {toast.message}
      </div>
    ))}
  </div>
);

const SkeletonLine = ({ className = '' }) => (
  <div className={`h-4 bg-white/10 rounded ${className}`} />
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="p-2 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-lg shadow-lg shadow-emerald-500/20">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h2 className="text-xl font-bold text-white">{title}</h2>
  </div>
);

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'en',
    notifications: {
      emailAlerts: true,
      priceAlerts: true,
      newsUpdates: true,
      twoFactor: false
    }
  });
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [createdKey, setCreatedKey] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: ''
  });

  useEffect(() => {
    if (user) {
      setUserId(user.id || '');
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setMemberSince(user.memberSince || '');
      if (user.preferences) {
        setPreferences(user.preferences);
      }
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [me, keys] = await Promise.all([getMe(), listApiKeys()]);
        setUserId(me.id);
        setFullName(me.fullName || '');
        setEmail(me.email || '');
        setPhone(me.phone || '');
        setMemberSince(me.memberSince || '');
        setPreferences(me.preferences || preferences);
        setApiKeys(keys || []);
        if (setUser) {
          setUser(me);
        }
      } catch (err) {
        addToast('error', err.message || 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const isDark = preferences.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [preferences.theme]);

  useEffect(() => {
    const nextLang = preferences.language || 'en';
    if (i18n.language !== nextLang) {
      i18n.changeLanguage(nextLang);
      document.documentElement.setAttribute('lang', nextLang);
      document.documentElement.setAttribute('dir', nextLang === 'he' ? 'rtl' : 'ltr');
    }
  }, [preferences.language, i18n]);

  const addToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const emailError = useMemo(() => {
    if (!email) return 'Email is required.';
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    return '';
  }, [email]);

  const passwordErrors = useMemo(() => {
    const errors = {};
    if (passwords.next && passwords.next.length < 8) {
      errors.next = 'Password must be at least 8 characters.';
    }
    if (passwords.next && passwords.confirm && passwords.next !== passwords.confirm) {
      errors.confirm = 'Passwords do not match.';
    }
    return errors;
  }, [passwords]);

  const handleProfileSave = async () => {
    if (emailError) {
      addToast('error', emailError);
      return;
    }
    setSavingProfile(true);
    try {
      const payload = {
        fullName,
        email,
        phone,
        preferences
      };
      const updated = await updateMe(payload);
      setFullName(updated.fullName || '');
      setEmail(updated.email || '');
      setPhone(updated.phone || '');
      setPreferences(updated.preferences || preferences);
      if (setUser) {
        setUser(updated);
      }
      addToast('success', 'Profile updated successfully.');
    } catch (err) {
      addToast('error', err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordErrors.next || passwordErrors.confirm) {
      addToast('error', passwordErrors.next || passwordErrors.confirm);
      return;
    }
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      addToast('error', 'Please fill in all password fields.');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.next
      });
      setPasswords({ current: '', next: '', confirm: '' });
      addToast('success', 'Password updated successfully.');
    } catch (err) {
      addToast('error', err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyLabel.trim()) {
      addToast('error', 'Key label is required.');
      return;
    }
    setKeyLoading(true);
    try {
      const created = await createApiKey({ label: newKeyLabel.trim() });
      setCreatedKey(created.key || '');
      setNewKeyLabel('');
      const keys = await listApiKeys();
      setApiKeys(keys || []);
      addToast('success', 'API key created.');
    } catch (err) {
      addToast('error', err.message || 'Failed to create API key.');
    } finally {
      setKeyLoading(false);
    }
  };

  const handleRevokeKey = async (id) => {
    setKeyLoading(true);
    try {
      await revokeApiKey(id);
      const keys = await listApiKeys();
      setApiKeys(keys || []);
      addToast('success', 'API key revoked.');
    } catch (err) {
      addToast('error', err.message || 'Failed to revoke key.');
    } finally {
      setKeyLoading(false);
    }
  };

  const toggleTheme = (value) => {
    setPreferences((prev) => ({
      ...prev,
      theme: value ? 'dark' : 'light'
    }));
  };

  const updateNotification = (key) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen app-bg p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <SkeletonLine className="w-48 mb-3" />
            <SkeletonLine className="w-72" />
          </Card>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <SkeletonLine className="w-40 mb-4" />
              <SkeletonLine className="h-10 mb-3" />
              <SkeletonLine className="h-10 mb-3" />
              <SkeletonLine className="h-10" />
            </Card>
            <Card>
              <SkeletonLine className="w-40 mb-4" />
              <SkeletonLine className="h-10 mb-3" />
              <SkeletonLine className="h-10 mb-3" />
              <SkeletonLine className="h-10" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg p-6 text-white">
      <Toasts items={toasts} onRemove={removeToast} />

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-400 to-amber-300 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">{t('profile.title')}</h1>
            <p className="text-slate-400 text-sm">{t('profile.subtitle')}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-6">
            <Card>
              <SectionHeader icon={User} title={t('profile.profileInfo')} />
              <div className="grid md:grid-cols-2 gap-4">
                <Input label={t('profile.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <div>
                  <Input
                    label={t('profile.email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {emailError && <p className="text-xs text-rose-300 mt-2">{emailError}</p>}
                </div>
                <Input label={t('profile.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label={t('profile.memberSince')} value={memberSince} disabled />
              </div>
              <div className="mt-6">
                <Button className="w-full" onClick={handleProfileSave} disabled={savingProfile}>
                  {savingProfile ? 'Updating...' : t('profile.updateProfile')}
                </Button>
              </div>
            </Card>

            <Card>
              <SectionHeader icon={Shield} title={t('profile.security')} />
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label={t('profile.currentPassword')}
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, current: e.target.value }))}
                />
                <Input
                  label={t('profile.newPassword')}
                  type="password"
                  value={passwords.next}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, next: e.target.value }))}
                />
                <Input
                  label={t('profile.confirmPassword')}
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))}
                />
              </div>
              {(passwordErrors.next || passwordErrors.confirm) && (
                <p className="text-xs text-rose-300 mt-2">
                  {passwordErrors.next || passwordErrors.confirm}
                </p>
              )}
              <div className="mt-6">
                <Button className="w-full" onClick={handlePasswordChange} disabled={savingPassword}>
                  {savingPassword ? 'Changing...' : t('profile.changePassword')}
                </Button>
              </div>
            </Card>

            <Card>
              <SectionHeader icon={KeyRound} title={t('profile.apiKeys')} />
              <div className="space-y-3">
                {apiKeys.length === 0 && (
                  <p className="text-sm text-slate-400">{t('profile.noKeys')}</p>
                )}
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
                  >
                    <div>
                      <p className="text-sm font-semibold">{key.label || 'API Key'}</p>
                      <p className="text-xs text-slate-400">{key.maskedKey}</p>
                      <p className="text-xs text-slate-500">
                        Created {new Date(key.createdAt).toLocaleDateString()} · Last used{' '}
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleRevokeKey(key.id)}
                      disabled={keyLoading}
                    >
                      {t('profile.revoke')}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid md:grid-cols-[1fr_auto] gap-3">
                <Input
                  label={t('profile.newKeyLabel')}
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="Trading Bot"
                />
                <Button onClick={handleCreateKey} disabled={keyLoading}>
                  {keyLoading ? 'Creating...' : t('profile.createKey')}
                </Button>
              </div>

              {createdKey && (
                <div className="mt-4 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  New key (copy now, shown only once): <span className="font-semibold">{createdKey}</span>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <SectionHeader icon={Settings2} title={t('profile.appSettings')} />
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-white">
                    {preferences.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    {t('profile.darkMode')}
                  </div>
                  <Switch checked={preferences.theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Globe className="w-4 h-4" />
                    {t('profile.language')}
                  </div>
                  <select
                    value={preferences.language}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, language: e.target.value }))
                    }
                    className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="en">English</option>
                    <option value="he">Hebrew</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card>
              <SectionHeader icon={Bell} title={t('profile.notifications')} />
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-sm text-white">{t('profile.emailAlerts')}</span>
                  <Switch
                    checked={preferences.notifications.emailAlerts}
                    onCheckedChange={() => updateNotification('emailAlerts')}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-sm text-white">{t('profile.priceAlerts')}</span>
                  <Switch
                    checked={preferences.notifications.priceAlerts}
                    onCheckedChange={() => updateNotification('priceAlerts')}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-sm text-white">{t('profile.newsUpdates')}</span>
                  <Switch
                    checked={preferences.notifications.newsUpdates}
                    onCheckedChange={() => updateNotification('newsUpdates')}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-sm text-white">{t('profile.twoFactor')}</span>
                  <Switch
                    checked={preferences.notifications.twoFactor}
                    onCheckedChange={() => updateNotification('twoFactor')}
                  />
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-400">
                User ID: {userId}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
