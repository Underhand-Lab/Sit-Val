import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Div, vars } from '@shared/bridges/UIBridge'
import { db } from '../../services/db';
import { supabase } from '../../services/supabaseClient';
import { openLoginModal } from '../../services/authModal';

interface NavItemData {
    name: string;
    path: string;
    action?: 'login';
}

const Navigation = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // 초기 로그인 상태 확인
        db.getCurrentUser().then(user => setIsLoggedIn(!!user));

        // 인증 상태 변화 감지 리스너 등록
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const navItems: NavItemData[] = [
        { name: '선수 분석', path: '/player' },
        { name: '리그 분석', path: '/league' },
        { name: '라인업 분석', path: '/lineup' },
        isLoggedIn
            ? { name: '계정', path: '/account' }
            : { name: '로그인', path: '/', action: 'login' },
    ];

    return (
        <Div style={styles.navContainer}>
            <Div style={styles.navContent}>
                <style>
                    {`.hide-scrollbar::-webkit-scrollbar { display: none; }`}
                </style>
                <Div style={styles.brandContainer}>
                    <Link to="/" style={styles.brandLink}>Sit-Val</Link>
                </Div>
                <Div className="hide-scrollbar" style={styles.scrollContainer}>
                    <Div style={styles.navLinksContainer}>
                        {navItems.map((item) => (
                            <NavItem key={item.path} item={item} />
                        ))}
                    </Div>
                </Div>
            </Div>
        </Div>
    );
};

interface NavItemProps {
    item: NavItemData;
}

const NavItem = ({ item }: NavItemProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (item.action !== 'login') return;
        event.preventDefault();
        openLoginModal();
    };

    return (
        <NavLink
            to={item.path}
            style={({ isActive }: { isActive: boolean }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
                ...(isHovered ? styles.navLinkHover : {}),
            })}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {item.name}
        </NavLink>
    );
};

const styles: Record<string, React.CSSProperties> = {
    navContainer: {
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        backgroundColor: vars.secondary,
        color: '#aaaaaa',
        fontSize: '15px',
        margin: 0,
        zIndex: 2000,
        transition: 'transform 0.5s ease',
        padding: '10px 0',
        overflow: 'hidden',
    },
    navContent: {
        padding: '0 20px',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '50px'
    },
    brandContainer: {
        flexShrink: 0
    },
    brandLink: {
        textDecoration: 'none',
        color: 'inherit',
        fontWeight: 'bold'
    },
    scrollContainer: {
        flex: 1,
        minWidth: 0,
        overflowX: 'auto',
        display: 'flex',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 30px, black calc(100% - 30px), transparent)',
        maskImage: 'linear-gradient(to right, transparent, black 30px, black calc(100% - 30px), transparent)',
        margin: '0 -30px',
        padding: '0 30px'
    },
    navLinksContainer: {
        display: 'flex',
        gap: '8px',
        flexDirection: 'row',
        alignItems: 'center',
        margin: '0 0 0 auto',
        width: 'max-content',
        flexShrink: 0,
    },
    navLink: {
        textDecoration: 'none',
        textAlign: 'center',
        color: 'inherit',
        padding: '2px 10px',
        whiteSpace: 'nowrap',
        transition: 'background-color 0.3s ease, color 0.3s ease',
    },
    navLinkActive: {
        color: vars.primary,
    },
    navLinkHover: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '5px',
    }
};

export default Navigation;
