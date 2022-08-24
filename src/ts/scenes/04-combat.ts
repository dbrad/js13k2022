import { assert } from "@debug/assert";
import { card_list } from "@gameplay/cards";
import { EffectFunction, effects } from "@gameplay/effects";
import { get_next_enemy_intent } from "@gameplay/enemy-builder";
import { BLACK, floor_palettes, wall_palettes, WHITE } from "@graphics/colour";
import { push_quad, push_textured_quad } from "@graphics/quad";
import { CENTERED, push_text, SMALL_AND_CENTERED } from "@graphics/text";
import { A_PRESSED, B_PRESSED, DOWN_PRESSED, LEFT_PRESSED, RIGHT_PRESSED, UP_PRESSED } from "@input/controls";
import { V2 } from "@math/vector";
import { Enemy, game_state, Level, Player } from "@root/game-state";
import { get_modifiers, render_card } from "@root/nodes/card";
import { render_panel } from "@root/nodes/panel";
import { render_player_status } from "@root/nodes/player-status";
import { resource_names } from "@root/nodes/resources";
import { render_text_menu } from "@root/nodes/text-menu";
import { calculate_attack, render_enemy, unit_name_map } from "@root/nodes/unit";
import { clear_particle_system } from "@root/particle-system";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_HEIGHT, SCREEN_WIDTH } from "@root/screen";
import { math, safe_add, safe_subtract, shuffle } from "math";
import { Dungeon } from "./03-dungeon";
export namespace Combat
{
  let mode = COMBAT_MODE_POST_COMBAT;
  let sub_mode = 0;
  let row = 1;
  let selected_card_index = 0;
  let selected_action_index = 0;

  let current_level: Level;
  let player_room_x: number;
  let player_room_y: number;
  let enemies: Enemy[] = [];

  let loot: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  let card_use_menu: string[] = [];

  let player: Player;
  let deck: number[] = [];
  let discard: number[] = [];

  let total_attack = 0;
  let total_defense = 0;
  let barbs_damage = 0;

  let casting_spell = false;

  let hand: number[] = [];
  let hand_size: number = 0;
  let discarding = [false, false, false, false, false];

  type AttackAnimation = {
    _source_index: number,
    _attack_value: number,
    _done: boolean,
    _playing: boolean,
    _lifetime_remaining: number,
    _animation_fn: () => void;
  };

  let attack_queue: AttackAnimation[] = [];
  let queue_index = 0;
  for (let i = 0; i < 4; i++)
  {
    attack_queue[i] = {
      _source_index: 0,
      _attack_value: 0,
      _done: true,
      _playing: false,
      _lifetime_remaining: 0,
      _animation_fn: () => { }
    };
  }

  let add_attack = (source_index: number, attack_value: number, lifetime: number, animation_fn: () => void) =>
  {
    attack_queue[queue_index]._source_index = source_index;
    attack_queue[queue_index]._attack_value = attack_value;
    attack_queue[queue_index]._done = false;
    attack_queue[queue_index]._playing = false;
    attack_queue[queue_index]._lifetime_remaining = lifetime;
    attack_queue[queue_index]._animation_fn = animation_fn;
    queue_index++;
  };

  let player_position: V2 = [1.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 32];
  let enemy_starting_positions: V2[] = [
    [8.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 32],
    [7.5 * 48 + SCREEN_CENTER_X - 264, 1.5 * 48 + 32],
    [7.5 * 48 + SCREEN_CENTER_X - 264, 4.5 * 48 + 32],
    [6.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 32],
  ];
  let enemy_positions: V2[] = [];

  let target_index: number = 0;
  let target_list: string[] = [];
  let target_index_map: number[] = [];

  let go_to_target_mode = () =>
  {
    target_index = 0;
    mode = COMBAT_MODE_SELECT_TARGET;
    let list_index = 0;
    target_list.length = 0;
    target_index_map.length = 0;
    for (let [index, enemy] of enemies.entries())
    {
      if (enemy._alive)
      {
        target_list[list_index] = unit_name_map[enemy._type];
        target_index_map[list_index] = index;
        list_index++;
      }
    }
    clear_particle_system();
  };

