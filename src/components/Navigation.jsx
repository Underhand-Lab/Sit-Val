import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation = () => {
    const navItems = [
        { name: '리그 분석', path: '/league' },
        { name: '라인업 분석', path: '/lineup' },
    ];

    return (
        <nav>
            <div style={{padding: '2px', paddingTop: '12px'}}>
                <div style={{ flexGrow: 1 }}>
                    <NavLink to="/">Sit-Val</NavLink>
                </div>
                <div style={{ flexGrow: 1, display: 'flex', gap: '10px', flexDirection: 'row', alignContent: 'center' }}>
                    
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `${isActive ? 'active' : ''}`}
                            style={{ textDecoration: 'none', textAlign: 'center', flex: 1, alignContent: 'center' }}
                        >
                            {item.name}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;