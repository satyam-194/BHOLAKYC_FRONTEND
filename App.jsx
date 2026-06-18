import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';

import LandingPage from './LandingPage';
import UserKYC from './UserKYC';
import AdminDashboard from './AdminDashboard';
import ExistingUserKYC from './ExistingUserKYC';
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
  const [showExistingUser, setShowExistingUser] = useState(false);

  const handleGetStarted = () => {
    setShowKyc(true);
    setShowExistingUser(false);
    window.scrollTo({ top: 0 });
  };

  const handleExistingUser = () => {
    setShowExistingUser(true);
    setShowKyc(false);
    window.scrollTo({ top: 0 });
  };

  const handleBackToLanding = () => {
    setShowKyc(false);
    setShowExistingUser(false);
    window.location.hash = '';
    window.scrollTo({ top: 0 });
  };

  const renderMain = () => {
    if (showKyc) {
      return (
        <UserKYCWrapper
          apiBaseUrl={API_BASE_URL}
          onNavigate={(h) => { window.location.hash = h; }}
          onBackToLanding={handleBackToLanding}
        />
      );
    }
    if (showExistingUser) {
      return (
        <ExistingUserKYC
          apiBaseUrl={API_BASE_URL}
          onBack={handleBackToLanding}
        />
      );
    }
    return <LandingPage onGetStarted={handleGetStarted} onExistingUser={handleExistingUser} />;
  };

  return (
    <Routes>
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="*" element={renderMain()} />
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