  let any_enemies_alive = (enemies: Enemy[]): boolean =>
  {
    let enemies_alive = false;
    for (let enemy of enemies)
    {
      if (enemy._hp <= 0 && enemy._alive)
      {
        enemy._alive = false;
        loot[enemy._type] += math.ceil(enemy._level / 20);
      }
      enemies_alive = enemies_alive || enemy._alive;
    }
    return enemies_alive;
  };

  let _reset_fn = () =>
  {
    player = game_state[GAMESTATE_PLAYER];

    mode = COMBAT_MODE_POST_COMBAT;
    sub_mode = 0;
    row = 1;
    loot = [0, 0, 0, 0, 0];

    current_level = game_state[GAMESTATE_CURRENT_DUNGEON];
    let player_tile_x = math.floor(current_level._player_position[0] / 16);
    let player_tile_y = math.floor(current_level._player_position[1] / 16);
    player_room_x = math.floor(player_tile_x / 11);
    player_room_y = math.floor(player_tile_y / 9);
    let player_room_index = player_room_y * 10 + player_room_x;
    let player_room = current_level._rooms[player_room_index];

    enemies = player_room._enemies;
    for (let [i, [x, y]] of enemy_starting_positions.entries())
      enemy_positions[i] = [x, y];

    game_state[GAMESTATE_COMBAT] = [0, 0, [0, 0], [0, 0], [0, 0]];
    hand.length = deck.length = discard.length = total_attack = total_defense = barbs_damage = 0;

    deck = structuredClone(shuffle(game_state[GAMESTATE_DECK]));
  };

