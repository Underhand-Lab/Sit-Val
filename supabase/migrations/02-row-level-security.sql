-- RLS 활성화
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 공통 정책 함수 (작성자 확인용)
-- leagues, teams 같이 creatorId가 없는 마스터 테이블은 관리자만 쓰게 하거나 일단 인증된 유저 모두 허용으로 설정 가능합니다.

-- [leagues, teams, players, yearly_teams] 정책: 읽기 모두 / 쓰기 인증된 유저
DO $$ 
DECLARE
    tab text;
BEGIN
    FOR tab IN SELECT unnest(ARRAY['leagues', 'teams', 'players', 'yearly_teams']) 
    LOOP
        EXECUTE format('CREATE POLICY "읽기는 모두 허용" ON %I FOR SELECT USING (true);', tab);
        EXECUTE format('CREATE POLICY "인증된 유저만 삽입 가능" ON %I FOR INSERT WITH CHECK (auth.role() = ''authenticated'');', tab);
        EXECUTE format('CREATE POLICY "인증된 유저만 수정 가능" ON %I FOR UPDATE USING (auth.role() = ''authenticated'');', tab);
    END LOOP;
END $$;

-- [yearly_leagues, yearly_players, yearly_lineups] 정책: 읽기 모두 / 쓰기 본인만
DO $$ 
DECLARE
    tab text;
BEGIN
    FOR tab IN SELECT unnest(ARRAY['yearly_leagues', 'yearly_players', 'yearly_lineups']) 
    LOOP
        EXECUTE format('CREATE POLICY "읽기는 모두 허용" ON %I FOR SELECT USING (true);', tab);
        EXECUTE format('CREATE POLICY "로그인 유저만 삽입 가능" ON %I FOR INSERT WITH CHECK (auth.uid() = "creatorId");', tab);
        EXECUTE format('CREATE POLICY "작성자만 수정 가능" ON %I FOR UPDATE USING (auth.uid() = "creatorId");', tab);
        EXECUTE format('CREATE POLICY "작성자만 삭제 가능" ON %I FOR DELETE USING (auth.uid() = "creatorId");', tab);
    END LOOP;
END $$;

-- [user_settings] 정책: 본인 데이터만 접근 및 수정
CREATE POLICY "본인 설정만 조회" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 설정만 삽입" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 설정만 수정" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
