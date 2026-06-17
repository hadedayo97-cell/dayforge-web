import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/hooks/useAuth';
import { Bell, Clock, Check, Trash2, X, CalendarClock } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  payload: {
    title?: string;
    message?: string;
    task_id?: string;
    goal_id?: string;
  };
  send_at: string;
  sent_at: string | null;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  created_at: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id);
    
    // Sort: scheduled first (by send_at ascending), then sent/failed (by sent_at descending)
    const sorted = (data ?? []).sort((a: Notification, b: Notification) => {
      if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
      if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
      return new Date(b.send_at).getTime() - new Date(a.send_at).getTime();
    });
    
    setNotifications(sorted);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) loadNotifications();
  }, [isOpen, user]);

  const handleDismiss = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ status: 'cancelled' })
      .eq('id', id);
    loadNotifications();
  };

  const handleDelete = async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    loadNotifications();
  };

  const handleClearAll = async () => {
    // Delete all sent/cancelled/failed
    const toDelete = notifications.filter(n => n.status !== 'scheduled');
    for (const n of toDelete) {
      await supabase.from('notifications').delete().eq('id', n.id);
    }
    loadNotifications();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);

    if (diffMin > 0 && diffMin < 60) return `in ${diffMin}m`;
    if (diffHrs > 0 && diffHrs < 24) return `in ${diffHrs}h`;
    if (diffMin < 0 && diffMin > -60) return `${Math.abs(diffMin)}m ago`;
    if (diffHrs < 0 && diffHrs > -24) return `${Math.abs(diffHrs)}h ago`;

    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
    scheduled: { color: 'var(--primary-color)', bg: 'var(--primary-glow)', label: 'Upcoming' },
    sent:      { color: 'var(--success-color)', bg: 'rgba(16, 185, 129, 0.1)', label: 'Sent' },
    failed:    { color: 'var(--error-color)',   bg: 'rgba(239, 68, 68, 0.1)',  label: 'Failed' },
    cancelled: { color: 'var(--text-muted)',    bg: 'rgba(255,255,255,0.03)',   label: 'Dismissed' }
  };

  const scheduledCount = notifications.filter(n => n.status === 'scheduled').length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 998,
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        maxWidth: '100vw',
        height: '100vh',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-color)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
        animation: 'slideInRight 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="var(--primary-color)" />
            <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>Notifications</h3>
            {scheduledCount > 0 && (
              <span style={{
                background: 'var(--primary-color)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px'
              }}>{scheduledCount}</span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '0.9rem' }}>Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CalendarClock size={40} style={{ opacity: 0.4 }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>No notifications yet</p>
              <p style={{ fontSize: '0.82rem' }}>
                Reminders you set on tasks and goals will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map(n => {
                const style = statusStyles[n.status];
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      opacity: n.status === 'cancelled' ? 0.5 : 1,
                      transition: 'opacity var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          color: style.color,
                          background: style.bg
                        }}>{style.label}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Clock size={10} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                          {formatDate(n.send_at)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {n.status === 'scheduled' && (
                          <button
                            onClick={() => handleDismiss(n.id)}
                            title="Dismiss"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          title="Delete"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {n.payload?.title || n.type}
                    </p>
                    {n.payload?.message && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {n.payload.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.filter(n => n.status !== 'scheduled').length > 0 && (
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button
              className="btn btn-secondary"
              onClick={handleClearAll}
              style={{ fontSize: '0.82rem', padding: '6px 16px' }}
            >
              Clear history
            </button>
          </div>
        )}
      </div>
    </>
  );
}
