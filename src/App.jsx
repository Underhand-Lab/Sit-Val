import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from '@apps/common/components/Navigation';
import LeaguePage from '@apps/pages/LeaguePage';
import LineupPage from '@apps/pages/LineupPage';
import HomePage from '@apps/pages/HomePage';
import { vars } from '@shared/bridges/UIBridge';

function App() {
  return (
    <Router basename="/sit-val">
      <div className="app-shell" style={{ minHeight: '100vh', width: '100%', background: vars.background}}>
        {/* 공통 네비게이션: App.jsx에서 일괄 관리 */}
        <Navigation />
        
        <main>
          <Routes>
            {/* 기본 경로 접속 시 리그 분석으로 리다이렉트 */}
            <Route path="/" element={<HomePage />} />
            <Route path="/league" element={<LeaguePage />} />
            <Route path="/lineup" element={<LineupPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;