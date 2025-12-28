import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google'; 
import { jwtDecode } from "jwt-decode"; 
import '../App.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();

  // --- לוגיקה 1: התחברות רגילה (סיסמה ושם) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const endpoint = isLogin ? 'login' : 'register';
    
    // אם זה הרשמה - שולחים גם אימייל. אם התחברות - רק שם וסיסמה
    const payload = isLogin 
      ? { username, password } 
      : { username, email, password };

    try {
      const response = await fetch(`http://localhost:3001/api/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        handleSuccess(data);
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Server error. Is backend running?');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // פענוח המידע שגוגל שלחו לנו
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google Info:", decoded);

      // שליחת המידע לשרת שלנו ליצירת משתמש/התחברות
      const response = await fetch('http://localhost:3001/api/users/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: decoded.email, 
          username: decoded.name, 
          googleId: decoded.sub 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        handleSuccess(data);
      } else {
        setMessage(data.message || 'Google Login Failed');
      }

    } catch (error) {
      console.error("Google Login Error", error);
      setMessage("Server Error during Google Login");
    }
  };

  // פונקציית עזר לטיפול בהצלחה (משותפת לשניהם)
  const handleSuccess = (userData) => {
    setMessage(`Success! Welcome ${userData.username}`);
    // שמירת המשתמש בזיכרון הדפדפן
    localStorage.setItem('user', JSON.stringify(userData));
    
    // מעבר לדף הבית אחרי שנייה וחצי
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <div className="app-container">
      <h1>{isLogin ? 'Login' : 'Create Account'}</h1>

      <div className="card" style={{ padding: '2rem', width: '300px', margin: '0 auto' }}>
        
        {/* --- הטופס הרגיל --- */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '10px' }}
            required
          />
          
          {/* שדה אימייל - מופיע רק בהרשמה */}
          {!isLogin && (
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '10px' }}
              required
            />
          )}
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px' }}
            required
          />

          <button type="submit" style={{ marginTop: '10px' }}>
            {isLogin ? 'Login 🚀' : 'Register ✨'}
          </button>
        </form>

        {/* --- קו מפריד --- */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#ccc' }}></div>
          <span style={{ padding: '0 10px', color: '#666', fontSize: '0.8rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#ccc' }}></div>
        </div>

        {/* --- כפתור גוגל --- */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('Login Failed');
              setMessage("Google Login Failed");
            }}
            theme="filled_black"
            shape="pill"
            text={isLogin ? "signin_with" : "signup_with"}
          />
        </div>

        {/* --- הודעות שגיאה/הצלחה --- */}
        {message && (
          <div style={{ marginTop: '15px', color: message.includes('Success') ? '#4cc9f0' : '#ff4d4d', fontWeight: 'bold' }}>
            {message}
          </div>
        )}

        {/* --- מעבר בין התחברות להרשמה --- */}
        <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
            }}
            style={{ color: '#646cff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;