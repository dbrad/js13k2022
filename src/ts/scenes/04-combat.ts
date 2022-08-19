import { BLACK } from "@graphics/colour";
import { push_quad, push_textured_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { key_state } from "@input/controls";
import { V2 } from "@math/vector";
import { Enemy, game_state, Level, Player, Summon } from "@root/game-state";
import { render_panel } from "@root/nodes/panel";
import { render_player_status } from "@root/nodes/player-status";
import { render_resources } from "@root/nodes/resources";
import { render_text_menu } from "@root/nodes/text-menu";
import { render_enemy, render_summon } from "@root/nodes/unit";
import { get_next_scene_id, Scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_HEIGHT, SCREEN_WIDTH } from "@root/screen";
import { math } from "math";
export namespace Combat
{
  let mode = 0;
  let menu_depth = 0;

  let root_selected_index = 0;
  let second_level_index = 0;
  let third_level_index = 0;

  let root_menu_options = ["attack", "target", "magic", "necromancy"];
  let second_level_options: string[] = [];
  let third_level_options: string[] = [];

  let second_level_length = 0;
  let third_level_length = 0;

  let magic_menu_options = ["fire", "ice", "holy", "shadow"];
  let fire_menu_options: string[] = [];
  let ice_menu_options: string[] = [];
  let holy_menu_options: string[] = [];
  let shadow_menu_options: string[] = [];

  let necromancy_menu_options: string[] = [];
  let summon_menu_options = ["skeleton", "zombie", "spirit"];

  let tooltip = "";

  let current_level: Level;
  let player_room_x: number;
  let player_room_y: number;
  let enemies: Enemy[];

  let player: Player;
  let summons: Summon[];

  type AttackAnimation = {
    _priority: number,
    _source_type: number,
    _source_index: number,
    _attack_type: number,
    _attack_value: number,
    _done: boolean,
    _playing: boolean,
    _lifetime_remaining: number,
    _animation_fn: () => void;
  };

  let attack_queue: AttackAnimation[] = [];
  let queue_index = 0;
  for (let i = 0; i < 10; i++)
  {
    attack_queue[i] = {
      _priority: 0,
      _source_type: 0,
      _source_index: 0,
      _attack_type: 0,
      _attack_value: 0,
      _done: true,
      _playing: false,
      _lifetime_remaining: 0,
      _animation_fn: () => { }
    };
  }

  let add_attack = (priority: number, source_type: number, source_index: number, attack_type: number, attack_value: number, lifetime: number, animation_fn: () => void) =>
  {
    attack_queue[queue_index]._priority = priority;
    attack_queue[queue_index]._source_type = source_type;
    attack_queue[queue_index]._source_index = source_index;
    attack_queue[queue_index]._attack_type = attack_type;
    attack_queue[queue_index]._attack_value = attack_value;
    attack_queue[queue_index]._done = false;
    attack_queue[queue_index]._playing = false;
    attack_queue[queue_index]._lifetime_remaining = lifetime;
    attack_queue[queue_index]._animation_fn = animation_fn;
    queue_index++;
  };

  let build_magic_tooltip = (cost: number, damage: number, damage_type: string, targets: string): string =>
  {
    return `cost: ${cost} mp / deals ${damage} ${damage_type} damage to ${targets} target${targets === "all" ? "s" : ""}`;
  };

  let summon_tooltips = [
    "cost: 1 bone / summon 1 skeleton",
    "cost: 1 flesh / summon 1 zombie",
    "cost: 1 soul / summon 1 spirit",
  ];
  let magic_tooltips: string[][] = [[], [], [], [], []];
  let magic_names = [
    ["flare", "burn", "nova", "inferno"],
    ["icicle", "freeze", "blizzard", "cold-snap"],
    ["smite", "blind", "holy-nova", "judgement"],
    ["weaken", "curse", "void", "death"],
    ["summon", "dark-mend", "sacrifice", "siphon"],
  ];

  let damage_types = ["fire", "ice", "holy", "shadow", ""];

  let mana_mod = (cost: number) => cost <= player[PLAYER_MP] ? "" : "R";
  let build_magic_menu = (magic_type: number): string[] =>
  {
    let result: string[] = [];
    for (let l = 1; l <= 4; l++)
    {
      let magic_level = player[PLAYER_MAGIC_LEVELS][magic_type];
      if (magic_level === l) result[l - 1] = mana_mod(l) + magic_names[magic_type][l - 1];
      magic_tooltips[magic_type][l - 1] = build_magic_tooltip(l, l + magic_level, damage_types[magic_type], l === 3 ? "all" : "one");
    }
    return result;
  };
  let update_command_menu = () =>
  {
    fire_menu_options = build_magic_menu(MAGIC_FIRE);
    ice_menu_options = build_magic_menu(MAGIC_ICE);
    holy_menu_options = build_magic_menu(MAGIC_HOLY);
    shadow_menu_options = build_magic_menu(MAGIC_SHADOW);
    necromancy_menu_options = build_magic_menu(MAGIC_NECROMANCY);

    magic_tooltips[MAGIC_FIRE][1] = `cost: ${2} mp / attempt to apply burn to one target for 3 turns (2 fire damage per turn)`;
    magic_tooltips[MAGIC_ICE][1] = `cost: ${2} mp / attempt to apply freeze to one target for 2 turns`;
    magic_tooltips[MAGIC_HOLY][1] = `cost: ${2} mp / attempt to apply blind to one target for 2 turns`;
    magic_tooltips[MAGIC_SHADOW][0] = `cost: ${1} mp / attempt to lower one target's attack for 3 turns`;
    magic_tooltips[MAGIC_SHADOW][1] = `cost: ${2} mp / attempt to curse one target for 3 turns (2 shadow damage per turn)`;
    magic_tooltips[MAGIC_SHADOW][3] = `cost: ${4} mp / attempt to curse one target to die after 3 turns`;

    magic_tooltips[MAGIC_NECROMANCY][0] = "";
    magic_tooltips[MAGIC_NECROMANCY][1] = `cost: ${2} mp / heal a summon by half of their max health`;
    magic_tooltips[MAGIC_NECROMANCY][2] = `sacrifice a summon to heal for their remaining health`;
    magic_tooltips[MAGIC_NECROMANCY][3] = `sacrifice a summon to gain mana equal to their remaining health`;
  };

  let summon_target_lowest: boolean = true;
  let summon_target_index = 0;

  let update_summon_target = () =>
  {

  };

  let enemy_targets = [0, 0, 0, 0];
  let update_enemy_targets = () =>
  {

  };

  let player_position: V2 = [1.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 48];
  let summon_positions: V2[] = [
    [3.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 48],
    [1.5 * 48 + SCREEN_CENTER_X - 264, 2 * 48 + 48],
    [1.5 * 48 + SCREEN_CENTER_X - 264, 4 * 48 + 48],
    [3 * 48 + SCREEN_CENTER_X - 264, 1.5 * 48 + 48],
    [3 * 48 + SCREEN_CENTER_X - 264, 4.5 * 48 + 48],
  ];
  let enemy_positions: V2[] = [
    [8.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 48],
    [7.5 * 48 + SCREEN_CENTER_X - 264, 1.5 * 48 + 48],
    [7.5 * 48 + SCREEN_CENTER_X - 264, 4.5 * 48 + 48],
    [6.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 48],
  ];

  let targets: string[] = [];
  let target_index = 0;
  let target_index_map: [number, number][] = [];

  let friendly_targets: string[] = [];
  let friendly_target_index = 0;
  let friendly_target_index_map: [number, number][] = [];

  let reset_menu = () =>
  {
    mode = 5;
    menu_depth = 0;
    root_selected_index = 0;
    second_level_index = 0;
    third_level_index = 0;
  };

  let _reset_fn = () =>
  {
    reset_menu();

    current_level = game_state[GAMESTATE_CURRENT_DUNGEON];
    let player_tile_x = math.floor(current_level._player_position[0] / 16);
    let player_tile_y = math.floor(current_level._player_position[1] / 16);
    player_room_x = math.floor(player_tile_x / 11);
    player_room_y = math.floor(player_tile_y / 9);
    let player_room_index = player_room_y * 10 + player_room_x;
    let player_room = current_level._rooms[player_room_index];
    enemies = player_room._enemies;

    player = game_state[GAMESTATE_PLAYER];
    summons = player[PLAYER_ACTIVE_SUMMONS];
  };

  let _update_fn = (now: number, delta: number) =>
  {
    let UP_PRESSED = key_state[D_UP] === KEY_WAS_DOWN;
    let DOWN_PRESSED = key_state[D_DOWN] === KEY_WAS_DOWN;
    let A_PRESSED = key_state[A_BUTTON] === KEY_WAS_DOWN;
    let B_PRESSED = key_state[B_BUTTON] === KEY_WAS_DOWN;
    if (mode === 0)
    {
      // MENU MODE
      if (UP_PRESSED)
      {
        if (menu_depth === 0)
          root_selected_index = math.max(0, root_selected_index - 1);
        else if (menu_depth === 1)
          second_level_index = math.max(0, second_level_index - 1);
        else
          third_level_index = math.max(0, third_level_index - 1);
      }
      else if (DOWN_PRESSED)
      {
        if (menu_depth === 0)
          root_selected_index = math.min(3, root_selected_index + 1);
        else if (menu_depth === 1)
          second_level_index = math.min(second_level_length - 1, second_level_index + 1);
        else
          third_level_index = math.min(third_level_length - 1, third_level_index + 1);
      }
      else if (A_PRESSED)
      {
        if (menu_depth === 0)
        {
          if (root_selected_index > 1)
            menu_depth++;
          else if (root_selected_index === 0)
            mode = 1;
          else
            summon_target_lowest = !summon_target_lowest;
        }
        else if (menu_depth === 1)
        {
          if (root_selected_index === 3) // NECROMANCY MENU SELECTED
          {
            if (second_level_index > 0)
              mode = 2; // Cast Necromancy Spell - Self Target Mode
            else
              menu_depth++; // SUMMON MENU SELECTED
          }
          else
            menu_depth++; // SPELL ELEMENT SELECTED
        }
        else
        {
          if (root_selected_index === 3)
          {
            // SUMMON SELECTED MINION
            mode = 3;
          }
          else
            mode = 1; // SPELL CAST - Target Mode
        }
      }
      else if (B_PRESSED)
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
      }

      tooltip = "";
      if (menu_depth === 0)
      {
        if (root_selected_index === 0) tooltip = `attack selected enemy for ${player[PLAYER_WEAPON_LEVEL]} damage`;
        if (root_selected_index === 1) tooltip = "change the targeting rules for your summons";
      }
      else if (menu_depth === 1)
      {
        if (root_selected_index === 3)
          tooltip = magic_tooltips[MAGIC_NECROMANCY][second_level_index];
      }
      else
      {
        if (root_selected_index === 2)
          tooltip = magic_tooltips[second_level_index][third_level_index];
        else
          tooltip = summon_tooltips[third_level_index];
      }
    }
    else if (mode === 1)
    {
      // TARGET MODE
      if (targets.length === 0)
      {
        // Build target list

      }
      if (UP_PRESSED) { }
      else if (DOWN_PRESSED) { }
      else if (A_PRESSED)
      {
        // QUEUE UP PLAYER ATTACK
        targets.length = 0;
        mode = 3;
      }
      else if (B_PRESSED)
      {
        mode = 0;
      }
    }
    else if (mode === 2)
    {
      // FRIENDLY TARGET MODE
      if (friendly_targets.length === 0)
      {
        // Build target list
      }
      if (UP_PRESSED) { }
      else if (DOWN_PRESSED) { }
      else if (A_PRESSED)
      {
        // QUEUE UP PLAYER ACTION
        friendly_targets.length = 0;
        mode = 3;
      }
      else if (B_PRESSED)
      {
        mode = 0;
      }
    }
    else if (mode === 3)
    {
      // QUEUE UP SUMMON ATTACKS
      // QUEUE UP ENEMY ATTACKS
      // SORT ACTION QUEUE
      mode = 4;
    }
    else if (mode === 4)
    {
      // COMBAT PLAYING OUT MODE
      let attacks_done = 0;
      for (let attack of attack_queue)
      {
        if (attack._done)
        {
          attacks_done++;
          continue;
        }
        if (attack._lifetime_remaining <= 0)
        {
          attack._done = true;
          // do damage
          // check for death
          // handle xp
          update_summon_target();
          update_enemy_targets();
        }

        attack._lifetime_remaining -= delta;
        if (!attack._playing)
        {
          attack._animation_fn();
          attack._playing = true;
        }
        break;
      }
      // if we get through all 10 attacks, combat animation is done
      if (attacks_done === 10)
        mode = 5;
    }
    else if (mode === 5)
    {
      reset_menu();
      let enemies_alive = false;
      for (let enemy of enemies)
        enemies_alive = enemies_alive || enemy._alive;
      if (enemies_alive)
      {
        mode = 0;
        update_command_menu();
        // get new enemy intents
      }
      else
        mode = 6;
    }
    else if (mode === 6)
    {
      // COMBAT OVER, SHOW LOOT THEN LEAVE TO MAP
    }

    // Assign values to combat menus
    if (menu_depth > 0)
    {
      if (root_selected_index === 2)
        second_level_options = magic_menu_options;
      else
        second_level_options = necromancy_menu_options;
    }
    if (menu_depth > 1)
    {
      if (root_selected_index === 2)
      {
        if (second_level_index === 0) third_level_options = fire_menu_options;
        else if (second_level_index === 1) third_level_options = ice_menu_options;
        else if (second_level_index === 2) third_level_options = holy_menu_options;
        else third_level_options = shadow_menu_options;
      }
      else
        third_level_options = summon_menu_options;
    }
    second_level_length = second_level_options.length;
    third_level_length = third_level_options.length;
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

    push_textured_quad(TEXTURE_ROBED_MAN_0, player_position[0] + 8, player_position[1] + 8, { _scale: 2, _palette_offset: 5, _animated: true });

    for (let s = 0; s < 5; s++)
    {
      if (summons[s] && summons[s][SUMMON_ALIVE])
        render_summon(summons[s], summon_positions[s][0] + 8, summon_positions[s][1] + 8);
    }

    for (let e = 0; e < 4; e++)
    {
      if (enemies[e] && enemies[e]._alive)
        render_enemy(enemies[e], enemy_positions[e][0] + 8, enemy_positions[e][1] + 8);
    }

    if (tooltip !== "")
    {
      let tooltip_length = tooltip.length * 8 + 10;
      render_panel(SCREEN_CENTER_X - tooltip_length / 2, SCREEN_HEIGHT - 30, tooltip_length, 18);
      push_text(tooltip, SCREEN_CENTER_X, SCREEN_HEIGHT - 25, { _align: TEXT_ALIGN_CENTER });
    }

    let target_text = "lowest health";
    if (!summon_target_lowest)
      target_text = "highest health";
    target_text = "summon target: " + target_text;
    let target_text_length = target_text.length * 8 + 8;
    render_panel(SCREEN_CENTER_X - target_text_length / 2, 72, target_text_length, 16);
    push_text(target_text, SCREEN_CENTER_X, 76, { _align: TEXT_ALIGN_CENTER });

    render_player_status();
    render_resources(SCREEN_WIDTH - 160, 5);

    if (mode === 0)
    {
      // MENU MODE
      let panel_x = SCREEN_CENTER_X - 53 * (menu_depth + 1);
      let panel_y = 5;
      let menu_x = SCREEN_CENTER_X - 53 * (menu_depth);
      let menu_y = 13;
      let panel_w = 106;
      let panel_h = 66;
      render_panel(panel_x, panel_y, panel_w, panel_h);
      render_text_menu([menu_x, menu_y], root_menu_options, 4, root_selected_index, 1);

      if (menu_depth > 0)
      {
        panel_x += 104;
        menu_x += 104;
        render_panel(panel_x, panel_y, panel_w, panel_h);
        render_text_menu([menu_x, menu_y], second_level_options, second_level_length, second_level_index, 1);
      }
      if (menu_depth > 1)
      {
        panel_x += 104;
        menu_x += 104;
        render_panel(panel_x, panel_y, panel_w, panel_h);
        render_text_menu([menu_x, menu_y], third_level_options, third_level_length, third_level_index, 1);
      }
    }
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}