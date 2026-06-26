import React, { useState } from 'react';
import { Box, Button, Div, H3, InputNumber, vars } from '@shared/bridges/UIBridge';
import { supabase } from '@apps/services/supabaseClient';

interface LoginFormProps {
  onSuccess?: () => void;
  containerStyle?: React.CSSProperties;
  title?: string;
  showFrame?: boolean;
  showTitle?: boolean;
}

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

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  containerStyle,
  title = '로그인',
  showFrame = true,
  showTitle = true,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        alert('회원가입이 완료되었습니다. 이메일 인증이 필요한 경우 메일을 확인해주세요.');
        setIsSignUp(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || '인증에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <>
      {showTitle && (
        <H3 style={{ textAlign: 'center', marginBottom: '30px' }}>
          {isSignUp ? '회원가입' : title}
        </H3>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: vars.text, opacity: 0.7, fontWeight: 'bold' }}>이메일</label>
          <InputNumber
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            style={inputStyle}
          />
        </Div>

        <Div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: vars.text, opacity: 0.7, fontWeight: 'bold' }}>비밀번호</label>
          <InputNumber
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상 입력"
            required
            style={inputStyle}
          />
        </Div>

        {error && <Div style={{ color: '#ff4d4f', fontSize: '12px', textAlign: 'center' }}>{error}</Div>}

        <Button type="submit" disabled={isLoading} style={{ marginTop: '10px', height: '45px' }}>
          {isLoading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
        </Button>
      </form>

      <Div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: vars.text, opacity: 0.6 }}>
          {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
          <span
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ color: vars.primary, cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}
          >
            {isSignUp ? '로그인' : '회원가입'}
          </span>
        </p>
      </Div>
    </>
  );

  if (!showFrame) {
    return <Div style={containerStyle}>{content}</Div>;
  }

  return (
    <Box style={{ maxWidth: '400px', width: '100%', padding: '40px', ...containerStyle }}>
      {content}
    </Box>
  );
};

export default LoginForm;
