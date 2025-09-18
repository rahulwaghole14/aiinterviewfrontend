// components/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/userSlice';
import { fetchJobs, fetchDomains } from '../redux/slices/jobsSlice';
import { fetchCandidates } from '../redux/slices/candidatesSlice';
import { baseURL } from '../config/constants';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Call the login API
      console.log('=== LOGIN URL BEING USED ===');
      console.log('URL:', `${baseURL}/api/auth/login/`);
      console.log('=== END URL LOG ===');
      
      const loginResponse = await fetch(`${baseURL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        localStorage.setItem('authToken', loginData.token);
        localStorage.setItem('userData', JSON.stringify(loginData.user));

        console.log("Login.jsx - User data from API:", loginData.user);

        dispatch(setUser(loginData.user));
        dispatch(fetchJobs());
        dispatch(fetchDomains());
        dispatch(fetchCandidates());

        if (onLogin) onLogin(loginData.user);
        // Don't navigate here - let App.jsx handle navigation
      } else {
        const errorData = await loginResponse.json();
        setError(errorData.detail || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error('API error:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login to Talaro</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="login-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
          <div className="login-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          {error && <p className="login-error-message">{error}</p>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                Logging in
                <span className="loading-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
        <p className="login-link-text">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
