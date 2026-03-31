// ============================================
// ACHIEVEMENT DEFINITIONS — Data only
// ============================================

import type { AchievementId } from '../types/game';

export interface AchievementDef {
  readonly id: AchievementId;
  readonly name: string;
  readonly description: string;
  readonly condition: string;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = Object.freeze([
  { id: 'first_blood', name: 'FIRST BLOOD', description: 'Kill your first enemy', condition: 'kills_total >= 1' },
  { id: 'wave_5', name: 'WARMING UP', description: 'Reach wave 5', condition: 'wave >= 5' },
  { id: 'wave_10', name: 'VETERAN', description: 'Reach wave 10', condition: 'wave >= 10' },
  { id: 'wave_20', name: 'LEGEND', description: 'Reach wave 20', condition: 'wave >= 20' },
  { id: 'perfect_wave', name: 'PERFECT WAVE', description: 'Clear a wave without taking damage', condition: 'special' },
  { id: 'tequila_1', name: 'CHEERS!', description: 'Shoot down a tequila UFO', condition: 'kills.ufo >= 1' },
  { id: 'tequila_5', name: 'TEQUILA HUNTER', description: 'Shoot down 5 tequila UFOs', condition: 'kills.ufo >= 5' },
  { id: 'boss_1', name: 'BOSS SLAYER', description: 'Defeat a boss', condition: 'kills.boss >= 1' },
  { id: 'accuracy_80', name: 'SHARPSHOOTER', description: 'Finish with 80%+ accuracy', condition: 'shotsFired > 10 && accuracy >= 0.8' },
  { id: 'kills_100', name: 'CENTURION', description: 'Kill 100 enemies in one game', condition: 'kills_total >= 100' },
  { id: 'score_10k', name: 'HIGH ROLLER', description: 'Score 10,000 points', condition: 'score >= 10000' },
  { id: 'powerup_5', name: 'POWERED UP', description: 'Collect 5 power-ups in one game', condition: 'powerupsCollected >= 5' },
] as const);
