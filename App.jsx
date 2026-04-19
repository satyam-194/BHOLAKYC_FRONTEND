import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import UserKYC from "./UserKYC";
import AdminDashboard from "./AdminDashboard";

const UserKYCWrapper = ({ apiBaseUrl, onNavigate }) => {
  const [activePhase, setActivePhase] = useState('A');
  const [kycData, setKycData] = useState(null);
  const location = useLocation();
  const hash = location.hash; 

  React.useEffect(() => {
    if (hash === '#PhaseB') setActivePhase('B');
    else if (hash === '#PhaseA') setActivePhase('A');
    else setActivePhase('A'); 
  }, [hash]);

  const handleNext = (data) => {
    setKycData(data);
    setActivePhase('B');
    window.location.hash = 'PhaseB'; 
  };

  const handleBack = () => {
    setActivePhase('A');
    window.location.hash = 'PhaseA'; 
  };

  return (
    <UserKYC
      apiBaseUrl={apiBaseUrl}
      onNavigate={(hash) => { window.location.hash = hash; }}
    />
  );
};

function App() {
  const API_BASE_URL = 'https://www.coinora.in'; 

  return (
    <HashRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminDashboard />} />
                
        <Route path="*" element={
          <UserKYCWrapper apiBaseUrl={API_BASE_URL} onNavigate={(h) => window.location.hash = h} />
        } />
      </Routes>
    </HashRouter>
  );
}

export default App;