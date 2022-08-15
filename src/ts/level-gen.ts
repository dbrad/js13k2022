import { assert } from "@debug/assert";
import { math, random_int, shuffle } from "math";
import { game_state, Room } from "./game-state";

let base_room_tiles = "122222222211555555555115555555551155555555511555555555115555555551155555555511555555555111111111111".split("").map(n => +n);

let north_door = [5, 0];
let south_door = [5, 8];
let west_door = [0, 4];
let east_door = [10, 4];

let map_room_width = 9;
let map_room_height = 8;
let room_tile_width = 11;
let room_tile_height = 9;
let map_tile_width = 110;
let map_tile_height = 72;

let difficulty_muliplier = 0;

let wall_deck: number[] = [];
let get_next_wall_id = (): number =>
{
  if (wall_deck.length === 0)
    wall_deck = shuffle([2, 2, 2, 3, 4]);
  return wall_deck.pop() ?? 2;
};

let floor_deck: number[] = [];
let get_next_floor_id = (): number =>
{
  if (floor_deck.length === 0)
    floor_deck = shuffle([5, 5, 5, 5, 5, 5, 5, 6, 7, 8]);
  return floor_deck.pop() ?? 5;
};

export let generate_level = (difficulty: number = 0): void =>
{
  difficulty_muliplier = difficulty;

  // Generate Room Layout
  let number_of_rooms = math.floor(random_int(0, 2) + 5 + difficulty_muliplier * 2.6);
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
        if (number_of_neighbours > 1) break;
      }
    }
    if (number_of_neighbours > 1) return false;
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
    room_queue.push(35);
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
        {
          dead_end_rooms.push(room);
        }
      }
    } while (room_queue.length > 0);
  }

  // Generate Tile Map for Room Layout
  let tile_map: Int8Array = new Int8Array(map_tile_width * map_tile_height);
  for (let ry = 0; ry < map_room_height; ry++)
  {
    for (let rx = 1; rx <= map_room_width; rx++)
    {
      let room_index = ry * 10 + rx;
      if (room_layout[room_index] === 1)
      {
        let x = rx * room_tile_width;
        let y = ry * room_tile_height;
        for (let ty = 0; ty < room_tile_height; ty++)
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
          let nx = x + north_door[0];
          let ny = y + north_door[1];
          let index = ny * map_tile_width + nx;
          tile_map[index] = 5;
        }

        // check for door to east
        if (room_layout[room_index + 1] === 1)
        {
          let nx = x + east_door[0];
          let ny = y + east_door[1];
          let index = ny * map_tile_width + nx;
          tile_map[index] = 5;
          tile_map[index - 110] = 2;
        }

        // check for door to south
        if (room_layout[room_index + 10] === 1)
        {
          let nx = x + south_door[0];
          let ny = y + south_door[1];
          let index = ny * map_tile_width + nx;
          tile_map[index] = 5;
        }

        // check for door to west
        if (room_layout[room_index - 1] === 1)
        {
          let nx = x + west_door[0];
          let ny = y + west_door[1];
          let index = ny * map_tile_width + nx;
          tile_map[index] = 5;
          tile_map[index - 110] = 2;
        }
      }
    }
  }

  // Generate Room Locations
  let rooms: Room[] = [];
  let room_deck: Room[] = create_room_deck(number_of_rooms, dead_end_rooms.length);
  let shuffled_dead_end_rooms = shuffle(dead_end_rooms);
  for (let index of shuffled_dead_end_rooms)
  {
    if (room_layout[index] === 1)
    {
      room_layout[index] = 2;
      rooms[index] = room_deck.shift() || create_empty_room();
    }
  }

  for (let ry = 0; ry < map_room_height; ry++)
  {
    for (let rx = 1; rx <= map_room_width; rx++)
    {
      let roomIndex = ry * 10 + rx;
      if (room_layout[roomIndex] === 1 && roomIndex != 35)
      {
        room_layout[roomIndex] = 2;
        rooms[roomIndex] = room_deck.shift() || create_empty_room();
      }
    }
  }
  rooms[35] = create_empty_room();
  rooms[35]._seen = true;

  game_state[GAMESTATE_CURRENT_DUNGEON] = {
    _difficulty: difficulty_muliplier,
    _player_position: [60 * 16, 31 * 16],
    _tile_map: tile_map,
    _rooms: rooms,
  };
};

