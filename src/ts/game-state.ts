import { V2 } from "@math/vector";
import { window_reference } from "./screen";
import { set_zzfx_mute } from "./zzfx";

export type GameState = [
  number[], // GAMESTATE_EVENTS
  Level // GAMESTATE_CURRENT_DUNGEON
];

export type EquipmentSlots = [];
export type SpellUnlocks = [];
export type MetaPlayer = [
  number, // META_PLAYER_LEVEL
  number, // META_PLAYER_XP
  number, // META_PLAYER_MAX_HP
  number, // META_PLAYER_MAX_MP
  number, // META_PLAYER_GOLD
  number, // META_PLAYER_METALS
  number, // META_PLAYER_GEMS
  number, // META_PLAYER_BONES
  number, // META_PLAYER_FLESH
  number, // META_PLAYER_SOULS
];

type DungeonPlayer = {
  _health: number,
  _mana: number,
};
export type Enemy = {
  _alive: boolean,
  _health: number,
  _maxHealth: number,
  _attack: number,
  _defense: number,
  _abilities: number[];
};
export type Room = {
  _seen: boolean,
  _peeked: boolean,
  _exit: boolean,
  _enemy: {} | null,
  _loot: [];
  _events: [];
};
type Level = {
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
