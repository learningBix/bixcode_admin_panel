import React, { useState } from 'react';
import './admin-panel.css';
import '../protected-admin/logout-button.css';
import RegisterStudent from '../register-student/register-student.jsx';
import SubscribedStudents from '../subscribed-students/subscribed-students.jsx';

const AdminPanel = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('register');
  const [reloadKey, setReloadKey] = useState(0);
  const [recentCredentials, setRecentCredentials] = useState([]);

  const tabs = [
    { id: 'register', label: 'Register Student', icon: '👤+' },
    { id: 'subscribed', label: 'Subscribed Students', icon: '👥' }
  ];

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="header-left">
          <h1>BixCode Admin Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="admin-status">
            <span className="status-indicator">●</span>
            <span className="status-text">Admin Logged In</span>
          </div>
          <button
            onClick={onLogout}
            className="logout-button"
          >
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
      
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === 'register' && (
          <RegisterStudent
            onRegistered={(creds) => {
              setReloadKey(k => k + 1);
              setRecentCredentials(Array.isArray(creds) ? creds : []);
              setActiveTab('subscribed');
            }}
          />
        )}
        {activeTab === 'subscribed' && (
          <SubscribedStudents reloadKey={reloadKey} recentCredentials={recentCredentials} />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
