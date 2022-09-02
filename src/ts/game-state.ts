import { V2 } from "@math/vector";
import { number_sort } from "math";
import { window_reference } from "./screen";
import { unpack_number_array_from_string } from "./util";

export type GameState = [
  number[], // GAMESTATE_EVENTS
  Level, // GAMESTATE_CURRENT_DUNGEON
  Player, // GAMESTATE_PLAYER
  number[], // GAMESTATE_RESOURCES_GATHERED
  number[], // GAMESTATE_RESOURCES
  number[], // GAMESTATE_CARD_COLLECTION
  number[], // GAMESTATE_DECK
  CombatData, // GAMESTATE_COMBAT
];

export type Player = [
  number, // PLAYER_HP
  number, // PLAYER_MAX_HP
  number, // PLAYER_GAME_PROGRESS
];

export type CombatData = [
  number, // ATTACK_MODIFIER
  number, // DEFENSE_MODIFIER
  number, // BARBS
];

export type Card = [
  string, // CARD_NAME
  number, // CARD_TYPE
  number, // CARD_LEVEL
  number, // CARD_ATTACK
  number, // CARD_DEFENSE
  Effect[], // CARD_EFFECTS
];

export type Effect = [
  string, // EFFECT_DESCRIPTION
  number, // EFFECT_VALUE
  number, // EFFECT_APPLY_FUNCTION
];

export type Enemy = {
  _type: number,
  _level: number,
  _alive: boolean,
  _max_hp: number,
  _hp: number,
  _attack: number,
  _attack_debuff_turns: number,
  _attack_buff: number,
  _intent_pool: number[],
  _current_intent: number,
};

export type Room = {
  _seen: boolean,
  _peeked: boolean,
  _exit: boolean,
  _enemies: Enemy[],
  _event: number;
};

export type Level = {
  _chapter: number,
  _tile_map: Int8Array,
  _player_position: V2,
  _rooms: Room[],
  _level_resources: number[];
};

const null_level: Level = {
  _chapter: 0,
  _tile_map: new Int8Array(),
  _player_position: [0, 0],
  _rooms: [],
  _level_resources: []
};

// Gamestate Object
export let game_state: GameState;
export let setup_game_state = () =>
{
  let events: number[] = [];
  for (let i = 0; i <= 1; i++)
  {
    events[i] = 0;
  }

  let starter_deck: number[] = unpack_number_array_from_string("00000111112222266778").sort(number_sort);

  game_state = [
    events,
    null_level,
    [10, 10, 0],
    unpack_number_array_from_string("000000"),
    unpack_number_array_from_string("000000"),
    [0, 1, 2],
    starter_deck,
    [0, 0, 0]
  ];
};

// Save file handling
let save_name = "dbrad-js13k2022";
let storage = window_reference.localStorage;

export let save_game = (): void =>
{
  if (game_state)
  {
    let json = JSON.stringify(game_state);
    let b64 = btoa(json);
    storage.setItem(save_name, b64);
  }
};

export let load_game = (): void =>
{
  let b64 = storage.getItem(save_name);
  if (!b64)
  {
    setup_game_state();
    save_game();
    return;
  }
  game_state = JSON.parse(atob(b64)) as GameState;
};

export let has_save_file = (): boolean =>
{
  return storage.getItem(save_name) !== null;
};