let create_room_deck = (numberOfRooms: number, numberOfDeadEnds: number): Room[] =>
{
  let roomDeck: Room[] = [];
  numberOfDeadEnds -= 1;
  roomDeck.push(create_boss_room(numberOfRooms));

  let deadEndRooms: Room[] = [];
  let numberOfChoices = math.max(0, math.ceil(numberOfDeadEnds * 0.5));
  for (let i = 0; i < numberOfChoices; i++)
  {
    deadEndRooms.push(create_choice_room(numberOfRooms));
  }

  let numberOfBoonsOrCurses = math.max(0, math.ceil((numberOfDeadEnds - numberOfChoices) * 0.8));
  for (let i = 0; i < numberOfBoonsOrCurses; i++)
  {
    deadEndRooms.push(create_event_room(numberOfRooms));
  }

  let numberOfDialogs = math.max(0, numberOfDeadEnds - numberOfChoices - numberOfBoonsOrCurses);
  for (let i = 0; i < numberOfDialogs; i++)
  {
    deadEndRooms.push(create_empty_room());
  }

  roomDeck.push(...shuffle(deadEndRooms));

  let numberOfRoomsRemaining = numberOfRooms - numberOfChoices - numberOfBoonsOrCurses - numberOfDialogs;
  let numberOfCombat = math.max(0, math.ceil(numberOfRoomsRemaining * 0.5));
  let regularRooms: Room[] = [];
  for (let i = 0; i < numberOfCombat; i++)
  {
    regularRooms.push(create_combat_room(numberOfRoomsRemaining));
  }

  let numberOfMoney = math.max(0, math.ceil((numberOfRoomsRemaining - numberOfCombat) * 0.6));
  for (let i = 0; i < numberOfMoney; i++)
  {
    regularRooms.push(create_empty_room());
  }

  let numberOfTreasures = math.max(0, numberOfRoomsRemaining - numberOfCombat - numberOfMoney);
  for (let i = 0; i < numberOfTreasures; i++)
  {
    regularRooms.push(create_loot_room(numberOfRoomsRemaining));
  }

  roomDeck.push(...shuffle(regularRooms));

  assert(numberOfRooms <= roomDeck.length, "Level generator did not make enough rooms!");
  return roomDeck;
};

let create_empty_room = (): Room =>
{
  return {
    _seen: false,
    _peeked: false,
    _enemy: null,
    _exit: false,
    _loot: [],
    _events: []
  };
};

let create_boss_room = (numberOfRooms: number): Room =>
{
  let hp = random_int(5 + difficulty_muliplier, 10 + difficulty_muliplier);
  let atk = random_int(1, difficulty_muliplier);
  let def = random_int(1, difficulty_muliplier);

  return {
    _seen: false,
    _peeked: false,
    _enemy: {
      alive: true,
      health: hp,
      maxHealth: hp,
      attack: atk,
      defense: def,
      type: 0
    },
    _exit: true,
    _loot: [],
    _events: []
  };
};

let create_choice_room = (numberOfRooms: number): Room =>
{
  return {
    _seen: false,
    _peeked: false,
    _enemy: null,
    _exit: false,
    _loot: [],
    _events: []
  };
};

let create_event_room = (numberOfRooms: number): Room =>
{
  return {
    _seen: false,
    _peeked: false,
    _enemy: null,
    _exit: false,
    _loot: [],
    _events: []
  };
};

let create_combat_room = (numberOfRooms: number): Room =>
{
  let hp = random_int(3 + difficulty_muliplier, 6 + difficulty_muliplier);
  let atk = random_int(1, math.max(1, difficulty_muliplier - 1));
  let def = random_int(0, difficulty_muliplier);

  return {
    _seen: false,
    _peeked: false,
    _enemy:
    {
      alive: true,
      health: hp,
      maxHealth: hp,
      attack: atk,
      defense: def,
      type: 0
    },
    _exit: false,
    _loot: [],
    _events: []
  };
};

let create_loot_room = (numberOfRooms: number): Room =>
{
  return {
    _seen: false,
    _peeked: false,
    _enemy: null,
    _exit: false,
    _loot: [],
    _events: []
  };
};