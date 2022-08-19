import { BLACK } from "@graphics/colour";
import { push_quad, push_textured_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { key_state } from "@input/controls";
import { V2 } from "@math/vector";
import { animation_frame } from "@root/animation";
import { game_state, Level, Room } from "@root/game-state";
import { add_interpolator, ease_out_quad, get_interpolation_data, linear } from "@root/interpolate";
import { render_panel } from "@root/nodes/panel";
import { render_player_status } from "@root/nodes/player-status";
import { render_resources } from "@root/nodes/resources";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_HEIGHT, SCREEN_WIDTH } from "@root/screen";
import { math } from "math";
import { Hub } from "./01-hub";
import { Combat } from "./04-combat";
export namespace Dungeon
{
  let selected_option_index = 0;
  let number_of_options = 3;
  let menu_options = [
    "map",
    "status",
    "retreat"
  ];

  let camera: V2 = [60 * 16, 31 * 16];
  let camera_pixel_size: V2 = [41 * 16, 25 * 16];
  let camera_half_width = math.floor(camera_pixel_size[0] / 2);
  let camera_half_height = math.floor(camera_pixel_size[1] / 2);

  let camera_top_left: V2;
  let camera_bottom_right: V2;
  let player_tile_x: number;
  let player_tile_y: number;
  let player_room_x: number;
  let player_room_y: number;
  let player_room_index: number;
  let player_room: Room;

  let mode: number = 0;
  let current_level: Level;
  let player_position: V2;

  let render_minimap = (x: number, y: number, from_x: number, to_x: number, from_y: number, to_y: number) =>
  {
    let map_width = (to_x - from_x) * 18 + 16;
    let map_height = (to_y - from_y) * 18 + 16;

    let x_offset = x - map_width / 2;
    let y_offset = y - map_height / 2;

    let panel_border = 16;
    render_panel(x_offset - panel_border, y_offset - panel_border, map_width + panel_border * 2, map_height + panel_border * 2);

    for (let y = from_y; y <= to_y; y++)
    {
      for (let x = from_x; x <= to_x; x++)
      {
        if (x < 1 || y < 0 || x > 9 || y > 7) continue;
        const current_room = current_level._rooms[y * 10 + x];

        let colour: number = 0;
        let special_colour = 0;

        if (player_room_x === x && player_room_y === y)
          colour = animation_frame ? 0xFFEEEEEE : 0xFF666666;
        else if (current_room?._seen)
          colour = 0xFF666666;
        else if (current_room?._peeked)
        {
          colour = 0xFF333333;
          if (current_room?._events.length > 0)
            special_colour = 0xFF00FFFF;
          else if (current_room?._enemies.length > 0)
            special_colour = 0xFF0000FF;
        }

        let render_x = (x - from_x) * 18 + x_offset;
        let render_y = (y - from_y) * 18 + y_offset;

        if (colour)
          push_quad(render_x, render_y, 16, 16, colour);

        if (special_colour)
          push_text("!", render_x + 4, render_y + 4, { _colour: special_colour, _scale: 1 });

        if ((current_room?._seen || current_room?._peeked) && current_room?._exit)
          push_textured_quad(TEXTURE_STAIR, render_x + 4, render_y + 4);
      };
    }
  };

