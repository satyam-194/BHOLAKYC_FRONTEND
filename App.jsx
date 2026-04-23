import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';

import LandingPage from './LandingPage';
import UserKYC from './UserKYC';
import AdminDashboard from './AdminDashboard';
import { API_BASE as API_BASE_URL } from './apiBase.js';

const UserKYCWrapper = ({ apiBaseUrl, onNavigate, onBackToLanding }) => (
  <UserKYC
    apiBaseUrl={apiBaseUrl}
    onNavigate={(hash) => { window.location.hash = hash; }}
    onBackToLanding={onBackToLanding}
  />
);

const AppInner = () => {
  const [showKyc, setShowKyc] = useState(false);

  const handleGetStarted = () => {
    setShowKyc(true);
    window.scrollTo({ top: 0 });
  };

  const handleBackToLanding = () => {
    setShowKyc(false);
    window.location.hash = '';
    window.scrollTo({ top: 0 });
  };

  return (
    <Routes>
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route
        path="*"
        element={
          showKyc
            ? <UserKYCWrapper
                apiBaseUrl={API_BASE_URL}
                onNavigate={(h) => { window.location.hash = h; }}
                onBackToLanding={handleBackToLanding}
              />
            : <LandingPage onGetStarted={handleGetStarted} />
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  );
}

export default App;
