import { Effect, Enemy, game_state } from "@root/game-state";
import { safe_add } from "math";


let attack_modifier = (effect: Effect) =>
{
  game_state[GAMESTATE_COMBAT][ATTACK_MODIFIER] += effect[EFFECT_VALUE];
};

let defense_modifier = (effect: Effect) =>
{
  game_state[GAMESTATE_COMBAT][DEFENSE_MODIFIER] += effect[EFFECT_VALUE];
};

let heal = (effect: Effect) =>
{
  let player = game_state[GAMESTATE_PLAYER];
  player[PLAYER_HP] = safe_add(player[PLAYER_MAX_HP], player[PLAYER_HP], effect[EFFECT_VALUE]);
};

let weaken = (effect: Effect, enemy: Enemy) =>
{
  enemy._attack_debuff_turns += effect[EFFECT_VALUE];
};

let barbs = (effect: Effect) =>
{
  game_state[GAMESTATE_COMBAT][2] += effect[EFFECT_VALUE];
};

export type EffectFunction = (effect: Effect) => void;
export type TargetedEffectFunction = (effect: Effect, enemy: Enemy) => void;
export let effects: (EffectFunction | TargetedEffectFunction)[] = [
  attack_modifier,
  defense_modifier,
  heal,
  weaken,
  barbs
];

export let build_attack_modifier = (value: number): Effect =>
  [
    "attack",
    value,
    0
  ];


export let build_defense_modifier = (value: number): Effect =>
  [
    "defense",
    value,
    1
  ];


export let build_heal = (value: number): Effect =>
  [
    "heal",
    value,
    2
  ];

export let build_barbs = (value: number): Effect =>
  [
    "barbs",
    value,
    4
  ];

export let build_weaken = (value: number): Effect =>
  [
    "weaken",
    value,
    3
  ];