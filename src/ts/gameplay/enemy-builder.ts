import { Enemy } from "@root/game-state";
import { math, random_int } from "math";

type EnemyData = [
  number, // ENEMY_ATTACK_MODIFIER
  number, // ENEMY_DEFENSE_MODIFIER
];

let enemy_data: EnemyData[] = [
  [0, 1], // ENEMY_TYPE_SKELETON
  [1, 0], // ENEMY_TYPE_ZOMBIE
  [0, 0], // ENEMY_TYPE_SPIRIT
  [1, 1], // ENEMY_TYPE_BANDIT
  [1, 0], // ENEMY_TYPE_MAGE
  [2, 1], // ENEMY_TYPE_LICH
];
export let build_enemy = (enemy_type: number, level: number, element: number): Enemy =>
{
  let enemy_stats = enemy_data[enemy_type];

  let level_mod = math.floor(level / 10);
  let mod_plus_one = level_mod + 1;

  let attack = random_int(mod_plus_one, mod_plus_one + (mod_plus_one * enemy_stats[0]));
  let defense = random_int(mod_plus_one + enemy_stats[1], level_mod + (mod_plus_one * enemy_stats[1]));
  let hp = level - (attack * 2) - (defense - 1);

  return [
    enemy_type,
    element,
    true,
    hp,
    hp,
    attack,
    defense,
    [],
    [ENEMY_INTENT_TYPE_ATTACK, attack]
  ];
};

export let get_enemy = (chapter: number, level: number) =>
{
  let enemy_type = chapter < 3 ? random_int(0, 2) : random_int(0, 4);
  let element = chapter < 5 ? random_int(0, 1) * chapter - 1 : random_int(0, 4);
  return build_enemy(enemy_type, level, element);
};

export let get_shuffled_enemy_move_pool = (enemy: Enemy) =>
{

};