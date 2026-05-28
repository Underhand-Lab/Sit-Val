import React, { useState, useEffect } from 'react';
import { Div, Box, Button, H3, vars, Wrapper, InputNumber } from '@shared/bridges/UIBridge';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';

const AccountPage: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await db.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setEmail(user.email || '');
      setNickname(user.user_metadata?.nickname || '');
    };
    fetchUser();
  }, [navigate]);

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      await db.updateNickname(nickname);
      setMessage('닉네임이 성공적으로 변경되었습니다.');
    } catch (err: any) {
      setMessage(`에러: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('정말로 로그아웃 하시겠습니까?')) {
      try {
        await db.signOut();
        navigate('/');
      } catch (err: any) {
        alert(`로그아웃 실패: ${err.message}`);
      }
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${vars.surface}`,
    backgroundColor: vars.background,
    color: vars.text,
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <Wrapper>
      <Div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 150px)',
        padding: '20px'
      }}>
        <Box style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
          <H3 style={{ textAlign: 'center', marginBottom: '30px' }}>계정 설정</H3>
          
          <Div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: vars.text, opacity: 0.7, fontWeight: 'bold' }}>이메일 계정</label>
              <input value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </Div>

            <form onSubmit={handleUpdateNickname} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: vars.text, opacity: 0.7, fontWeight: 'bold' }}>닉네임</label>
                <InputNumber
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임 입력"
                  required
                  style={inputStyle}
                />
              </Div>

              {message && <Div style={{ color: vars.primary, fontSize: '12px', textAlign: 'center' }}>{message}</Div>}

              <Button type="submit" disabled={isLoading} style={{ height: '45px' }}>
                {isLoading ? '처리 중...' : '닉네임 변경'}
              </Button>
            </form>

            <Div style={{ borderTop: `1px solid ${vars.surface}`, paddingTop: '20px', marginTop: '10px' }}>
              <Button 
                onClick={handleLogout} 
                style={{ width: '100%', backgroundColor: '#666', color: 'white', height: '45px' }}
              >
                로그아웃
              </Button>
            </Div>
          </Div>
        </Box>
      </Div>
    </Wrapper>
  );
};

export default AccountPage;