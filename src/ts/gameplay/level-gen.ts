import { assert } from "@debug/assert";
import { unpack_number_array_from_string } from "@root/util";
import { ceil, floor, math, max, random_int, shuffle } from "math";
import { Enemy, game_state, Room } from "../game-state";
import { get_boss, get_enemy } from "./enemy-builder";

let base_room_tiles = unpack_number_array_from_string("122222222211555555555115555555551155555555511555555555115555555551155555555511555555555111111111111");

let room_tile_width = 11;
let map_tile_width = 110;

let wall_deck: number[] = [];
let get_next_wall_id = (): number =>
{
  if (wall_deck.length === 0)
    wall_deck = shuffle(unpack_number_array_from_string("22234"));
  return wall_deck.pop() ?? 2;
};

let room_floor_deck: number[] = [];
let get_next_floor_id = (): number =>
{
  if (room_floor_deck.length === 0)
    room_floor_deck = shuffle(unpack_number_array_from_string("555555555678"));
  return room_floor_deck.pop() ?? 5;
};

export let generate_level = (chapter: number = 1): void =>
{
  let enemy_level = (chapter * 10);

  // Generate Room Layout
  let number_of_rooms = floor(random_int(0, 2) + 5 + chapter * 2.6);
  let room_layout: number[] = [];
  let dead_end_rooms: number[] = [];

  let is_neighbour_valid: (neighbour: number) => boolean = (neighbour: number) =>
  {
    if (neighbour <= 0 || neighbour > 79 || neighbour % 10 === 0) return false;
    if (room_layout[neighbour] && room_layout[neighbour] > 0) return false;
    if (room_count >= number_of_rooms) return false;

    let number_of_neighbours = 0;
    for (let nDir of [-1, -10, 1, 10])
    {
      let neighbours_neighbour = neighbour + nDir;
      if (room_layout[neighbours_neighbour] && room_layout[neighbours_neighbour] > 0)
      {
        number_of_neighbours++;
        if (number_of_neighbours > 1) return false;
      }
    }
    return true;
  };

  let room_count = 0;
  while (room_count < number_of_rooms)
  {
    room_count = 0;
    room_layout.length = 0;
    dead_end_rooms.length = 0;
    let room_queue: number[] = [];
    room_layout[35] = 1;
    room_queue[0] = 35;
    do
    {
      let room = room_queue.shift();
      if (room)
      {
        let room_added = false;
        let dirs = shuffle([10, -1, 1, -10]);
        for (let dir of dirs)
        {
          let neighbour = room + dir;
          if (!is_neighbour_valid(neighbour)) continue;
          if (random_int(0, 100) < 50) continue;

          room_layout[neighbour] = 1;
          room_queue.push(neighbour);
          room_added = true;
          room_count++;
        }
        if (!room_added)
          dead_end_rooms.push(room);
      }
    } while (room_queue.length > 0);
  }

  // Generate Tile Map for Room Layout
  let tile_map: Int8Array = new Int8Array(map_tile_width * 72);
  for (let ry = 0; ry < 8; ry++)
  {
    for (let rx = 1; rx <= 9; rx++)
    {
      let room_index = ry * 10 + rx;
      if (room_layout[room_index] === 1)
      {
        let x = rx * room_tile_width;
        let y = ry * 9;
        for (let ty = 0; ty < 9; ty++)
        {
          for (let tx = 0; tx < room_tile_width; tx++)
          {
            let index = ((y + ty) * map_tile_width) + (x + tx);
            if (base_room_tiles[ty * room_tile_width + tx] === 2)
              tile_map[index] = get_next_wall_id();
            else if (base_room_tiles[ty * room_tile_width + tx] === 5)
              tile_map[index] = get_next_floor_id();
            else
              tile_map[index] = base_room_tiles[ty * room_tile_width + tx];
          }
        }

        // check for door to north
        if (room_layout[room_index - 10] === 1) 
        {
          let nx = x + 5;
          let ny = y + 0;
          let index = ny * map_tile_width + nx;
          tile_map[index] = 5;
        }

        // check for door to east
        if (room_layout[room_index + 1] === 1)
        {
          let nx = x + 10;
          let ny = y + 4;
          let index = ny * map_tile_width + nx;
          tile_map[index] = 5;
          tile_map[index - 110] = 2;
        }

        // check for door to south
        if (room_layout[room_index + 10] === 1)
        {
          let nx = x + 5;
          let ny = y + 8;
          let index = ny * map_tile_width + nx;
          tile_map[index] = 5;
        }

        // check for door to west
        if (room_layout[room_index - 1] === 1)
        {
          let nx = x + 0;
          let ny = y + 4;
          let index = ny * map_tile_width + nx;
          tile_map[index] = 5;
          tile_map[index - 110] = 2;
        }
      }
    }
  }

  // Generate Room Contents
  let rooms: Room[] = [];
  let room_deck: Room[] = create_room_deck(number_of_rooms, dead_end_rooms.length, chapter, enemy_level);
  let shuffled_dead_end_rooms = shuffle(dead_end_rooms);
  for (let index of shuffled_dead_end_rooms)
  {
    if (room_layout[index] === 1)
    {
      room_layout[index] = 2;
      rooms[index] = room_deck.shift() || create_empty_room();
    }
  }

  for (let ry = 0; ry < 8; ry++)
  {
    for (let rx = 1; rx <= 9; rx++)
    {
      let room_index = ry * 10 + rx;
      if (room_layout[room_index] === 1 && room_index != 35)
      {
        room_layout[room_index] = 2;
        rooms[room_index] = room_deck.shift() || create_empty_room();
      }
    }
  }

  rooms[35] = create_empty_room();
  rooms[35]._seen = true;

  game_state[GAMESTATE_CURRENT_DUNGEON] = {
    _chapter: chapter,
    _player_position: [60 * 16, 31 * 16],
    _tile_map: tile_map,
    _rooms: rooms,
    _level_resources: [0, 0, 0, 0, 0]
  };
};

