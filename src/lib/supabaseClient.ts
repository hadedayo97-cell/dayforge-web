import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read environment variables (Vite exposes them via import.meta.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient<any, "public", any>;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  // Real Supabase client
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('🌐 Using real Supabase backend →', SUPABASE_URL);
} else {
  console.warn(
    '⚠️ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from .env — falling back to localStorage mock.\n' +
    'Create a .env file next to package.json with:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key'
  );

  // ─── Mock client for offline / local development ──────────────────
  const mockStore = (key: string) => {
    const get = () => JSON.parse(localStorage.getItem(key) || '[]');
    const set = (data: any) => localStorage.setItem(key, JSON.stringify(data));
    return { get, set };
  };

  const tasksStore = mockStore('df_tasks');
  const goalsStore = mockStore('df_goals');
  const notificationsStore = mockStore('df_notifications');
  const profilesStore = mockStore('df_profiles');

  // Simple mock user stored in localStorage
  const getMockUser = () => {
    const raw = localStorage.getItem('df_mock_user');
    return raw ? JSON.parse(raw) : null;
  };

  const setMockUser = (u: any) => {
    if (u) localStorage.setItem('df_mock_user', JSON.stringify(u));
    else localStorage.removeItem('df_mock_user');
  };

  // Auth change listeners
  let authListeners: Array<(event: string, session: any) => void> = [];

  const notifyListeners = (event: string, user: any) => {
    const session = user ? { user } : null;
    authListeners.forEach(cb => cb(event, session));
  };

  const buildQuery = (store: ReturnType<typeof mockStore>) => {
    let filters: Record<string, any> = {};

    const query: any = {
      eq(col: string, val: any) {
        filters[col] = val;
        return query;
      },
      async select(_cols?: string) {
        let data = store.get();
        for (const [k, v] of Object.entries(filters)) {
          data = data.filter((row: any) => row[k] === v);
        }
        return { data, error: null };
      },
      // Simple mock support for .single()
      async single() {
        let data = store.get();
        for (const [k, v] of Object.entries(filters)) {
          data = data.filter((row: any) => row[k] === v);
        }
        return { data: data[0] || null, error: data[0] ? null : { message: 'Row not found' } };
      },
      async insert(records: any[]) {
        const data = store.get();
        const inserted = records.map(r => ({ id: crypto.randomUUID?.() || String(Date.now()), ...r }));
        data.push(...inserted);
        store.set(data);
        return { data: inserted, error: null };
      },
      async update(changes: any) {
        let data = store.get();
        data = data.map((item: any) => {
          let match = true;
          for (const [k, v] of Object.entries(filters)) {
            if (item[k] !== v) match = false;
          }
          return match ? { ...item, ...changes } : item;
        });
        store.set(data);
        return { data: [changes], error: null };
      },
      async delete() {
        let data = store.get();
        data = data.filter((item: any) => {
          for (const [k, v] of Object.entries(filters)) {
            if (item[k] === v) return false;
          }
          return true;
        });
        store.set(data);
        return { data: [], error: null };
      }
    };

    return query;
  };

  const mockFrom = (table: string) => {
    const store =
      table === 'tasks'
        ? tasksStore
        : table === 'notifications'
          ? notificationsStore
          : table === 'profiles'
            ? profilesStore
            : goalsStore;
    return buildQuery(store);
  };

  supabase = {
    from: mockFrom,
    auth: {
      async getSession() {
        const user = getMockUser();
        return { data: { session: user ? { user } : null }, error: null };
      },
      onAuthStateChange(cb: (event: string, session: any) => void) {
        authListeners.push(cb);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners = authListeners.filter(l => l !== cb);
              }
            }
          }
        };
      },
      async signUp({ email, password: _password }: { email: string; password: string }) {
        const user = { id: crypto.randomUUID?.() || String(Date.now()), email };
        setMockUser(user);
        notifyListeners('SIGNED_IN', user);
        return { data: { user }, error: null };
      },
      async signInWithPassword({ email, password: _password }: { email: string; password: string }) {
        const user = getMockUser();
        if (user && user.email === email) {
          notifyListeners('SIGNED_IN', user);
          return { data: { user, session: { user } }, error: null };
        }
        // If no mock user exists, auto-create one (for dev convenience)
        const newUser = { id: crypto.randomUUID?.() || String(Date.now()), email };
        setMockUser(newUser);
        notifyListeners('SIGNED_IN', newUser);
        return { data: { user: newUser, session: { user: newUser } }, error: null };
      },
      async signInWithOtp({ email }: { email: string }) {
        const user = { id: crypto.randomUUID?.() || String(Date.now()), email };
        setMockUser(user);
        notifyListeners('SIGNED_IN', user);
        return { data: {}, error: null };
      },
      async signInWithOAuth({ provider, options: _options }: { provider: string; options?: any }) {
        // Can't do real OAuth in mock – just log it
        console.warn(`Mock: OAuth with "${provider}" is not available offline.`);
        return { data: {}, error: { message: `OAuth (${provider}) requires a real Supabase backend.` } };
      },
      async signOut() {
        setMockUser(null);
        notifyListeners('SIGNED_OUT', null);
        return { error: null };
      }
    },
    // Realtime stubs
    channel(_name: string) {
      return {
        on() { return this; },
        subscribe() { return this; }
      };
    },
    removeChannel(_ch: any) {}
  } as any;

  console.log('🛠️ Using mock Supabase client (localStorage)');
}

export { supabase };
