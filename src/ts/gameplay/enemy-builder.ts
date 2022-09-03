import { assert } from "@debug/assert";
import { Enemy } from "@root/game-state";
import { unpack_number_array_from_string } from "@root/util";
import { floor, random_int } from "math";

let enemy_attack_defense = "10|01|20|12|13".split("|").map(a => unpack_number_array_from_string(a));

let enemy_intents: number[][] = [
  unpack_number_array_from_string("4111"),
  unpack_number_array_from_string("2121"),
  unpack_number_array_from_string("311"),
  unpack_number_array_from_string("3141"),
  unpack_number_array_from_string("2141"),
];

export let build_enemy = (_type: number, _level: number): Enemy =>
{
  let enemy_stats = enemy_attack_defense[_type];

  let level_mod = floor(_level / 10);
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

export let get_enemy = (chapter: number, level: number, force_enemy_type: number = -1) =>
{
  let enemy_type = force_enemy_type < 0 ? (chapter === 1 ? random_int(0, 2) : random_int(0, 3)) : force_enemy_type;
  return build_enemy(enemy_type, level);
};

export let get_boss = (chapter: number, level: number) =>
{
  let enemy_type = chapter >= 5 ? 4 : 3;
  return build_enemy(enemy_type, level + 10);
};

export let get_next_enemy_intent = (enemy: Enemy) =>
{
  if (enemy._intent_pool.length === 0)
    enemy._intent_pool = structuredClone(enemy_intents[enemy._type]);
  let intent = enemy._intent_pool.pop();
  assert(intent !== undefined, "No intent found after when trying to get intent");
  enemy._current_intent = intent;
};