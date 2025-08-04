// components/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Import useDispatch
import { setUser } from '../redux/slices/userSlice'; // Import setUser action
import { baseURL } from '../data'; // Import baseURL
import './Login.css'; // Import the new CSS file for Login

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // New loading state
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Initialize useDispatch

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setLoading(true); // Set loading to true when login starts

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false); // Stop loading if validation fails
      return;
    }

    try {
      const response = await fetch(`${baseURL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the token
        localStorage.setItem('authToken', data.token);
        // Dispatch user data to Redux store
        dispatch(setUser(data.user));

        onLogin(); // Call the onLogin function passed from App.jsx
        navigate('/dashboard'); // Redirect to dashboard on successful login
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error('Login API error:', err);
      setError('An error occurred during login. Please try again later.');
    } finally {
      setLoading(false); // Always set loading to false after the attempt
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login to IntelliHire</h2>
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
              disabled={loading} // Disable input while loading
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
              disabled={loading} // Disable input while loading
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

