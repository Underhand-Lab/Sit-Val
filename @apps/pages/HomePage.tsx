import React, { useState, useEffect, useMemo } from "react";
import {
  Div,
  Box,
  H3,
  vars,
  Button,
  InputText,
} from "@shared/bridges/UIBridge";
import { useNavigate } from "react-router-dom";
import { db } from "../services/db";
import * as Hangul from "hangul-js";
import { ListItemCard } from "../common/components/ListItemCard";
import {
  YearlyLeague,
  YearlyLineup,
  YearlyPlayer,
} from "@packages/sit-val/types/Database";

type HomeLeagueItem = YearlyLeague;
type HomePlayerItem = YearlyPlayer & { name: string };
type HomeLineupItem = YearlyLineup;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [leagues, setLeagues] = useState<HomeLeagueItem[]>([]);
  const [players, setPlayers] = useState<HomePlayerItem[]>([]);
  const [lineups, setLineups] = useState<HomeLineupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [lg, pl, li] = await Promise.all([
          db.getRecentYearlyLeagues(5),
          db.getRecentYearlyPlayersWithNames(5),
          db.getRecentYearlyLineups(5),
        ]);
        setLeagues(lg);
        setPlayers(pl);
        setLineups(li);
      } catch (e) {
        console.error("데이터 로드 중 오류:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const filterItem = (
    item: { name?: string; leagueId?: string; year?: number },
    term: string,
  ) => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    const nameMatch =
      (item.name || item.leagueId || "") &&
      Hangul.search(item.name || item.leagueId || "", term) >= 0;
    const yearMatch = item.year?.toString().includes(lowerTerm);
    return nameMatch || yearMatch;
  };

  const filteredLeagues = useMemo(
    () => leagues.filter((league) => filterItem(league, searchTerm)),
    [leagues, searchTerm],
  );
  const filteredPlayers = useMemo(
    () => players.filter((player) => filterItem(player, searchTerm)),
    [players, searchTerm],
  );
  const filteredLineups = useMemo(
    () => lineups.filter((lineup) => filterItem(lineup, searchTerm)),
    [lineups, searchTerm],
  );

  const totalVisibleItems =
    filteredLeagues.length + filteredPlayers.length + filteredLineups.length;

  const renderListSection = (
    title: string,
    description: string,
    items: Array<{
      id: string;
      year?: number;
      name?: string;
      leagueId?: string;
    }>,
    type: "league" | "player" | "lineup",
  ) => (
    <Div style={{ width: "100%" }}>
      <Div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <Div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <H3 style={{ margin: 0 }}>{title}</H3>
          <span style={{ fontSize: "13px", color: vars.text, opacity: 0.6 }}>
            {description}
          </span>
        </Div>
        <Button
          onClick={() => navigate(`/${type}`)}
          style={{ padding: "4px 12px", fontSize: "12px" }}
        >
          전체보기
        </Button>
      </Div>
      <Div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.length > 0 ? (
          items.map((item) => (
            <ListItemCard
              key={item.id}
              onClick={() => navigate(`/${type}/${item.id}`)}
            >
              <Div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Div
                  style={{
                    backgroundColor: vars.surface,
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: vars.primary,
                  }}
                >
                  {item.year}
                </Div>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: vars.text,
                  }}
                >
                  {item.name || item.leagueId}
                </span>
              </Div>
              <span
                style={{ fontSize: "12px", color: vars.text, opacity: 0.4 }}
              >
                {item.id.split("-")[0]}...
              </span>
            </ListItemCard>
          ))
        ) : (
          <p style={{ opacity: 0.5, fontSize: "12px", textAlign: "center" }}>
            데이터가 없습니다.
          </p>
        )}
      </Div>
    </Div>
  );

  return (
    <Div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "20px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box
        style={{
          padding: "20px",
          textAlign: "center",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <H3 style={{ marginBottom: "10px" }}>최근 분석 대시보드</H3>
        <p
          style={{
            margin: "0 0 20px 0",
            color: vars.text,
            opacity: 0.7,
            fontSize: "14px",
          }}
        >
          최신 리그, 선수, 라인업 기록만 빠르게 훑고 각 분석 화면으로 이동할 수
          있습니다.
        </p>
        <InputText
          placeholder="현재 보이는 최신 항목 안에서 빠르게 찾기"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "12px",
            border: `1px solid ${vars.surface}`,
            backgroundColor: vars.background,
            color: vars.text,
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />
      </Box>
      <Box
        className="container"
        style={{ width: "100%", boxSizing: "border-box", padding: "30px" }}
      >
        {isLoading ? (
          <p style={{ textAlign: "center", padding: "40px" }}>
            데이터를 불러오는 중...
          </p>
        ) : (
          <Div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              width: "100%",
            }}
          >
            <Div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{ fontSize: "14px", color: vars.text, opacity: 0.7 }}
              >
                각 영역당 최신 5개 항목만 보여줍니다.
              </span>
              <span
                style={{ fontSize: "13px", color: vars.text, opacity: 0.5 }}
              >
                현재 {totalVisibleItems}개 항목 표시 중
              </span>
            </Div>
            {renderListSection(
              "리그 분석",
              "최근 등록되거나 갱신된 리그 분석",
              filteredLeagues,
              "league",
            )}
            <hr
              style={{ border: "none", borderTop: `1px solid ${vars.surface}` }}
            />
            {renderListSection(
              "선수 분석",
              "최근 등록되거나 갱신된 선수 분석",
              filteredPlayers,
              "player",
            )}
            <hr
              style={{ border: "none", borderTop: `1px solid ${vars.surface}` }}
            />
            {renderListSection(
              "라인업 분석",
              "최근 등록되거나 갱신된 라인업 분석",
              filteredLineups,
              "lineup",
            )}
          </Div>
        )}
      </Box>
    </Div>
  );
};

export default HomePage;
