import { useEffect, useState } from 'react';
import { LogOut, Sun, Moon, Flame, User, Bell } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { NotificationPanel } from '../domain/NotificationPanel';

interface HeaderProps {
  onNavigateSettings?: () => void;
}

export function Header({}: HeaderProps) {
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('df_theme') as 'light' | 'dark') || 'dark';
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('df_theme', theme);
  }, [theme]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'scheduled');
    setUnreadCount(data?.length || 0);
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // Subscribe to notification changes
    const channel = supabase.channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <header className="glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between',
        padding: '16px 24px',
        borderRadius: '0 0 var(--border-radius-md) var(--border-radius-md)',
        borderTop: 'none',
        marginBottom: '24px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <Flame size={20} color="#ffffff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.4rem',
            letterSpacing: '-0.5px'
          }} className="gradient-text">DayForge</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary btn-icon"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            style={{ width: '40px', height: '40px', borderRadius: '50%' }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setIsNotificationOpen(true)}
                className="btn btn-secondary btn-icon"
                title="Notifications"
                style={{ width: '40px', height: '40px', borderRadius: '50%', position: 'relative' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: 'var(--primary-color)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 6px var(--primary-color)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/settings')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}
              >
                <User size={16} />
                <span style={{ fontSize: '0.85rem' }}>Settings</span>
              </button>
              <button 
                className="btn btn-danger btn-icon" 
                onClick={handleSignOut}
                title="Sign Out"
                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      <NotificationPanel 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </>
  );
}
