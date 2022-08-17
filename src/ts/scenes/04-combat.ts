import { BLACK } from "@graphics/colour";
import { push_quad, push_textured_quad } from "@graphics/quad";
import { key_state } from "@input/controls";
import { Enemy, game_state, Level } from "@root/game-state";
import { render_enemy } from "@root/nodes/enemy";
import { render_panel } from "@root/nodes/panel";
import { render_player_status } from "@root/nodes/player-status";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X } from "@root/screen";
import { math } from "math";
import { Dungeon } from "./03-dungeon";
export namespace Combat
{
  let mode = 0;
  let menu_depth = 0;

  let root_selected_index = 0;
  let second_level_index = 0;
  let third_level_index = 0;

  let root_menu_options = ["attack", "defend", "magic", "necromancy"];

  let magic_menu_options = ["fire", "ice", "holy", "shadow"];
  let fire_menu_options = ["flare", "burn", "nova", "inferno"];
  let ice_menu_options = ["icicle", "freeze", "blizzard", "cold snap"];
  let holy_menu_options = ["smite", "blind", "holy nova", "judgement"];
  let shadow_menu_options = ["weaken", "curse", "darkness", "death"];

  let necromancy_menu_options = ["summon", "dark mend", "sacrifice", "siphon"];
  let summon_menu_options = ["skeleton", "zombie", "spirit"];

  let current_level: Level;
  let player_room_x: number;
  let player_room_y: number;
  let enemies: Enemy[];

  let _reset_fn = () =>
  {
    mode = 0;
    root_selected_index = 0;
    second_level_index = 0;
    third_level_index = 0;

    current_level = game_state[GAMESTATE_CURRENT_DUNGEON];
    let player_tile_x = math.floor(current_level._player_position[0] / 16);
    let player_tile_y = math.floor(current_level._player_position[1] / 16);
    player_room_x = math.floor(player_tile_x / 11);
    player_room_y = math.floor(player_tile_y / 9);
    let player_room_index = player_room_y * 10 + player_room_x;
    let player_room = current_level._rooms[player_room_index];
    enemies = player_room._enemies;

    // TODO: Adjust menus based on spell levels
  };
  let _update_fn = (now: number, delta: number) =>
  {
    if (mode === 0)
    {
      // MENU MODE
      if (key_state[D_UP] === KEY_WAS_DOWN)
      {
        if (menu_depth === 0)
        {
          root_selected_index = math.max(0, root_selected_index - 1);
        }
        else if (menu_depth === 1)
        {
          second_level_index = math.max(0, second_level_index - 1);
        }
        else
        {
          third_level_index = math.max(0, second_level_index - 1);
        }
      }
      else if (key_state[D_DOWN] === KEY_WAS_DOWN)
      {
        if (menu_depth === 0)
        {
          root_selected_index = math.min(3, root_selected_index + 1);
        }
        else if (menu_depth === 1)
        {
          second_level_index = math.min(3, second_level_index + 1);
        }
        else
        {
          third_level_index = math.min(2, third_level_index + 1);
        }
      }
      else if (key_state[A_BUTTON] === KEY_WAS_DOWN)
      {
        if (menu_depth === 0)
        {
          if (root_selected_index > 1)
          {
            menu_depth++;
          }
          else
          {
            // ATTACK OR DEFEND - Target Mode
          }
        }
        else if (menu_depth === 1)
        {
          if (root_selected_index === 3)
          {
            // NECROMANCY MENU
            if (second_level_index > 0)
            {
              // Cast Necromancy Spell - Self Target Mode
            }
            else
            {
              // SUMMON MENU SELECTED
              menu_depth++;
            }
          }
          else
          {
            menu_depth++;
          }
        }
        else
        {
          if (root_selected_index === 3)
          {
            // SUMMON
          }
          else
          {
            // SPELL CAST - Target Mode
          }
        }
      }
      else if (key_state[B_BUTTON] === KEY_WAS_DOWN)
      {
        if (menu_depth === 1)
        {
          second_level_index = 0;
          menu_depth--;
        }
        else if (menu_depth === 2)
        {
          third_level_index = 0;
          menu_depth--;
        }
        else
        {
          if (DEBUG)
          {
            switch_to_scene(Dungeon._scene_id);
          }
        }
      }
    }
    else if (mode === 1)
    {
      // TARGET MODE
    }
    else if (mode === 2)
    {
      // SELF TARGET MODE
    }
    else if (mode === 3)
    {
      // COMBAT PLAYING OUT MODE
    }
  };

