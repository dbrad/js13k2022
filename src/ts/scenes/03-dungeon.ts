import { push_quad } from "@graphics/quad";
import { key_state } from "@input/controls";
import { set_V2, V2 } from "@math/vector";
import { game_state } from "@root/game-state";
import { get_next_scene_id, Scene } from "@root/scene";
import { math } from "math";
export namespace Dungeon
{
  let animationTimer = 0;
  let frame = 0;

  let camera: V2 = [60 * 16, 31 * 16];
  let camera_pixel_size: V2 = [41 * 16, 25 * 16];
  let camera_half_width = math.floor(camera_pixel_size[0] / 2);
  let camera_half_height = math.floor(camera_pixel_size[1] / 2);

  let _setup_fn = () => { };
  let _reset_fn = () => { };
  let _update_fn = (now: number, delta: number) =>
  {
    let current_level = game_state[GAMESTATE_CURRENT_DUNGEON];
    let player_position = current_level._player_position;

    animationTimer += delta;
    if (animationTimer > 500)
    {
      if (animationTimer > 1000) animationTimer = 0;
      animationTimer -= 500;
      frame = ++frame % 2;
    }

    let target: number[] | null = null;
    if (key_state.get(D_UP) === KEY_WAS_DOWN)
    {
      target = [player_position[0], player_position[1] - 16 * 9];
    }
    else if (key_state.get(D_DOWN) === KEY_WAS_DOWN)
    {
      target = [player_position[0], player_position[1] + 16 * 9];
    }
    else if (key_state.get(D_LEFT) === KEY_WAS_DOWN)
    {
      target = [player_position[0] - 16 * 11, player_position[1]];
    }
    else if (key_state.get(D_RIGHT) === KEY_WAS_DOWN)
    {
      target = [player_position[0] + 16 * 11, player_position[1]];
    }
    if (target)
    {
      const targetRoom: V2 = [Math.floor(target[0] / 16 / 11), Math.floor(target[1] / 16 / 9)];
      const room = current_level._rooms[targetRoom[1] * 10 + targetRoom[0]];
      if (room)
      {
        set_V2(camera, target[0], target[1]);
        set_V2(player_position, target[0], target[1]);
      }
    }
  };
  let _render_fn = () =>
  {
    let camera_top_left: V2 = [camera[0] - camera_half_width, camera[1] - camera_half_height];
    let camera_bottom_right: V2 = [camera[0] + camera_half_width, camera[1] + camera_half_height];
    let current_level = game_state[GAMESTATE_CURRENT_DUNGEON];

    let player_tile_x = math.floor(current_level._player_position[0] / 16);
    let player_tile_y = math.floor(current_level._player_position[1] / 16);

    let player_room_x = math.floor(player_tile_x / 11);
    let player_room_y = math.floor(player_tile_y / 9);

    let player_room_index = player_room_y * 10 + player_room_x;
    let player_room = current_level._rooms[player_room_index];
    if (player_room)
      player_room._seen = true;

    if (current_level._rooms[player_room_index + 10]) current_level._rooms[player_room_index + 10]._peeked = true;
    if (current_level._rooms[player_room_index - 10]) current_level._rooms[player_room_index - 10]._peeked = true;
    if (current_level._rooms[player_room_index + 1]) current_level._rooms[player_room_index + 1]._peeked = true;
    if (current_level._rooms[player_room_index - 1]) current_level._rooms[player_room_index - 1]._peeked = true;

    for (let y = camera_top_left[1]; y <= camera_bottom_right[1]; y += 16)
    {
      for (let x = camera_top_left[0]; x <= camera_bottom_right[0]; x += 16)
      {
        let tileX = math.floor(x / 16);
        let tileY = math.floor(y / 16);

        if (tileX > 0 && tileX < 110 && tileY >= 0 && tileY < 72)
        {
          let renderX = tileX * 16 - camera_top_left[0] - 8;
          let renderY = tileY * 16 - camera_top_left[1] - 12;

          // TODO: Add floor and wall variations based on tile Id
          let colour = current_level._tile_map[tileY * 110 + tileX] <= 4 ? 0xFF222222 : 0xFF777777;
          push_quad(renderX, renderY, 16, 16, colour);

          // Lighting
          let distance = math.sqrt((player_tile_x - tileX) ** 2 + (player_tile_y - tileY) ** 2);
          if (distance >= 7)
            push_quad(renderX, renderY, 16, 16, 0xDD000000);
          else if (distance >= 5)
            push_quad(renderX, renderY, 16, 16, 0xBD000000);
          else if (distance >= 3)
            push_quad(renderX, renderY, 16, 16, 0x7F000000);
          else if (distance >= 2)
            push_quad(renderX, renderY, 16, 16, 0x40000000);
        }
      }
    }

    push_quad(current_level._player_position[0] - camera_top_left[0] - 8, current_level._player_position[1] - camera_top_left[1] - 12, 16, 16, 0xFFFFFFFF);

    for (let y = 0; y < 8; y++)
    {
      for (let x = 1; x <= 9; x++)
      {
        const current_room = current_level._rooms[y * 10 + x];
        if (player_room_x === x && player_room_y === y)
        {
          if (frame)
            push_quad(x * 18 + 1, y * 18 + 1 + 200, 16, 16, 0xFFEEEEEE);
          else
            push_quad(x * 18 + 1, y * 18 + 1 + 200, 16, 16, 0xFF666666);
        }
        else if (current_room?._seen)
        {
          push_quad(x * 18 + 1, y * 18 + 1 + 200, 16, 16, 0xFF666666);
        }
        else if (current_room?._peeked)
        {
          push_quad(x * 18 + 1, y * 18 + 1 + 200, 16, 16, 0xFF333333);

          if (current_room?._enemy && !current_room?._exit)
          {
            push_quad(x * 18 + 1, y * 18 + 1 + 200, 16, 16, 0xFF0000FF);
          }
        }

        if ((current_room?._seen || current_room?._peeked) && current_room?._exit)
        {
          push_quad(x * 18 + 1, y * 18 + 1 + 200, 16, 16, 0xFF00FF00);
        }
      }
    }
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _setup_fn, _reset_fn, _update_fn, _render_fn };
}