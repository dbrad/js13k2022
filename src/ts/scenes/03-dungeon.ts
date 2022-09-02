import { BLACK, BLACK_T25, BLACK_T50, BLACK_T75, DARK_GREY, FLOOR_COLOUR, LIGHT_GREY, RED, YELLOW } from "@graphics/colour";
import { push_quad, push_textured_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { A_PRESSED, B_PRESSED, controls_used, DOWN_PRESSED, LEFT_PRESSED, RIGHT_PRESSED, UP_PRESSED } from "@input/controls";
import { V2 } from "@math/vector";
import { animation_frame } from "@root/animation";
import { game_state, Level, Room } from "@root/game-state";
import { lerp } from "@root/interpolate";
import { render_panel } from "@root/nodes/panel";
import { render_player_status } from "@root/nodes/player-status";
import { render_resources } from "@root/nodes/resources";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, push_scene, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_HEIGHT, SCREEN_WIDTH } from "@root/screen";
import { math, safe_add, safe_subtract } from "math";
import { Hub } from "./01-hub";
import { Combat } from "./04-combat";
import { Dialog } from "./20-dialog";
export namespace Dungeon
{
  let selected_option_index = 0;
  let number_of_options = 2;
  let menu_options = [
    "full map",
    "retreat"
  ];
  let boss_defeated = false;

  let camera: V2 = [60 * 16, 31 * 16];
  let camera_pixel_size: V2 = [41 * 16, 25 * 16];
  let camera_half_width = math.floor(camera_pixel_size[0] / 2);
  let camera_half_height = math.floor(camera_pixel_size[1] / 2);

  let player_origin: V2 = [0, 0];
  let player_move_time_remaining = 0;
  let player_moving = false;
  let player_target: number[] = [];

  let camera_top_left: V2;
  let camera_bottom_right: V2;
  let player_tile_x: number;
  let player_tile_y: number;
  let player_room_x: number;
  let player_room_y: number;
  let player_room_index: number;
  let player_room: Room;
  let player_hflip = false;

  let mode: number = 0;
  let current_level: Level;
  let rooms: Room[];
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
        const current_room = rooms[y * 10 + x];

        let colour: number = 0;
        let special_colour = 0;

        if (player_room_x === x && player_room_y === y)
          colour = animation_frame ? 0xffeeeeee : LIGHT_GREY;
        else if (current_room?._seen)
          colour = LIGHT_GREY;
        else if (current_room?._peeked)
        {
          colour = DARK_GREY;
          if (current_room?._event > 0)
            special_colour = YELLOW;
          else if (current_room?._enemies.length > 0)
            special_colour = RED;
        }

        let render_x = (x - from_x) * 18 + x_offset;
        let render_y = (y - from_y) * 18 + y_offset;

        if (colour)
          push_quad(render_x, render_y, 16, 16, colour);

        if (special_colour)
          push_text("!", render_x + 4, render_y + 4, { _colour: special_colour });