  let _update_fn = (now: number, delta: number) =>
  {
    hand_size = hand.length;

    if (selected_card_index >= hand_size)
      selected_card_index = hand_size - 1;
    if (selected_card_index < 0)
      selected_card_index = 0;

    if (mode === COMBAT_MODE_DRAW)
    {
      for (let i = 4; i >= 0; i--)
      {
        if (discarding[i])
          discard.push(hand.splice(i, 1)[0]);
        discarding[i] = false;
      }
      for (let i = 0; i < 5; i++)
      {
        if (hand[i] === undefined)
        {
          let card_id = deck.pop();
          if (card_id === undefined)
          {
            deck = structuredClone(shuffle(discard));
            discard.length = 0;
            card_id = deck.pop();
          }
          assert(card_id !== undefined, "card from deck undefined after shuffling in discard pile");
          hand[i] = card_id;
        }
      }
      hand_size = hand.length;
      mode = COMBAT_MODE_CARD_SELECT;
    }
    else if (mode === COMBAT_MODE_CARD_SELECT)
    {
      if (hand_size === 0)
        go_to_target_mode();

      if (UP_PRESSED)
        row = 0;
      else if (DOWN_PRESSED)
        row = 1;
      else if (LEFT_PRESSED && row)
        selected_card_index = (selected_card_index + hand_size - 1) % hand_size;
      else if (RIGHT_PRESSED && row)
        selected_card_index = (selected_card_index + 1) % hand_size;
      else if (A_PRESSED)
      {
        if (sub_mode) // 1 = Play card mode
        {
          if (row)
          {
            selected_action_index = 0;
            casting_spell = false;
            card_use_menu = ["activate"];
            mode = COMBAT_MODE_ACTION_SELECT;

            let card = card_list[hand[selected_card_index]];
            let card_type = card[CARD_TYPE];
            if (card_type === 3) // Buff Spell
            {
              for (let effect of card[CARD_EFFECTS])
                (effects[effect[EFFECT_APPLY_FUNCTION]] as EffectFunction)(effect);

              hand.splice(selected_card_index, 1);
              clear_particle_system();
              mode = COMBAT_MODE_CARD_SELECT;
            }
            else if (card_type === 4)
            {
              casting_spell = true;
              go_to_target_mode();
            }
            else
              card_use_menu = ["attack!", "protect me!"];
          }
          else
          {
            row = 1;
            go_to_target_mode();
          }
        }
        else // 0 = Discard Mode
        {
          if (row)
            discarding[selected_card_index] = !discarding[selected_card_index];
          else
          {
            row = 1;
            sub_mode = 1; // SWITCH TO PLAY MODE
            clear_particle_system();
            mode = COMBAT_MODE_DRAW;
          }
        }
      }
    }
    else if (mode === COMBAT_MODE_ACTION_SELECT)
    {
      // ACTION SELECT
      if (UP_PRESSED)
        selected_action_index = safe_subtract(selected_action_index, 1);
      else if (DOWN_PRESSED)
        selected_action_index = safe_add(1, selected_action_index, 1);
      else if (A_PRESSED)
      {
        let card_id = hand.splice(selected_card_index, 1)[0];
        let card = card_list[card_id];
        let card_type = card[CARD_TYPE];

        let [attack_modifier, defense_modifier] = get_modifiers(card_type);
        let attack = math.max(0, card[CARD_ATTACK] + attack_modifier);
        let defense = math.max(0, card[CARD_DEFENSE] + defense_modifier);
        if (selected_action_index)
          total_defense += defense;
        else
          total_attack += attack;

        discard.push(card_id);
        clear_particle_system();
        mode = COMBAT_MODE_CARD_SELECT;
      }
      else if (B_PRESSED)
        mode = COMBAT_MODE_CARD_SELECT;
    }
    else if (mode === COMBAT_MODE_SELECT_TARGET)
    {
      if (UP_PRESSED)
        target_index = safe_subtract(target_index, 1);
      else if (DOWN_PRESSED)
        target_index = safe_add(target_list.length - 1, target_index, 1);
      else if (A_PRESSED)
      {
        if (casting_spell)
        {
          let target_enemy = enemies[target_index_map[target_index]];

          let card_id = hand[selected_card_index];
          let card = card_list[card_id];
          for (let effect of card[CARD_EFFECTS])
            if (effect[EFFECT_APPLY_FUNCTION] >= 0)
              effects[effect[EFFECT_APPLY_FUNCTION]](effect, target_enemy);

          target_enemy._hp = math.max(0, target_enemy._hp - card[CARD_ATTACK]);

          hand.splice(selected_card_index, 1);
          discard.push(card_id);
          casting_spell = false;
          clear_particle_system();

          if (any_enemies_alive(enemies))
            mode = COMBAT_MODE_CARD_SELECT;
          else
            mode = COMBAT_MODE_POST_COMBAT;
        }
        else
          mode = COMBAT_MODE_ATTACK_ACTION;
      }
      else if (B_PRESSED && casting_spell)
      {
        casting_spell = false;
        mode = COMBAT_MODE_CARD_SELECT;
      }
    }
    else if (mode === COMBAT_MODE_ATTACK_ACTION)
    {
      let target_enemy = enemies[target_index_map[target_index]];
      target_enemy._hp = math.max(0, target_enemy._hp - total_attack);
      any_enemies_alive(enemies);

      total_attack = 0;
      mode = COMBAT_MODE_DEFEND_ACTION;
    }
    else if (mode === COMBAT_MODE_DEFEND_ACTION)
    {
      for (let [index, enemy] of enemies.entries())
      {
        if (enemy._alive)
          add_attack(index, calculate_attack(enemy), 500, () => { });
      }

      mode = COMBAT_MODE_ENEMY_ATTACKS;
    }
    else if (mode === COMBAT_MODE_ENEMY_ATTACKS)
    {
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
          player[PLAYER_HP] = safe_subtract(player[PLAYER_HP], safe_subtract(attack._attack_value, total_defense));
          total_defense = safe_subtract(total_defense, attack._attack_value);
          enemies[attack._source_index]._hp = safe_subtract(enemies[attack._source_index]._hp, barbs_damage);
          // player death?
        }

        attack._lifetime_remaining -= delta;
        if (!attack._playing)
        {
          attack._animation_fn();
          attack._playing = true;
        }
        break;
      }
      if (attacks_done === 4)
      {
        total_defense = 0;
        queue_index = 0;
        mode = COMBAT_MODE_POST_COMBAT;
      }
    }
    else if (mode === COMBAT_MODE_POST_COMBAT)
    {
      row = 1;
      if (any_enemies_alive(enemies))
      {
        for (let enemy of enemies)
        {
          if (enemy._alive)
            get_next_enemy_intent(enemy);
        }
        mode = COMBAT_MODE_DRAW;
      }
      else
        mode = COMBAT_MODE_LOOT_AND_LEAVE;
    }
    else if (mode === COMBAT_MODE_LOOT_AND_LEAVE)
    {
      if (A_PRESSED || B_PRESSED)
      {
        for (let l = 0; l < 5; l++)
        {
          if (loot[l] > 0)
          {
            game_state[GAMESTATE_RESOURCES_GATHERED][l] = true;
            game_state[GAMESTATE_RESOURCES][l] = + loot[l];
          }
        }
        switch_to_scene(Dungeon._scene_id);
      }
    }
  };

  let _render_fn = () =>
  {
    // Render the Room
    for (let y = -1; y < 6; y++)
    {
      for (let x = -2; x < 15; x++)
      {
        let tile_x = player_room_x * 11 + x;
        let tile_y = player_room_y * 9 + y;

        let render_x = x * 48 + SCREEN_CENTER_X - 264;
        let render_y = y * 48 + 32;

        let tile_id = current_level._tile_map[tile_y * 110 + tile_x];
        if (tile_id > 4)
          push_quad(render_x, render_y, 48, 48, 0xff2a1f1c);
        else
          push_quad(render_x, render_y, 48, 48, BLACK);

        if (tile_id > 5)
          push_textured_quad(TEXTURE_FLOOR, render_x, render_y, { _scale: 3, _palette_offset: floor_palettes[tile_id - 6] });
        else if (tile_id > 1 && tile_id < 5)
          push_textured_quad(TEXTURE_WALL, render_x, render_y, { _scale: 3, _palette_offset: wall_palettes[tile_id - 2] });

        let distance = math.sqrt((player_room_x * 11 + 2 - tile_x) ** 2 + (player_room_y * 9 + 3 - tile_y) ** 2);
        if (distance >= 7)
          push_quad(render_x, render_y, 48, 48, 0xBD000000);
        else if (distance >= 5)
          push_quad(render_x, render_y, 48, 48, 0x7F000000);
        else if (distance >= 3)
          push_quad(render_x, render_y, 48, 48, 0x40000000);
      }
    }

    // Render the entites
    push_quad(player_position[0] + 8 - 6, player_position[1] + 8 + 28, 30, 8, 0x99000000);
    push_textured_quad(TEXTURE_ROBED_MAN, player_position[0] + 8, player_position[1] + 8, { _scale: 2, _palette_offset: PALETTE_PLAYER, _animated: true });
    if (total_attack > 0)
    {
      push_text("" + total_attack, player_position[0], player_position[1]);
    }

    if (total_defense > 0)
    {
      push_text("" + total_defense, player_position[0] + 48, player_position[1], { _align: TEXT_ALIGN_RIGHT });
    }

    for (let e = 0; e < 4; e++)
    {
      if (enemies[e] && enemies[e]._alive)
        render_enemy(enemies[e], enemy_positions[e][0] + 8, enemy_positions[e][1] + 8);
    }

    // Mode specific rendering logic
    if (mode === COMBAT_MODE_CARD_SELECT || mode === COMBAT_MODE_DRAW || mode === COMBAT_MODE_ACTION_SELECT)
    {
      for (let hand_index = 0; hand_index < hand_size; hand_index++)
      {
        let card = card_list[hand[hand_index]];
        if (card)
        {
          let selected = hand_index === selected_card_index && row;
          let highlight_colour = discarding[hand_index] ? 0xff0000ff : selected ? WHITE : undefined;
          render_card(50 + 110 * hand_index, SCREEN_HEIGHT - 85 - (selected ? 10 : 0), card, 1, highlight_colour);
        }
      }
      push_text(`${deck.length}\ndeck`, 25, SCREEN_HEIGHT - 30, SMALL_AND_CENTERED);
      push_text(`${discard.length}\ndiscard`, SCREEN_WIDTH - 25, SCREEN_HEIGHT - 30, SMALL_AND_CENTERED);
    }

    if (mode === COMBAT_MODE_CARD_SELECT && !sub_mode)
    {
      render_mode_text("select cards to discard and re-draw");
      let text = "skip discard";
      for (let d = 0; d < 5; d++)
      {
        if (discarding[d])
        {
          text = "discard";
          break;
        }
      }
      render_panel(SCREEN_CENTER_X - 60, SCREEN_CENTER_Y, 120, 28, !row ? WHITE : 0xff2d2d2d);
      push_text(text, SCREEN_CENTER_X, SCREEN_CENTER_Y + 10, { _align: TEXT_ALIGN_CENTER, _colour: (row ? 0xff444444 : WHITE) });
    }
    else if (mode === COMBAT_MODE_CARD_SELECT)
    {
      render_mode_text("play minions and spells from your hard");
      render_panel(SCREEN_CENTER_X - 40, SCREEN_CENTER_Y, 80, 28, !row ? WHITE : 0xff2d2d2d);
      push_text("end turn", SCREEN_CENTER_X, SCREEN_CENTER_Y + 10, { _align: TEXT_ALIGN_CENTER, _colour: (row ? 0xff444444 : WHITE) });
    }
    else if (mode === COMBAT_MODE_ACTION_SELECT)
    {
      render_mode_text("select whether to use the minion's attack or defense");
      render_panel(SCREEN_CENTER_X - 55, SCREEN_CENTER_Y, 110, 40);
      render_text_menu([SCREEN_CENTER_X, SCREEN_CENTER_Y + 10], card_use_menu, card_use_menu.length, selected_action_index, 1);
    }
    else if (mode === COMBAT_MODE_SELECT_TARGET)
    {
      render_mode_text("select target");
      let target_list_length = target_list.length;
      render_panel(SCREEN_CENTER_X - 50, SCREEN_CENTER_Y, 100, 14 * target_list_length + 3);
      render_text_menu([SCREEN_CENTER_X, SCREEN_CENTER_Y + 5], target_list, target_list.length, target_index, 1);
    }
    else if (mode === COMBAT_MODE_LOOT_AND_LEAVE)
    {
      render_panel(SCREEN_CENTER_X - 200, 30, 400, 300);
      push_text("victory!", SCREEN_CENTER_X, 50, { _scale: 3, _align: TEXT_ALIGN_CENTER });
      push_text("reagents found", SCREEN_CENTER_X, 110, { _align: TEXT_ALIGN_CENTER, _scale: 2 });
      let y = 0;
      for (let l = 0; l < 5; l++)
      {
        if (loot[l] > 0)
        {
          push_text(`${loot[l]} ${resource_names[l]}`, SCREEN_CENTER_X, 140 + 12 * y, CENTERED);
          y++;
        }
      }
      render_panel(SCREEN_CENTER_X - 40, 280, 80, 28);
      push_text("continue", SCREEN_CENTER_X, 290, CENTERED);
    }

    render_player_status();
  };
  let render_mode_text = (text: string) => push_text(text, SCREEN_CENTER_X, SCREEN_HEIGHT - 110, CENTERED);

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}