  let _reset_fn = () =>
  {
    mode = 1;
    selected_option_index = 0;

    current_level = game_state[GAMESTATE_CURRENT_DUNGEON];
    player_position = current_level._player_position;

    camera[0] = player_position[0];
    camera[1] = player_position[1];
  };
  let _update_fn = (now: number, delta: number) =>
  {
    camera_top_left = [camera[0] - camera_half_width, camera[1] - camera_half_height];
    camera_bottom_right = [camera[0] + camera_half_width, camera[1] + camera_half_height];

    player_tile_x = math.floor(player_position[0] / 16);
    player_tile_y = math.floor(player_position[1] / 16);
    player_room_x = math.floor(player_tile_x / 11);
    player_room_y = math.floor(player_tile_y / 9);
    player_room_index = player_room_y * 10 + player_room_x;
    player_room = current_level._rooms[player_room_index];
    if (player_room)
      player_room._seen = true;

    if (current_level._rooms[player_room_index + 10]) current_level._rooms[player_room_index + 10]._peeked = true;
    if (current_level._rooms[player_room_index - 10]) current_level._rooms[player_room_index - 10]._peeked = true;
    if (current_level._rooms[player_room_index + 1]) current_level._rooms[player_room_index + 1]._peeked = true;
    if (current_level._rooms[player_room_index - 1]) current_level._rooms[player_room_index - 1]._peeked = true;

    let camera_lerp = get_interpolation_data(INTERP_CAMERA_MOVEMENT);
    if (camera_lerp)
    {
      let values = camera_lerp._values;
      camera[0] = math.floor(values[0]);
      camera[1] = math.floor(values[1]);
    }

    let player_lerp = get_interpolation_data(INTERP_PLAYER_MOVEMENT);
    if (player_lerp)
    {
      let values = player_lerp._values;
      player_position[0] = math.floor(values[0]);
      player_position[1] = math.floor(values[1]);
    }
    else
    {
      if (mode === 0)
      {
        // MENU MODE
        if (key_state[D_UP] === KEY_WAS_DOWN)
          selected_option_index = math.max(0, selected_option_index - 1);
        else if (key_state[D_DOWN] === KEY_WAS_DOWN)
          selected_option_index = math.min(number_of_options - 1, selected_option_index + 1);
        else if (key_state[A_BUTTON] === KEY_WAS_DOWN)
        {
          if (selected_option_index === 0)
          {
            // Map
            mode = 2;
          }
          else if (selected_option_index === 1)
          {
            // Inventory
          }
          else if (selected_option_index === 2)
          {
            // Summon
          }
          else if (selected_option_index === 3)
          {
            // Retreat
            // TODO: Confirmation window / post level wrap up
            switch_to_scene(Hub._scene_id);
          }
        }
        else if (key_state[B_BUTTON] === KEY_WAS_DOWN)
        {
          selected_option_index = 0;
          mode = 1;
        }
      }
      else if (mode === 1)
      {
        // MOVE MODE
        if (key_state[A_BUTTON] === KEY_WAS_DOWN || key_state[B_BUTTON] === KEY_WAS_DOWN)
          mode = 0;

        let target: number[] | null = null;
        if (key_state[D_UP] === KEY_WAS_DOWN)
          target = [player_position[0], player_position[1] - 16 * 9];
        else if (key_state[D_DOWN] === KEY_WAS_DOWN)
          target = [player_position[0], player_position[1] + 16 * 9];
        else if (key_state[D_LEFT] === KEY_WAS_DOWN)
          target = [player_position[0] - 16 * 11, player_position[1]];
        else if (key_state[D_RIGHT] === KEY_WAS_DOWN)
          target = [player_position[0] + 16 * 11, player_position[1]];
        if (target)
        {
          const targetRoom: V2 = [Math.floor(target[0] / 16 / 11), Math.floor(target[1] / 16 / 9)];
          const room = current_level._rooms[targetRoom[1] * 10 + targetRoom[0]];
          if (room)
          {
            add_interpolator(INTERP_CAMERA_MOVEMENT, 750, camera, target, null, ease_out_quad);
            add_interpolator(INTERP_PLAYER_MOVEMENT, 1000, player_position, target, null, linear);
            mode = 3;
          }
        }
      }
      else if (mode === 2)
      {
        // MAP MODE
        if (key_state[A_BUTTON] === KEY_WAS_DOWN || key_state[B_BUTTON] === KEY_WAS_DOWN)
          mode = 0;
      }
      else if (mode === 3)
      {
        if (player_room._enemies.length === 0)
        {
          mode = 1;
        }
        else
        {
          switch_to_scene(Combat._scene_id);
          mode = 9;
        }
      }
    }
  };
  let _render_fn = () =>
  {
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

          let tile_id = current_level._tile_map[tileY * 110 + tileX];

          if (tile_id > 4)
            push_quad(renderX, renderY, 16, 16, 0xFF1f1f1f);
          else
            push_quad(renderX, renderY, 16, 16, BLACK);

          if (tile_id > 5)
            push_textured_quad(tile_id - 6 + TEXTURE_FLOOR_0, renderX, renderY);
          else if (tile_id > 1 && tile_id < 5)
            push_textured_quad(tile_id - 2 + TEXTURE_WALL_0, renderX, renderY, { _palette_offset: 2 });

          // Lighting
          let distance = math.sqrt((player_tile_x - tileX) ** 2 + (player_tile_y - tileY) ** 2);
          if (distance >= 8)
            push_quad(renderX, renderY, 16, 16, BLACK);
          else if (distance >= 6)
            push_quad(renderX, renderY, 16, 16, 0xBD000000);
          else if (distance >= 4)
            push_quad(renderX, renderY, 16, 16, 0x7F000000);
          else if (distance >= 2)
            push_quad(renderX, renderY, 16, 16, 0x40000000);
        }
      }
    }

    // Render Player
    push_textured_quad(TEXTURE_ROBED_MAN_0, player_position[0] - camera_top_left[0] - 8, player_position[1] - camera_top_left[1] - 12, { _palette_offset: 5, _animated: true });

    if (mode === 0)
    {
      render_panel(SCREEN_WIDTH - 194, 40, 194, 100);
      render_text_menu([SCREEN_WIDTH - 97, 55], menu_options, number_of_options, selected_option_index);
    }
    else if (mode === 2)
    {
      // Map Render
      render_minimap(SCREEN_CENTER_X, SCREEN_CENTER_Y, 1, 9, 0, 7);
    }
    else
    {
      render_minimap(50, SCREEN_HEIGHT - 50, player_room_x - 1, player_room_x + 1, player_room_y - 1, player_room_y + 1);
    }
    render_player_status();
    render_resources(SCREEN_WIDTH - 160, 5);
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}