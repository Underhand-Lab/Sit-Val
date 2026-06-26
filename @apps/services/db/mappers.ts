const BATTER_STATS_KEYS = ['1B', '2B', '3B', 'hr', 'bb', 'hbp', 'so', 'go', 'fo', 'sf', 'sh', 'r', 'rbi'] as const;
const RUNNER_STATS_KEYS = [
  'passedball', 's_r1_r2_safe', 's_r1_r2_out', 's_r2_r3_safe', 's_r2_r3_out',
  '1B_r2_home_safe', '1B_r2_home_out', '1B_r2_r3_safe', '1B_r1_r3_safe', '1B_r1_r3_out', '1B_r1_r2_safe',
  '2B_r1_home_safe', '2B_r1_home_out', '2B_r1_r3_safe',
  'fo_r3_home_safe', 'fo_r3_home_out', 'fo_r3_r3_safe',
  'go_r1_r2_out', 'go_b_r1_out'
] as const;

export const transformBatterStats = <T extends Record<string, any> | null>(row: T) => {
  if (!row) return row;
  const clone = { ...row };
  const stats: Record<string, unknown> = {};

  BATTER_STATS_KEYS.forEach((key) => {
    if (key in clone) {
      stats[key] = clone[key];
      delete clone[key];
    }
  });

  return { ...clone, stats };
};

export const flattenBatterStats = <T extends { stats?: Record<string, unknown> }>(data: T) => {
  const { stats, ...rest } = data;
  if (!stats) return rest;
  const { pa, ...statsWithoutPa } = stats;
  return { ...rest, ...statsWithoutPa };
};

export const transformRunnerStats = <T extends Record<string, any> | null>(row: T) => {
  if (!row) return row;
  const clone = { ...row };
  const runnerStats: Record<string, unknown> = {};

  RUNNER_STATS_KEYS.forEach((key) => {
    if (key in clone) {
      runnerStats[key] = clone[key];
      delete clone[key];
    }
  });

  return { ...clone, runnerStats };
};

export const flattenRunnerStats = <T extends { runnerStats?: Record<string, unknown> }>(data: T) => {
  const { runnerStats, ...rest } = data;
  return { ...rest, ...(runnerStats || {}) };
};

export const pickRunnerStats = <T extends Record<string, any> | null>(row: T) => {
  if (!row) return null;
  const runnerStats: Record<string, unknown> = {};
  RUNNER_STATS_KEYS.forEach((key) => {
    if (key in row) {
      runnerStats[key] = row[key];
    }
  });
  return runnerStats;
};
