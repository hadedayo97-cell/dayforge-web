import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { User, Download, Trash2, Sun, Moon, Shield, Bell } from 'lucide-react';

export function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('df_theme') as 'light' | 'dark') || 'dark'
  );
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [fullName, setFullName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setFullName(data.full_name || '');
        setBirthday(data.birthday || '');
      }
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileSuccess(false);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        birthday: birthday || null
      });

    setProfileLoading(false);
    if (!error) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const handleThemeToggle = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('df_theme', newTheme);
  };

  const handleExportData = async () => {
    if (!user) return;
    const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', user.id);
    const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id);
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: { email: user?.email },
      goals: goals ?? [],
      tasks: tasks ?? []
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dayforge-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const handleDeleteAccount = async () => {
    localStorage.clear();
    await signOut();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>Settings</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
        Manage your account, appearance, and data preferences.
      </p>

      {/* Profile card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <User size={18} color="var(--primary-color)" />
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>Profile Settings</h3>
        </div>
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '4px'
          }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Signed in as</p>
            <p style={{ fontWeight: 600 }}>{user?.email ?? 'Guest'}</p>
          </div>

          <div className="input-group">
            <label className="label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
            <input
              type="text"
              className="input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              style={{ padding: '10px 14px' }}
            />
          </div>

          <div className="input-group">
            <label className="label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Birthday</label>
            <input
              type="date"
              className="input"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
              style={{ padding: '10px 14px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <button type="submit" className="btn btn-primary" disabled={profileLoading} style={{ padding: '8px 20px' }}>
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </button>
            {profileSuccess && (
              <span style={{ color: 'var(--success-color)', fontSize: '0.85rem', fontWeight: 600 }}>
                Profile updated successfully!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Appearance */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Sun size={18} color="var(--accent-color)" />
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>Appearance</h3>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => handleThemeToggle('dark')}
            className={theme === 'dark' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Moon size={16} /> Dark Mode
          </button>
          <button
            onClick={() => handleThemeToggle('light')}
            className={theme === 'light' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Sun size={16} /> Light Mode
          </button>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Shield size={18} color="var(--success-color)" />
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>Privacy & Data</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>Export Your Data</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Download all your goals and tasks as a JSON file.
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleExportData}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px', justifyContent: 'center' }}
            >
              <Download size={16} />
              {exportDone ? 'Downloaded!' : 'Export'}
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.04)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>Delete Account</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Permanently delete your account and all associated data.
              </p>
            </div>
            {deleteConfirm ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(false)} style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteAccount} style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
                  Confirm Delete
                </button>
              </div>
            ) : (
              <button
                className="btn btn-danger"
                onClick={() => setDeleteConfirm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Info */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Bell size={18} color="var(--warning-color)" />
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>Notifications</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Email reminders are sent via Postmark/Resend using your Supabase Edge Functions.
          Configure your <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>EMAIL_PROVIDER_API_KEY</code> in your <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>.env</code> file to enable notifications.
        </p>
      </div>
    </div>
  );
}
