import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from '@apps/common/components/Navigation';
import PlayerPage from '@apps/pages/PlayerPage';
import LeaguePage from '@apps/pages/LeaguePage';
import LineupPage from '@apps/pages/LineupPage';
import HomePage from '@apps/pages/HomePage';
import { vars } from '@shared/bridges/UIBridge';

function App(): React.JSX.Element {
    return (
        <Router basename="/sit-val">
            <div className="app-shell" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: vars.background }}>
                {/* 공통 네비게이션: App.jsx에서 일괄 관리 */}
                <Navigation />

                <Routes>
                    {/* 기본 경로 접속 시 리그 분석으로 리다이렉트 */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/player/:id?" element={<PlayerPage />} />
                    <Route path="/league/:id?" element={<LeaguePage />} />
                    <Route path="/lineup/:id?" element={<LineupPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;