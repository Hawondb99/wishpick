import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Auth from './pages/Auth';
import Home from './pages/Home';
import './App.css';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontSize: '32px',
        }}
      >
        🎁
      </div>
    );

  return session ? <Home session={session} /> : <Auth />;
}

export default App;
