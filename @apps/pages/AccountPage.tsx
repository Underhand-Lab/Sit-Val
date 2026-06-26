import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Div, Button, vars, InputNumber } from '@shared/bridges/UIBridge';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { openLoginModal } from '../services/authModal';
import { YearlyLeague, YearlyLineup, YearlyPlayer } from '@packages/sit-val/types/Database';
import { VisualizerList } from '../features/visualizer/components/VisualizerList';

const ACCOUNT_ANALYSIS_LIMIT = 5;

type PlayerListItem = YearlyPlayer & { name: string };
type AccountPanel = {
  type: string;
  name: string;
  Component: React.ComponentType<any>;
  props?: Record<string, any>;
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  color: vars.text,
  fontWeight: 'bold',
  marginBottom: '10px',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 14px',
  borderRadius: '8px',
  border: `1px solid ${vars.surface}`,
  backgroundColor: vars.background,
};

const emptyStyle: React.CSSProperties = {
  fontSize: '13px',
  color: vars.text,
  opacity: 0.6,
};

interface AccountAnalysisListPanelProps {
  title: string;
  type: 'league' | 'player' | 'lineup';
  items: Array<{ id: string; year: number; label: string }>;
}

const AccountAnalysisListPanel: React.FC<AccountAnalysisListPanelProps> = ({ title, type, items }) => {
  const panelListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  return (
    <Div>
      <Div style={sectionTitleStyle}>{title}</Div>
      <Div style={panelListStyle}>
        {items.length === 0 ? (
          <Div style={emptyStyle}>아직 만든 {title}이 없습니다.</Div>
        ) : (
          items.map((item) => (
            <Link key={item.id} to={`/${type}/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Div style={itemStyle}>
                <span>{item.label} {item.year}</span>
                <span style={{ opacity: 0.6, fontSize: '12px' }}>열기</span>
              </Div>
            </Link>
          ))
        )}
      </Div>
    </Div>
  );
};

interface AccountSettingsPanelProps {
  email: string;
  nickname: string;
  setNickname: (value: string) => void;
  message: string | null;
  isLoading: boolean;
  inputStyle: React.CSSProperties;
  handleUpdateNickname: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AccountSettingsPanel: React.FC<AccountSettingsPanelProps> = ({
  email,
  nickname,
  setNickname,
  message,
  isLoading,
  inputStyle,
  handleUpdateNickname,
  handleLogout,
}) => (
  <Div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <Div style={sectionTitleStyle}>계정 설정</Div>

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

    <Button
      onClick={handleLogout}
      style={{ width: '100%', backgroundColor: '#666', color: 'white', height: '45px' }}
    >
      로그아웃
    </Button>
  </Div>
);

const AccountPage: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [myLeagues, setMyLeagues] = useState<YearlyLeague[]>([]);
  const [myPlayers, setMyPlayers] = useState<PlayerListItem[]>([]);
  const [myLineups, setMyLineups] = useState<YearlyLineup[]>([]);
  const [accountPanels, setAccountPanels] = useState<AccountPanel[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await db.getCurrentUser();
      if (!user) {
        openLoginModal();
        navigate('/');
        return;
      }
      setEmail(user.email || '');
      setNickname(user.user_metadata?.nickname || '');
      const [leagues, players, lineups] = await Promise.all([
        db.getMyYearlyLeagues(ACCOUNT_ANALYSIS_LIMIT),
        db.getMyYearlyPlayersWithNames(ACCOUNT_ANALYSIS_LIMIT),
        db.getMyYearlyLineups(ACCOUNT_ANALYSIS_LIMIT),
      ]);
      setMyLeagues(leagues);
      setMyPlayers(players);
      setMyLineups(lineups);
    };
    fetchUser();
  }, [navigate]);

  const handleUpdateNickname = useCallback(async (e: React.FormEvent) => {
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
  }, [nickname]);

  const handleLogout = useCallback(async () => {
    if (confirm('정말로 로그아웃 하시겠습니까?')) {
      try {
        await db.signOut();
        navigate('/');
      } catch (err: any) {
        alert(`로그아웃 실패: ${err.message}`);
      }
    }
  }, [navigate]);

  const inputStyle = useMemo<React.CSSProperties>(() => ({
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${vars.surface}`,
    backgroundColor: vars.background,
    color: vars.text,
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  }), []);

  const leaguePanelItems = useMemo(
    () => myLeagues.map((league) => ({
      id: league.id,
      year: league.year,
      label: league.leagueId,
    })),
    [myLeagues]
  );

  const playerPanelItems = useMemo(
    () => myPlayers.map((player) => ({
      id: player.id,
      year: player.year,
      label: player.name,
    })),
    [myPlayers]
  );

  const lineupPanelItems = useMemo(
    () => myLineups.map((lineup) => ({
      id: lineup.id,
      year: lineup.year,
      label: lineup.name,
    })),
    [myLineups]
  );

  const settingsPanelProps = useMemo(
    () => ({
      email,
      nickname,
      setNickname,
      message,
      isLoading,
      inputStyle,
      handleUpdateNickname,
      handleLogout,
    }),
    [email, nickname, message, isLoading, inputStyle, handleUpdateNickname, handleLogout]
  );

  const panelToolOptions = useMemo<AccountPanel[]>(() => ([
    {
      type: 'account-my-leagues',
      name: '내 리그 분석',
      Component: AccountAnalysisListPanel,
      props: {
        title: '내 리그 분석',
        type: 'league',
        items: leaguePanelItems,
      },
    },
    {
      type: 'account-my-players',
      name: '내 선수 분석',
      Component: AccountAnalysisListPanel,
      props: {
        title: '내 선수 분석',
        type: 'player',
        items: playerPanelItems,
      },
    },
    {
      type: 'account-my-lineups',
      name: '내 라인업 분석',
      Component: AccountAnalysisListPanel,
      props: {
        title: '내 라인업 분석',
        type: 'lineup',
        items: lineupPanelItems,
      },
    },
    {
      type: 'account-settings',
      name: '계정 설정',
      Component: AccountSettingsPanel,
      props: {
        ...settingsPanelProps,
        lockRemove: true,
      },
    },
  ]), [leaguePanelItems, lineupPanelItems, playerPanelItems, settingsPanelProps]);

  useEffect(() => {
    setAccountPanels((prev) => {
      if (prev.length > 0 || panelToolOptions.length === 0) return prev;
      const initialPanels = ['account-settings', 'account-my-leagues']
        .map((type) => panelToolOptions.find((option) => option.type === type))
        .filter(Boolean) as AccountPanel[];
      return initialPanels.length > 0 ? initialPanels : [panelToolOptions[0]];
    });
  }, [panelToolOptions]);

  useEffect(() => {
    setAccountPanels((prev) => {
      const next = prev.map((panel) => panelToolOptions.find((option) => option.type === panel.type) || panel);
      const changed = next.some((panel, index) => panel !== prev[index]);
      return changed ? next : prev;
    });
  }, [panelToolOptions]);

  const handleAddAccountPanel = (option: AccountPanel) => {
    setAccountPanels((prev) => {
      if (prev.some((panel) => panel.type === option.type)) return prev;
      return [...prev, option];
    });
  };

  return (
    <Div
      id="wrapper"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <VisualizerList
        tools={accountPanels}
        data={null}
        toolOptions={panelToolOptions}
        onAddTool={handleAddAccountPanel}
        onToolsSync={setAccountPanels}
        storageKey="account-panels-layout"
      />
    </Div>
  );
};

export default AccountPage;
