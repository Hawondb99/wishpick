import { useState } from 'react';
import { supabase } from '../supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setMessage('이메일과 비밀번호를 입력해주세요!');
      return;
    }
    setLoading(true);
    setMessage('');

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage('오류: ' + error.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          name: name || email.split('@')[0],
        });
        setMessage('✅ 가입 완료! 이메일을 확인해주세요.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setMessage('❌ 이메일 또는 비밀번호가 틀렸어요.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🎁</div>
        <h1 style={styles.title}>위시픽</h1>
        <p style={styles.sub}>받고 싶은 선물을 공유해요</p>

        {isSignUp && (
          <input
            style={styles.input}
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          style={styles.input}
          placeholder="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
        />

        {message && <p style={styles.message}>{message}</p>}

        <button style={styles.btn} onClick={handleAuth} disabled={loading}>
          {loading ? '⏳ 처리 중...' : isSignUp ? '🎉 회원가입' : '🔑 로그인'}
        </button>

        <button
          style={styles.toggle}
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage('');
          }}
        >
          {isSignUp
            ? '이미 계정이 있어요 → 로그인'
            : '계정이 없어요 → 회원가입'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background:
      'linear-gradient(160deg, #FDF2F8 0%, #EDE9FE 50%, #FFF7ED 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: 'white',
    borderRadius: '24px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '360px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
  logo: { fontSize: '56px', marginBottom: '12px' },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 6px',
    color: '#111827',
  },
  sub: { fontSize: '14px', color: '#6B7280', marginBottom: '28px' },
  input: {
    width: '100%',
    padding: '13px 16px',
    marginBottom: '12px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '14px',
    marginTop: '4px',
    background: 'linear-gradient(135deg, #F472B6, #A78BFA)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  toggle: {
    marginTop: '16px',
    background: 'none',
    border: 'none',
    color: '#A78BFA',
    fontSize: '13px',
    cursor: 'pointer',
  },
  message: { fontSize: '13px', color: '#EF4444', margin: '8px 0' },
};
