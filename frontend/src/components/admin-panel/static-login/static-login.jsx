import React, { useState } from 'react';
import './static-login.css';

const StaticLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Static credentials - you can change these
  const STATIC_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate a brief loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate static credentials
    if (credentials.username === STATIC_CREDENTIALS.username && 
        credentials.password === STATIC_CREDENTIALS.password) {
      // Store login state in localStorage
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminLoginTime', new Date().toISOString());
      
      // Call the onLogin callback to redirect to dashboard
      onLogin();
    } else {
      setError('Invalid username or password');
    }
    
    setLoading(false);
  };

  return (
    <div className="static-login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>BixCode Admin Login</h2>
          <p>Enter your credentials to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Enter username"
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
      </div>
    </div>
  );
};

export default StaticLogin;
