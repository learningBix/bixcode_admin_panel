import React from 'react';
import './App.css';
import ProtectedAdmin from './components/admin-panel/protected-admin/protected-admin.jsx';

function App() {
  return (
    <div className="App">
      <ProtectedAdmin />
    </div>
  );
}

export default App;
