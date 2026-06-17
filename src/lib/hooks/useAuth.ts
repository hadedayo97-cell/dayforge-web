import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then((res: any) => {
      setUser(res.data?.session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      // Detect new login: user ID changed (including from null to a user)
      const isNewLogin = prevUserIdRef.current !== currentUser?.id && currentUser?.id;
      
      if ((event === 'SIGNED_IN' || isNewLogin) && currentUser?.id) {
        const hasNotified = sessionStorage.getItem(`df_login_alert_${currentUser.id}`);
        if (!hasNotified) {
          sessionStorage.setItem(`df_login_alert_${currentUser.id}`, 'true');
          try {
            const { error } = await supabase.from('notifications').insert([{
              user_id: currentUser.id,
              type: 'signin',
              payload: {
                title: 'New Sign-In Detected 🔒',
                message: `A new sign-in was detected on your account at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
              },
              send_at: new Date().toISOString(),
              status: 'scheduled'
            }]);
            if (error) {
              console.error('❌ Failed to insert login notification:', error);
            } else {
              console.log('✅ Login notification created');
            }
          } catch (err) {
            console.error('❌ Error creating login notification:', err);
          }
        }
      }
      
      // Update previous user ID for next comparison
      prevUserIdRef.current = currentUser?.id ?? null;
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  /** Sign up with email + password */
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await supabase.auth.signUp({ email, password });
      return result;
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Sign up failed – check your network connection.' } };
    } finally {
      setLoading(false);
    }
  };

  /** Sign in with email + password */
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      return result;
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Sign in failed – check your network connection.' } };
    } finally {
      setLoading(false);
    }
  };

  /** Sign in with Google OAuth */
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      return result;
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Google sign-in failed.' } };
    } finally {
      setLoading(false);
    }
  };

  /** Sign in with magic link (OTP) */
  const signInWithOtp = async (email: string) => {
    setLoading(true);
    try {
      const result = await supabase.auth.signInWithOtp({ email });
      return result;
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Magic link failed.' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    const result = await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    return result;
  };

  return { user, loading, signUp, signIn, signInWithGoogle, signInWithOtp, signOut };
}
