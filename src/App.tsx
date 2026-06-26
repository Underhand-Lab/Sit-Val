import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from '@apps/common/components/Navigation';
import { vars } from '@shared/bridges/UIBridge';
import { StatusMessage } from '@apps/common/components/StatusMessage';
import LoginModal from '@apps/features/auth/components/LoginModal';

const HomePage = lazy(() => import('@apps/pages/HomePage'));
const PlayerPage = lazy(() => import('@apps/pages/PlayerPage'));
const LeaguePage = lazy(() => import('@apps/pages/LeaguePage'));
const LineupPage = lazy(() => import('@apps/pages/LineupPage'));
const AccountPage = lazy(() => import('@apps/pages/AccountPage'));

function App(): React.JSX.Element {
    return (
        <Router>
            <div className="app-shell" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: vars.background }}>
                {/* 공통 네비게이션: App.jsx에서 일괄 관리 */}
                <Navigation />
                <LoginModal />

                <Suspense fallback={<StatusMessage title="페이지를 불러오는 중..." description="필요한 화면 모듈을 준비하고 있습니다." />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/player/:id?" element={<PlayerPage />} />
                        <Route path="/league/:id?" element={<LeaguePage />} />
                        <Route path="/lineup/:id?" element={<LineupPage />} />
                        <Route path="/account" element={<AccountPage />} />
                    </Routes>
                </Suspense>
            </div>
        </Router>
    );
}

export default App;
