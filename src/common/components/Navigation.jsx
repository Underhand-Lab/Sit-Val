import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Div from './ui/Div';
import vars from './ui/Variables'

const Navigation = () => {
    const navItems = [
        { name: '리그 분석', path: '/league' },
        { name: '라인업 분석', path: '/lineup' },
    ];

    return (
        <Div style={styles.navContainer}>
            <Div style={styles.navContent}>
                <Div style={styles.navLinksContainer}>
                    <NavItem key="/" item={{path: "/", name: "Sit-Val"}} />
                </Div>
                <Div style={styles.navLinksContainer}>
                    {navItems.map((item) => (
                        <NavItem key={item.path} item={item} />
                    ))}
                </Div>
            </Div>
        </Div>
    );
};

const NavItem = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <NavLink
            to={item.path}
            style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
                ...(isHovered ? styles.navLinkHover : {}),
            })}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {item.name}
        </NavLink>
    );
};

const styles = {
    navContainer: {
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: vars.secondary,
        color: '#aaaaaa',
        fontSize: '15px',
        margin: 0,
        zIndex: 20,
        width: '100%',
        transition: 'transform 0.5s ease',
        marginBottom: '20px',
    },
    navContent: {
        padding: '5px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center'
    },
    brandContainer: {
        flexGrow: 1
    },
    brandLink: {
        textDecoration: 'none',
        color: 'inherit',
    },
    navLinksContainer: {
        flexGrow: 1,
        display: 'flex',
        gap: '10px',
        flexDirection: 'row',
        alignItems: 'center',
    },
    navLink: {
        textDecoration: 'none',
        textAlign: 'center',
        flex: 1,
        color: 'inherit',
        padding: '5px 0',
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