import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../Firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from 'firebase/auth';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const lastLoginTime = user.metadata.lastSignInTime;
        const lastLoginDate = new Date(lastLoginTime);
        const currentTime = new Date();

        const timeDifference = (currentTime - lastLoginDate) / 1000;
        if (timeDifference > 100) {
          console.log('Last login was more than 100 seconds ago. Logging out...');
          signOut(auth).then(() => {
            navigate('/'); 
          });
        } else {
          navigate('/menu');
        }
      }
    });
    return () => unsubscribe(); 
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (password === 'No Password') {
        setError('Please change your password.');
      } else if (user) {
        setMessage('Login successful!');
        navigate('/menu'); 
      }
    } catch (err) {
      setError('Invalid email or password');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgetPassword = async () => {
    setError('');
    setMessage('');
    setIsLoading(true);
  
    if (!email) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return;
    }
  
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError('Error sending password reset email.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="Login">
      <form onSubmit={handleLogin}>      
        <h1>Login</h1>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p className="message">{message}</p>}
        
        {isLoading ? (
          <div className="loading-spinner"></div>
        ) : (
          <>
            <button className="Login-button" type="submit">Login</button>
            <button 
              className="forget-password-button" 
              onClick={handleForgetPassword}
              type="button"
            >
              Forget Password
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default Login;