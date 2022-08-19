import { V2 } from "@math/vector";
import { window_reference } from "./screen";
import { set_zzfx_mute } from "./zzfx";

export type GameState = [
  number[], // GAMESTATE_EVENTS
  Level, // GAMESTATE_CURRENT_DUNGEON
  Player, // GAMESTATE_PLAYER
];

type MagicLevels = [
  number, // MAGIC_FIRE
  number, // MAGIC_ICE
  number, // MAGIC_HOLY
  number, // MAGIC_SHADOW
  number, // MAGIC_NECROMANCY
];

type SummonLevels = [
  number, // SUMMON_MAX_HP
  number, // SUMMON_ATTACK
  number, // SUMMON_DEFENSE
];

export type Summon = [
  number, // SUMMON_TYPE
  boolean, // SUMMON_SLOT_ACTIVE
  boolean, // SUMMON_ALIVE
  number, // SUMMON_HP
  boolean[], // SUMMON_DEBUFFS
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
  MagicLevels, // PLAYER_MAGIC_LEVELS
  SummonLevels[], // PLAYER_SUMMON_LEVELS
  Summon[], // PLAYER_ACTIVE_SUMMONS
  boolean[], // PLAYER_GEM_UNLOCKED
  number[], // PLAYER_GEM_EQUIPED
  number, // PLAYER_BONES
  number, // PLAYER_FLESH
  number, // PLAYER_SOULS
];

let default_player: Player =
  [
    0,
    1,
    false,
    10,
    10,
    5,
    5,
    1,
    0,
    [],
    [1, 1, 1, 1, 1],
    [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
    [[0, true, true, 1, []], [1, true, true, 1, []], [2, true, true, 1, []], [2, true, true, 1, []], [2, true, true, 1, []]],
    [false, false, false, false],
    [0, 0, 0, 0],
    0,
    0,
    0,
  ];

export type Enemy = {
  _type: number,
  _element: number,
  _alive: boolean,
  _max_hp: number,
  _hp: number,
  _attack: number,
  _block_value: number,
  _debuffs: boolean[],
  _intent_pool: Enemy_Intent[],
  _current_intent: Enemy_Intent,
};

export type Enemy_Intent = {
  _type: number,
  _value: number,
};

export type Room = {
  _seen: boolean,
  _peeked: boolean,
  _exit: boolean,
  _enemies: Enemy[],
  _loot: [];
  _events: [];
};

export type Level = {
  _tile_map: Int8Array,
  _player_position: V2,
  _rooms: Room[],
};

const null_level: Level = {
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
    null_level,
    default_player
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
