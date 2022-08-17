import { game_state, Summon } from "@root/game-state";

export let summon = (summon_type: 0 | 1 | 2): Summon =>
{
  let base_stats = game_state[GAMESTATE_PLAYER][PLAYER_SUMMON_LEVELS][summon_type];
  return [
    summon_type,
    base_stats[SUMMON_MAX_HP],
    []
  ];
};