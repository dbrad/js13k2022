import { V2 } from "@math/vector";
import { window_reference } from "./screen";
import { set_zzfx_mute } from "./zzfx";

export type GameState = [
  number[], // GAMESTATE_EVENTS
  Level // GAMESTATE_CURRENT_DUNGEON
];

export type Player = [
  number, // PLAYER_XP
  number, // PLAYER_LEVEL
  boolean, // PLAYER_LEVEL_PENDING
  number, // PLAYER_HP
  number, // PLAYER_MAX_HP
  number, // PLAYER_MP
  number, // PLAYER_MAX_MP
  number, // PLAYER_WEAPON_LEVEL
  number, // PLAYER_DEFENSE
  boolean[], // PLAYER_DEBUFFS
  number[], // PLAYER_MAGIC_LEVELS
  number[], // PLAYER_SKELETON_LEVELS
  number[], // PLAYER_ZOMBIE_LEVELS
  number[], // PLAYER_SPIRIT_LEVELS
  Summon[], // PLAYER_ACTIVE_SUMMONS
  boolean[], // PLAYER_GEM_UNLOCKED
  number[], // PLAYER_GEM_EQUIPED
  number, // PLAYER_BONES
  number, // PLAYER_FLESH
  number, // PLAYER_SOULS
];

export type Summon = [
  number, // SUMMON_TYPE
  number, // SUMMON_HP
  boolean[], // SUMMON_DEBUFFS
];

export type Enemy = [
  number, // ENEMY_TYPE
  boolean, // ENEMY_ALIVE
  number, // ENEMY_HP
  boolean[], // ENEMY_DEBUFFS
  Intent, // ENEMY_INTENT
];

type Intent = [
  number, // INTENT_TYPE
  number, // INTENT_VALUE
];

export type Room = {
  _seen: boolean,
  _peeked: boolean,
  _exit: boolean,
  _enemy: {} | null,
  _loot: [];
  _events: [];
};

export type Level = {
  _difficulty: number,
  _tile_map: Int8Array,
  _player_position: V2,
  _rooms: Room[],
};

const nullLevel: Level = {
  _difficulty: 0,
  _tile_map: new Int8Array(),
  _player_position: [0, 0],
  _rooms: [],
};

// Gamestate Object
export let game_state: GameState;
export let setup_game_state = () =>
{
  let events: number[] = [];
  for (let i = 0; i <= 0; i++)
  {
    events[i] = 0;
  }

  game_state = [
    events,
    nullLevel
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

// Save Options
type GameOptions = {
  mm: boolean, // Mute Music
  ms: boolean, // Mute Sound
  c: boolean, // Coil
};

export let options_state: GameOptions;
let initialize_options = () =>
{
  options_state = {
    mm: false,
    ms: false,
    c: false,
  };
};

let options_save_name = save_name + "-o";

export let save_options = (): void =>
{
  let json = JSON.stringify(options_state);
  let b64 = btoa(json);
  storage.setItem(options_save_name, b64);
};

export let load_options = (): void =>
{
  let b64 = storage.getItem(options_save_name);
  if (!b64)
  {
    initialize_options();
    save_options();
    return;
  }
  options_state = JSON.parse(atob(b64)) as GameOptions;

  set_zzfx_mute(options_state.ms);
};
