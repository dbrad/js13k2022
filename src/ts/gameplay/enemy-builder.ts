import { assert } from "@debug/assert";
import { V2 } from "@math/vector";
import { Enemy } from "@root/game-state";
import { math, random_int } from "math";

let enemy_attack_defense: V2[] = [
  [1, 0], // ENEMY_TYPE_SKELETON
  [0, 1], // ENEMY_TYPE_ZOMBIE
  [2, 0], // ENEMY_TYPE_SPIRIT
  [1, 2], // ENEMY_TYPE_CULTIST
  [1, 3], // ENEMY_TYPE_LICH
];

let enemy_intents: number[][] = [
  [ENEMY_INTENT_TYPE_ATTACK],
  [ENEMY_INTENT_TYPE_ATTACK, ENEMY_INTENT_TYPE_ATTACK_HEAL, ENEMY_INTENT_TYPE_ATTACK],
  [ENEMY_INTENT_TYPE_HEAL, ENEMY_INTENT_TYPE_ATTACK, ENEMY_INTENT_TYPE_ATTACK],
  [ENEMY_INTENT_TYPE_HEAL, ENEMY_INTENT_TYPE_ATTACK, ENEMY_INTENT_TYPE_BUFF, ENEMY_INTENT_TYPE_ATTACK],
  [ENEMY_INTENT_TYPE_ATTACK_HEAL, ENEMY_INTENT_TYPE_ATTACK, ENEMY_INTENT_TYPE_BUFF, ENEMY_INTENT_TYPE_ATTACK],
];

export let build_enemy = (_type: number, _level: number): Enemy =>
{
  let enemy_stats = enemy_attack_defense[_type];

  let level_mod = math.floor(_level / 10);
  let mod_plus_one = level_mod + 1;

  let _attack = random_int(mod_plus_one, mod_plus_one + (mod_plus_one * enemy_stats[0]));
  let _hp = ((_level * 2 - (_attack * 2)) + (level_mod * enemy_stats[1]));

  return {
    _type,
    _level,
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
  // TODO: Change enemy skew based on chapter
  let enemy_type = chapter === 1 ? random_int(0, 2) : random_int(0, 3);
  return build_enemy(enemy_type, level);
};

export let get_boss = (chapter: number, level: number) =>
{
  let enemy_type = chapter === 4 ? 4 : 3;
  return build_enemy(enemy_type, level + 5);
};

export let get_next_enemy_intent = (enemy: Enemy) =>
{
  if (enemy._intent_pool.length === 0)
    enemy._intent_pool = structuredClone(enemy_intents[enemy._type]);
  let intent = enemy._intent_pool.pop();
  assert(intent !== undefined, "No intent found after when trying to get intent");
  enemy._current_intent = intent;
};