  let _render_fn = () =>
  {
    for (let y = -1; y < 6; y++)
    {
      for (let x = -2; x < 15; x++)
      {
        let tile_x = player_room_x * 11 + x;
        let tile_y = player_room_y * 9 + y;

        let render_x = x * 48 + SCREEN_CENTER_X - 264;
        let render_y = y * 48 + 48;

        let tile_id = current_level._tile_map[tile_y * 110 + tile_x];
        if (tile_id > 4)
          push_quad(render_x, render_y, 48, 48, 0xFF1f1f1f);
        else
          push_quad(render_x, render_y, 48, 48, BLACK);

        if (tile_id > 5)
          push_textured_quad(tile_id - 6 + TEXTURE_FLOOR_0, render_x, render_y, { _scale: 3 });
        else if (tile_id > 1 && tile_id < 5)
          push_textured_quad(tile_id - 2 + TEXTURE_WALL_0, render_x, render_y, { _palette_offset: 2, _scale: 3 });


        let distance = math.sqrt((player_room_x * 11 + 2 - tile_x) ** 2 + (player_room_y * 9 + 3 - tile_y) ** 2);
        if (distance >= 7)
          push_quad(render_x, render_y, 48, 48, 0xBD000000);
        else if (distance >= 5)
          push_quad(render_x, render_y, 48, 48, 0x7F000000);
        else if (distance >= 3)
          push_quad(render_x, render_y, 48, 48, 0x40000000);
      }
    }

    for (let y = -1; y < 6; y++)
    {
      for (let x = -2; x < 15; x++)
      {
        let render_x = x * 48 + SCREEN_CENTER_X - 264;
        let render_y = y * 48 + 48;
        if (x === 2 && y === 3)
          push_textured_quad(TEXTURE_ROBED_MAN_0, render_x + 8, render_y + 8, { _scale: 2, _palette_offset: 5, _animated: true });

        if (x === 8 && y === 3 && enemies[0][ENEMY_ALIVE])
          render_enemy(enemies[0], render_x + 8, render_y + 8);
      }
    }

    render_player_status();

    if (mode === 0)
    {
      // Render combat menus
      let panel_x = SCREEN_CENTER_X - 53 * (menu_depth + 1);
      let panel_y = 5;// SCREEN_CENTER_Y - 37 * (menu_depth + 1);
      let menu_x = SCREEN_CENTER_X - 53 * (menu_depth);
      let menu_y = 13;//(SCREEN_CENTER_Y + 8) - 37 * (menu_depth + 1);
      render_panel(panel_x, panel_y, 106, 74);
      render_text_menu([menu_x, menu_y], root_menu_options, 4, root_selected_index, 1);

      if (menu_depth > 0)
      {
        panel_x += 104;
        menu_x += 104;
        render_panel(panel_x, panel_y, 106, 74);
        let options: string[];
        if (root_selected_index === 2)
          options = magic_menu_options;
        else
          options = necromancy_menu_options;
        render_text_menu([menu_x, menu_y], options, 4, second_level_index, 1);
      }
      if (menu_depth > 1)
      {
        panel_x += 104;
        menu_x += 104;
        render_panel(panel_x, panel_y, 106, 74);
        let options: string[];
        if (root_selected_index === 2)
        {
          if (second_level_index === 0) options = fire_menu_options;
          else if (second_level_index === 1) options = ice_menu_options;
          else if (second_level_index === 2) options = holy_menu_options;
          else options = shadow_menu_options;
        }
        else
          options = summon_menu_options;
        render_text_menu([menu_x, menu_y], options, 3, third_level_index, 1);
      }
    }
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}