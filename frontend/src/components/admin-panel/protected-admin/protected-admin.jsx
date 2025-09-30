import React, { useState, useEffect } from 'react';
import StaticLogin from '../static-login/static-login.jsx';
import AdminPanel from '../admin-panel/admin-panel.jsx';
import './logout-button.css';

const ProtectedAdmin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check login status on component mount
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = () => {
    try {
      const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
      const loginTime = localStorage.getItem('adminLoginTime');
      
      if (loggedIn && loginTime) {
        // Check if login session is still valid (24 hours)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setIsLoggedIn(true);
        } else {
          // Session expired, clear storage
          logout();
        }
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminLoginTime');
    setIsLoggedIn(false);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          Loading Admin Panel...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return <StaticLogin onLogin={handleLogin} />;
  }

  // Show admin panel if authenticated
  return (
    <div style={{ position: 'relative' }}>
      <AdminPanel onLogout={logout} />
    </div>
  );
};

export default ProtectedAdmin;