let create_room_deck = (number_of_roooms: number, number_of_dead_ends: number, chapter: number, enemy_level: number): Room[] =>
{
  let room_deck: Room[] = [];
  number_of_dead_ends -= 1;
  room_deck.push(create_combat_room(chapter, enemy_level, true));

  let dead_end_rooms: Room[] = [];

  let number_of_choice_rooms = max(0, ceil(number_of_dead_ends * 0.6));
  for (let i = 0; i < number_of_choice_rooms; i++)
    dead_end_rooms.push(create_event_room());

  let number_of_dead_end_combat = max(0, number_of_dead_ends - number_of_choice_rooms);
  for (let i = 0; i < number_of_dead_end_combat; i++)
    dead_end_rooms.push(create_combat_room(chapter, enemy_level));

  room_deck.push(...shuffle(dead_end_rooms));


  let hallway_rooms: Room[] = [];

  let rooms_remaining = number_of_roooms - number_of_choice_rooms - number_of_dead_end_combat;
  let number_of_combat = max(0, ceil(rooms_remaining * 0.5));
  for (let i = 0; i < number_of_combat; i++)
    hallway_rooms.push(create_combat_room(chapter, enemy_level));

  let number_of_empty = max(0, ceil((rooms_remaining - number_of_combat) * 0.8));
  for (let i = 0; i < number_of_empty; i++)
    hallway_rooms.push(create_empty_room());

  let number_of_hallway_events = max(0, rooms_remaining - number_of_combat - number_of_empty);
  for (let i = 0; i < number_of_hallway_events; i++)
    hallway_rooms.push(create_event_room());

  room_deck.push(...shuffle(hallway_rooms));

  assert(number_of_roooms <= room_deck.length, "Level generator did not make enough rooms!");
  return room_deck;
};

let create_empty_room = (): Room =>
{
  return {
    _seen: false,
    _peeked: false,
    _enemies: [],
    _exit: false,
    _event: 0
  };
};

let create_event_room = (): Room =>
{
  return {
    _seen: false,
    _peeked: false,
    _enemies: [],
    _exit: false,
    _event: 2
  };
};

let boss_minions = [
  unpack_number_array_from_string("012",),
  unpack_number_array_from_string("000",),
  unpack_number_array_from_string("111",),
  unpack_number_array_from_string("222",),
  unpack_number_array_from_string("012",),
  unpack_number_array_from_string("020",),
  unpack_number_array_from_string("101",),
  unpack_number_array_from_string("212",),
];
let create_combat_room = (chapter: number, enemy_level: number, is_boss: boolean = false): Room =>
{
  let number_of_enemies = is_boss ? 3 : math.min(4, random_int(1, ceil(enemy_level / 10) + 1));
  let level = number_of_enemies >= 3 ? ceil(enemy_level / 3) : number_of_enemies === 2 ? enemy_level / 2 : enemy_level;

  let enemies: Enemy[] = [];
  if (is_boss)
  {
    enemies.push(get_boss(chapter, level));
    let minions = boss_minions[chapter - 1];
    for (let minion of minions)
      enemies.push(get_enemy(chapter, level, minion));
  }
  else
    for (let i = 0; i < number_of_enemies; i++)
      enemies.push(get_enemy(chapter, level));

  return {
    _seen: false,
    _peeked: false,
    _enemies: enemies,
    _exit: is_boss,
    _event: 0
  };
};