        if ((current_room?._seen || current_room?._peeked) && current_room?._exit)
          push_textured_quad(TEXTURE_STAIR, render_x + 4, render_y + 4);
      };
    }
  };

  let post_area_wrap_up = () =>
  {
    game_state[GAMESTATE_PLAYER][PLAYER_GAME_PROGRESS] = math.max(game_state[GAMESTATE_PLAYER][PLAYER_GAME_PROGRESS], current_level._chapter);
    for (let r = 0; r < 5; r++)
      game_state[GAMESTATE_RESOURCES][r] += current_level._level_resources[r];
  };

  let _reset_fn = () =>
  {
    mode = 3;
    selected_option_index = 0;
    boss_defeated = false;

    current_level = game_state[GAMESTATE_CURRENT_DUNGEON];
    rooms = current_level._rooms;
    player_position = current_level._player_position;

    camera[0] = player_position[0];
    camera[1] = player_position[1];
  };

  let _update_fn = (delta: number) =>
  {
    controls_used();

    camera_top_left = [camera[0] - camera_half_width, camera[1] - camera_half_height];
    camera_bottom_right = [camera[0] + camera_half_width, camera[1] + camera_half_height];

    player_tile_x = math.floor(player_position[0] / 16);
    player_tile_y = math.floor(player_position[1] / 16);
    player_room_x = math.floor(player_tile_x / 11);
    player_room_y = math.floor(player_tile_y / 9);
    player_room_index = player_room_y * 10 + player_room_x;
    player_room = rooms[player_room_index];
    if (player_room)
      player_room._seen = true;

    if (rooms[player_room_index + 10]) rooms[player_room_index + 10]._peeked = true;
    if (rooms[player_room_index - 10]) rooms[player_room_index - 10]._peeked = true;
    if (rooms[player_room_index + 1]) rooms[player_room_index + 1]._peeked = true;
    if (rooms[player_room_index - 1]) rooms[player_room_index - 1]._peeked = true;

    camera[0] += math.ceil((player_position[0] - camera[0]) * 0.5 * (delta / 500));
    camera[1] += math.ceil((player_position[1] - camera[1]) * 0.5 * (delta / 500));

    if (player_moving)
    {
      player_move_time_remaining = safe_subtract(player_move_time_remaining, delta);
      if (player_move_time_remaining <= 0)
        player_moving = false;

      let time_remaining = player_move_time_remaining / 750;
      player_position[0] = math.floor(lerp(player_target[0], player_origin[0], time_remaining));
      player_position[1] = math.floor(lerp(player_target[1], player_origin[1], time_remaining));
    }
    else
    {
      if (mode === 0)
      {
        controls_used(D_UP, D_DOWN, A_BUTTON, B_BUTTON);

        // MENU MODE
        if (UP_PRESSED)
          selected_option_index = safe_subtract(selected_option_index, 1);
        else if (DOWN_PRESSED)
          selected_option_index = safe_add(number_of_options - 1, selected_option_index, 1);
        else if (A_PRESSED)
        {
          if (!selected_option_index)
          {
            // FULL MAP
            mode = 2;
          }
          else
          {
            // Retreat
            let text = boss_defeated ? "exit this area and take all reagents with you?" : "retreat to the entrance?|you will lose all progress and reagents|from in this area.";
            Dialog._push_yes_no_dialog(text, () => mode = 4);
            push_scene(Dialog._scene_id);
          }
        }
        else if (B_PRESSED)
        {
          selected_option_index = 0;
          mode = 1;
        }
      }
      else if (mode === 1)
      {
        controls_used(D_UP, D_DOWN, D_LEFT, D_RIGHT, A_BUTTON, B_BUTTON);

        // MOVE MODE
        if (A_PRESSED || B_PRESSED)
          mode = 0;

        let movement_target: number[] | null = null;
        if (UP_PRESSED)
          movement_target = [player_position[0], player_position[1] - 16 * 9];
        else if (DOWN_PRESSED)
          movement_target = [player_position[0], player_position[1] + 16 * 9];
        else if (LEFT_PRESSED)
        {
          movement_target = [player_position[0] - 16 * 11, player_position[1]];
          player_hflip = true;
        }
        else if (RIGHT_PRESSED)
        {
          movement_target = [player_position[0] + 16 * 11, player_position[1]];
          player_hflip = false;
        }
        if (movement_target)
        {
          const targetRoom: V2 = [Math.floor(movement_target[0] / 16 / 11), Math.floor(movement_target[1] / 16 / 9)];
          const room = rooms[targetRoom[1] * 10 + targetRoom[0]];
          if (room)
          {
            player_target[0] = movement_target[0];
            player_target[1] = movement_target[1];
            player_origin[0] = player_position[0];
            player_origin[1] = player_position[1];
            player_moving = true;
            player_move_time_remaining = 750;
            mode = 3;
          }
        }
      }
      else if (mode === 2)
      {
        controls_used(A_BUTTON, B_BUTTON);
        // MAP MODE
        if (A_PRESSED || B_PRESSED)
          mode = 0;
      }
      else if (mode === 3)
      {
        // TRIGGER EVENTS / COMBAT
        let any_enemies_alive = false;
        for (let enemy of player_room._enemies)
          any_enemies_alive = any_enemies_alive || enemy._alive;
        if (any_enemies_alive)
        {
          switch_to_scene(Combat._scene_id);
        }
        else
        {
          // Events / Exit
          if (player_room._exit)
          {
            boss_defeated = true;
            menu_options[1] = "leave area";
            // Offer player exit
            Dialog._push_yes_no_dialog("boss of the area defeated.|leave this area and return to the entrance?", () => mode = 4);
            push_scene(Dialog._scene_id);
          }
          else if (player_room._event > 0)
          {
            switch (player_room._event)
            {
              case 1: // Random Resource Gain
                break;
              case 2: // Heal Player
                break;
              case 3: // Optional Hard Fight
                break;
            }
            player_room._event = 0;
          }
        }
        mode = 1;
      }
      else if (mode === 4)
      {
        if (boss_defeated)
          post_area_wrap_up();
        switch_to_scene(Hub._scene_id);
        mode = 9;
      }
    }
  };

  let _render_fn = () =>
  {
    for (let y = camera_top_left[1]; y <= camera_bottom_right[1]; y += 16)
    {
      for (let x = camera_top_left[0]; x <= camera_bottom_right[0]; x += 16)
      {
        let tile_x = math.floor(x / 16);
        let tile_y = math.floor(y / 16);

        if (tile_x > 0 && tile_x < 110 && tile_y >= 0 && tile_y < 72)
        {
          let render_x = tile_x * 16 - camera_top_left[0] - 8;
          let render_y = tile_y * 16 - camera_top_left[1] - 12;

          let tile_id = current_level._tile_map[tile_y * 110 + tile_x];

          if (tile_id > 4)
            push_quad(render_x, render_y, 16, 16, FLOOR_COLOUR);
          else
            push_quad(render_x, render_y, 16, 16, BLACK);

          if (tile_id > 5)
            push_textured_quad(TEXTURE_FLOOR, render_x, render_y, { _palette_offset: 12 + (tile_id - 6) * 3 });
          else if (tile_id > 1 && tile_id < 5)
            push_textured_quad(TEXTURE_WALL, render_x, render_y, { _palette_offset: 3 * (tile_id - 1) });

          // Lighting
          let distance = math.sqrt((player_tile_x - tile_x) ** 2 + (player_tile_y - tile_y) ** 2);
          if (distance >= 8)
            push_quad(render_x, render_y, 16, 16, BLACK);
          else if (distance >= 6)
            push_quad(render_x, render_y, 16, 16, BLACK_T75);
          else if (distance >= 4)
            push_quad(render_x, render_y, 16, 16, BLACK_T50);
          else if (distance >= 2)
            push_quad(render_x, render_y, 16, 16, BLACK_T25);
        }
      }
    }

    // Render Player
    let p_x = player_position[0] - camera_top_left[0] - 8,
      p_y = player_position[1] - camera_top_left[1] - 12;

    push_quad(p_x + 3, p_y + 15, 10, 3, 0x99000000);
    push_textured_quad(TEXTURE_ROBED_MAN, p_x, p_y, { _palette_offset: PALETTE_PLAYER, _animated: true, _horizontal_flip: player_hflip });

    if (mode === 0)
    {
      render_panel(SCREEN_WIDTH - 194, 40, 194, 70);
      render_text_menu(SCREEN_WIDTH - 97, 55, menu_options, number_of_options, selected_option_index);
    }
    else if (mode === 2)
    {
      // Full Map Render
      render_minimap(SCREEN_CENTER_X, SCREEN_CENTER_Y, 1, 9, 0, 7);
    }
    else
    {
      // Show Resources and Mini-Map on Screen
      render_resources(game_state[GAMESTATE_CURRENT_DUNGEON]._level_resources);
      render_minimap(50, SCREEN_HEIGHT - 50, player_room_x - 1, player_room_x + 1, player_room_y - 1, player_room_y + 1);
    }
    render_player_status();
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
};