import { assert } from "@debug/assert";
import { V2 } from "@math/vector";
import { Enemy } from "@root/game-state";
import { math, random_int } from "math";

let enemy_data: V2[] = [
  [0, 1], // ENEMY_TYPE_SKELETON
  [1, 0], // ENEMY_TYPE_ZOMBIE
  [0, 0], // ENEMY_TYPE_SPIRIT
  [1, 1], // ENEMY_TYPE_CULTIST
  [2, 1], // ENEMY_TYPE_LICH
];
export let build_enemy = (_type: number, level: number): Enemy =>
{
  let enemy_stats = enemy_data[_type];

  let level_mod = math.floor(level / 10);
  let mod_plus_one = level_mod + 1;

  let _attack = random_int(mod_plus_one, mod_plus_one + (mod_plus_one * enemy_stats[0]));
  let _block_value = random_int(mod_plus_one + enemy_stats[1], level_mod + (mod_plus_one * enemy_stats[1]));
  let _hp = (level - (_attack * 2) - (_block_value - 1)) * 3;

  return {
    _type,
    _alive: true,
    _max_hp: _hp,
    _hp,
    _attack,
    _attack_debuff_turns: 0,
    _attack_buff: 0,
    _intent_pool: [],
    _current_intent: ENEMY_INTENT_TYPE_NONE
  };
};

export let get_enemy = (chapter: number, level: number) =>
{
  let enemy_type = chapter === 1 ? random_int(0, 2) : random_int(0, 3);
  return build_enemy(enemy_type, level);
};

export let get_boss = (chapter: number, level: number) =>
{
  return build_enemy(4, level + 5);
};

export let get_next_enemy_intent = (enemy: Enemy) =>
{
  let intent = enemy._intent_pool.pop();
  if (!intent)
    enemy._intent_pool = [ENEMY_INTENT_TYPE_ATTACK]; // TODO: generate new intent pool based on unit
  intent = enemy._intent_pool.pop();
  assert(intent !== undefined, "No intent found after when trying to get intent");
  enemy._current_intent = intent;
};