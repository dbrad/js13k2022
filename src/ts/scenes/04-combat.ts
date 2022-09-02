import { assert } from "@debug/assert";
import { card_list } from "@gameplay/cards";
import { EffectFunction, effects } from "@gameplay/effects";
import { get_next_enemy_intent } from "@gameplay/enemy-builder";
import { BLACK, BLACK_T25, BLACK_T50, BLACK_T75, DARK_GREY, FLOOR_COLOUR, LIGHT_GREY, RED, WHITE } from "@graphics/colour";
import { push_quad, push_textured_quad } from "@graphics/quad";
import { CENTERED_TEXT, push_text, SMALL_FONT_AND_CENTERED_TEXT } from "@graphics/text";
import { A_PRESSED, B_PRESSED, controls_used, DOWN_PRESSED, LEFT_PRESSED, RIGHT_PRESSED, UP_PRESSED } from "@input/controls";
import { V2 } from "@math/vector";
import { Enemy, game_state, Level, Player } from "@root/game-state";
import { get_modifiers, render_card } from "@root/nodes/card";
import { render_panel } from "@root/nodes/panel";
import { render_player_status } from "@root/nodes/player-status";
import { resource_names } from "@root/nodes/resources";
import { render_text_menu } from "@root/nodes/text-menu";
import { calculate_attack, render_enemy, unit_name_map } from "@root/nodes/unit";
import { buff_particle } from "@root/particle-definitions";
import { clear_particle_system, emit_particles } from "@root/particle-system";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_HEIGHT, SCREEN_WIDTH } from "@root/screen";
import { buff_sound, heal_sound, hit, zzfx_play } from "@root/zzfx";
import { math, safe_add, safe_subtract, shuffle } from "math";
import { Hub } from "./01-hub";
import { Dungeon } from "./03-dungeon";
export namespace Combat
{
  let mode = COMBAT_MODE_POST_COMBAT;
  let play_card_mode = 0;
  let row = 1;
  let selected_card_index = 0;
  let selected_action_index = 0;

  let current_level: Level;
  let player_room_x: number;
  let player_room_y: number;
  let enemies: Enemy[] = [];

  let loot: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  let wait_timer = 0;
  let next_mode = COMBAT_MODE_WAIT;

  let card_use_menu: string[] = [];

  let player: Player;
  let deck: number[] = [];
  let discard_pile: number[] = [];

  let total_attack = 0;
  let total_defense = 0;
  let casting_spell = false;

  let hand: number[] = [];
  let hand_size: number = 0;
  let discarding = [false, false, false, false, false];

  let player_position: V2 = [1.5 * 48 + SCREEN_CENTER_X - 264, 2 * 48 + 32];
  let enemy_position_index = [0, 0, 0, 0];
  let enemy_positions: V2[] = [[8.5 * 48 + SCREEN_CENTER_X - 264, 2 * 48 + 32], [7.5 * 48 + SCREEN_CENTER_X - 264, 0.5 * 48 + 32], [7.5 * 48 + SCREEN_CENTER_X - 264, 3.5 * 48 + 32], [6.5 * 48 + SCREEN_CENTER_X - 264, 2 * 48 + 32]];
  let enemy_offsets: number[] = [0, 0, 0, 0];

  let target_index: number = 0;
  let target_list: string[] = [];
  let target_index_map: number[] = [];

  type AttackAnimation = {
    _source_index: number,
    _action_type: number,
    _action_value: number,
    _done: boolean,
    _playing: boolean,
    _lifetime_remaining: number,
  };

  let enemy_action_queue: AttackAnimation[] = [];
  let queue_index = 0;
  for (let i = 0; i < 4; i++)
  {
    enemy_action_queue[i] = {
      _source_index: 0,
      _action_type: 0,
      _action_value: 0,
      _done: true,
      _playing: false,
      _lifetime_remaining: 0,
    };
  }

  let add_attack = (source_index: number, attack_value: number, action_type: number, lifetime: number) =>
  {
    enemy_action_queue[queue_index]._source_index = source_index;
    enemy_action_queue[queue_index]._action_type = action_type;
    enemy_action_queue[queue_index]._action_value = attack_value;
    enemy_action_queue[queue_index]._done = false;
    enemy_action_queue[queue_index]._playing = false;
    enemy_action_queue[queue_index]._lifetime_remaining = lifetime;
    queue_index++;
  };

  let switch_mode_with_delay = (target_mode: number) =>
  {
    next_mode = target_mode;
    wait_timer = 250;
    mode = COMBAT_MODE_WAIT;
  };

  let go_to_target_mode = () =>
  {
    target_index = 0;
    mode = COMBAT_MODE_SELECT_TARGET;
    let list_index = 0;
    target_list.length = 0;
    target_index_map.length = 0;
    for (let index of enemy_position_index)
    {
      let enemy = enemies[index];
      if (enemy && enemy._alive)
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
      if (enemy && enemy._hp <= 0 && enemy._alive)
      {
        enemy._alive = false;
        loot[enemy._type] += math.ceil(enemy._level / 20);
      }
      enemies_alive = enemies_alive || enemy._alive;
    }
    return enemies_alive;
  };

  let render_mode_text = (text: string) => push_text(text, SCREEN_CENTER_X, SCREEN_HEIGHT - 106, CENTERED_TEXT);

  let _reset_fn = () =>
  {
    player = game_state[GAMESTATE_PLAYER];

    mode = COMBAT_MODE_POST_COMBAT;
    play_card_mode = 0;
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
    let number_of_enemies = enemies.length;

    if (number_of_enemies === 4)
      enemy_position_index = [1, 3, 0, 2];
    else if (number_of_enemies === 3 || number_of_enemies === 2)
      enemy_position_index = [1, 0, 2];
    else
      enemy_position_index = [0];

    game_state[GAMESTATE_COMBAT] = [0, 0, 0];
    hand.length = deck.length = discard_pile.length = total_attack = total_defense = 0;

    deck = structuredClone(shuffle(game_state[GAMESTATE_DECK]));
  };

  let _update_fn = (delta: number) =>
  {
    controls_used();

    hand_size = hand.length;

    if (selected_card_index >= hand_size)
      selected_card_index = hand_size - 1;
    if (selected_card_index < 0)
      selected_card_index = 0;

    if (mode === COMBAT_MODE_WAIT)
    {
      wait_timer -= delta;
      if (wait_timer <= 0)
      {
        mode = next_mode;
      }
    }
    else if (mode === COMBAT_MODE_DRAW)
    {
      for (let i = 4; i >= 0; i--)
      {
        if (discarding[i])
          discard_pile.push(hand.splice(i, 1)[0]);
        discarding[i] = false;
      }
      for (let i = 0; i < 5; i++)
      {
        if (hand[i] === undefined)
        {
          let card_id = deck.pop();
          if (card_id === undefined)
          {
            deck = structuredClone(shuffle(discard_pile));
            discard_pile.length = 0;
            card_id = deck.pop();
          }
          assert(card_id !== undefined, "card from deck undefined after shuffling in discard pile");
          hand[i] = card_id;
        }
      }
      hand_size = hand.length;
      switch_mode_with_delay(COMBAT_MODE_CARD_SELECT);
    }
    else if (mode === COMBAT_MODE_CARD_SELECT)
    {
      controls_used(D_UP, D_DOWN, D_LEFT, D_RIGHT, A_BUTTON);

      if (hand_size === 0 && total_attack > 0)
        go_to_target_mode();
      else if (hand_size === 0)
        switch_mode_with_delay(COMBAT_MODE_DEFEND_ACTION);

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
        if (play_card_mode) // 1 = Play card mode
        {
          if (row)
          {
            selected_action_index = 0;
            casting_spell = false;
            card_use_menu = ["activate"];
            mode = COMBAT_MODE_ACTION_SELECT;

            let card = card_list[hand[selected_card_index]];
            let card_type = card[CARD_TYPE];
            if (card_type === 3) // Buff Card
            {
              for (let effect of card[CARD_EFFECTS])
                (effects[effect[EFFECT_APPLY_FUNCTION]] as EffectFunction)(effect);

              hand.splice(selected_card_index, 1);
              clear_particle_system();
              mode = COMBAT_MODE_CARD_SELECT;
            }
            else if (card_type === 4) // Spell Card
            {
              casting_spell = true;
              go_to_target_mode();
            }
            else // Minion Card
              card_use_menu = ["attack!", "protect me!"];
          }
          else
          {
            row = 1;
            if (total_attack > 0)
              go_to_target_mode();
            else
              switch_mode_with_delay(COMBAT_MODE_DEFEND_ACTION);
          }
        }
        else // 0 = Discard Mode
        {
          if (row)
            discarding[selected_card_index] = !discarding[selected_card_index];
          else
          {
            row = 1;
            play_card_mode = 1; // SWITCH TO PLAY MODE
            clear_particle_system();
            switch_mode_with_delay(COMBAT_MODE_DRAW);
          }
        }
      }
    }
    else if (mode === COMBAT_MODE_ACTION_SELECT)
    {
      controls_used(D_UP, D_DOWN, A_BUTTON, B_BUTTON);

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

        discard_pile.push(card_id);
        clear_particle_system();
        switch_mode_with_delay(COMBAT_MODE_CARD_SELECT);
      }
      else if (B_PRESSED)
        switch_mode_with_delay(COMBAT_MODE_CARD_SELECT);
    }
    else if (mode === COMBAT_MODE_SELECT_TARGET)
    {
      if (casting_spell)
        controls_used(D_UP, D_DOWN, A_BUTTON, B_BUTTON);
      else
        controls_used(D_UP, D_DOWN, A_BUTTON);

      if (UP_PRESSED)
        target_index = safe_subtract(target_index, 1);
      else if (DOWN_PRESSED)
        target_index = safe_add(target_list.length - 1, target_index, 1);
      else if (A_PRESSED)
      {
        if (casting_spell)
        {
          clear_particle_system();

          let target_enemy = enemies[target_index_map[target_index]];

          let card_id = hand[selected_card_index];
          let card = card_list[card_id];
          for (let effect of card[CARD_EFFECTS])
          {
            let effect_fn_id = effect[EFFECT_APPLY_FUNCTION];
            if (effect_fn_id >= 0)
              effects[effect_fn_id](effect, target_enemy);
            if (effect_fn_id === 2)
            {
              buff_particle._position[0] = player_position[0] + 24;
              buff_particle._position[1] = player_position[1] + 40;
              buff_particle._colour_begin = [0, 255, 0, 1];
              buff_particle._colour_end = [0, 255, 0, 0.25];
              emit_particles(buff_particle, 50);
            }
          }

          target_enemy._hp = math.max(0, target_enemy._hp - card[CARD_ATTACK]);

          hand.splice(selected_card_index, 1);
          discard_pile.push(card_id);
          casting_spell = false;

          if (any_enemies_alive(enemies))
            switch_mode_with_delay(COMBAT_MODE_CARD_SELECT);
          else
            switch_mode_with_delay(COMBAT_MODE_POST_COMBAT);
        }
        else
          switch_mode_with_delay(COMBAT_MODE_ATTACK_ACTION);
      }
      else if (B_PRESSED && casting_spell)
      {
        casting_spell = false;
        switch_mode_with_delay(COMBAT_MODE_CARD_SELECT);
      }
    }
    else if (mode === COMBAT_MODE_ATTACK_ACTION)
    {
      // TODO: Player attack animation
      let target_enemy = enemies[target_index_map[target_index]];
      target_enemy._hp = math.max(0, target_enemy._hp - total_attack);
      any_enemies_alive(enemies);

      total_attack = 0;
      switch_mode_with_delay(COMBAT_MODE_DEFEND_ACTION);
    }
    else if (mode === COMBAT_MODE_DEFEND_ACTION)
    {
      queue_index = 0;

      for (let index of enemy_position_index)
      {
        let enemy = enemies[index];
        if (enemy && enemy._alive)
          add_attack(index, enemy._current_intent !== ENEMY_INTENT_TYPE_HEAL ? calculate_attack(enemy) : math.ceil(enemy._attack / 2), enemy._current_intent, 500);
      }

      switch_mode_with_delay(COMBAT_MODE_ENEMY_ATTACKS);
    }
    else if (mode === COMBAT_MODE_ENEMY_ATTACKS)
    {
      let attacks_done = 0;
      for (let action of enemy_action_queue)
      {
        let index = action._source_index;
        let enemy = enemies[index];
        if (action._done)
        {
          attacks_done++;
          continue;
        }

        let intent = action._action_type;
        let is_attack = intent === ENEMY_INTENT_TYPE_ATTACK || intent === ENEMY_INTENT_TYPE_ATTACK_HEAL;

        if (action._lifetime_remaining <= 0)
        {
          action._done = true;
          if (is_attack)
          {
            player[PLAYER_HP] = safe_subtract(player[PLAYER_HP], safe_subtract(action._action_value, total_defense));
            total_defense = safe_subtract(total_defense, action._action_value);
            enemy._hp = safe_subtract(enemy._hp, game_state[GAMESTATE_COMBAT][2]);
          }

          if (intent === ENEMY_INTENT_TYPE_HEAL || intent === ENEMY_INTENT_TYPE_ATTACK_HEAL)
            enemy._hp = safe_add(enemy._max_hp, enemy._hp, action._action_value);
          else if (intent === ENEMY_INTENT_TYPE_BUFF)
            enemy._attack_buff++;

          if (player[PLAYER_HP] <= 0)
          {
            // set death event
            switch_to_scene(Hub._scene_id);
            mode = -1;
            return;
          }
        }

        action._lifetime_remaining -= delta;
        if (is_attack)
          enemy_offsets[index] = math.max(0, math.floor((1 - math.abs((action._lifetime_remaining - 300) / 100 - 1)) * 10) / 10);

        if (!action._playing)
        {
          buff_particle._position[0] = enemy_positions[index][0] + 24;
          buff_particle._position[1] = enemy_positions[index][1] + 40;
          if (is_attack)
            zzfx_play(hit);

          if (intent === ENEMY_INTENT_TYPE_HEAL || intent === ENEMY_INTENT_TYPE_ATTACK_HEAL)
          {
            buff_particle._colour_begin = [0, 255, 0, 1];
            buff_particle._colour_end = [0, 255, 0, 0.25];
            emit_particles(buff_particle, 50);
            zzfx_play(heal_sound);
          }
          else if (intent === ENEMY_INTENT_TYPE_BUFF)
          {
            buff_particle._colour_begin = [255, 0, 0, 1];
            buff_particle._colour_end = [255, 0, 0, 0.25];
            emit_particles(buff_particle, 50);
            zzfx_play(buff_sound);
          }
          action._playing = true;
        }
        break;
      }
      if (attacks_done === 4)
      {
        total_defense = 0;
        switch_mode_with_delay(COMBAT_MODE_POST_COMBAT);
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
          {
            get_next_enemy_intent(enemy);
            enemy._attack_debuff_turns = safe_subtract(enemy._attack_debuff_turns, 1);
          }
        }
        switch_mode_with_delay(COMBAT_MODE_DRAW);
      }
      else
        switch_mode_with_delay(COMBAT_MODE_LOOT_AND_LEAVE);
    }
    else if (mode === COMBAT_MODE_LOOT_AND_LEAVE)
    {
      controls_used(A_BUTTON, B_BUTTON);
      if (A_PRESSED || B_PRESSED)
      {
        for (let l = 0; l < 5; l++)
        {
          if (loot[l] > 0)
          {
            game_state[GAMESTATE_RESOURCES_GATHERED][l] = true;
            game_state[GAMESTATE_CURRENT_DUNGEON]._level_resources[l] += loot[l];
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
          push_quad(render_x, render_y, 48, 48, FLOOR_COLOUR);
        else
          push_quad(render_x, render_y, 48, 48, BLACK);

        if (tile_id > 5)
          push_textured_quad(TEXTURE_FLOOR, render_x, render_y, { _scale: 3, _palette_offset: 12 + (tile_id - 6) * 3 });
        else if (tile_id > 1 && tile_id < 5)
          push_textured_quad(TEXTURE_WALL, render_x, render_y, { _scale: 3, _palette_offset: 3 * (tile_id - 1) });

        let distance = math.sqrt((player_room_x * 11 + 2 - tile_x) ** 2 + (player_room_y * 9 + 3 - tile_y) ** 2);
        if (distance >= 7)
          push_quad(render_x, render_y, 48, 48, BLACK_T75);
        else if (distance >= 5)
          push_quad(render_x, render_y, 48, 48, BLACK_T50);
        else if (distance >= 3)
          push_quad(render_x, render_y, 48, 48, BLACK_T25);
      }
    }

    let barbs = game_state[GAMESTATE_COMBAT][2];
    // Render the entites
    push_quad(player_position[0] + 8 - 6, player_position[1] + 8 + 28, 30, 8, 0x99000000);
    push_textured_quad(TEXTURE_ROBED_MAN, player_position[0] + 8, player_position[1] + 8, { _scale: 2, _palette_offset: PALETTE_PLAYER, _animated: true });
    if (barbs > 0)
      push_text("barbs x " + barbs, player_position[0] + 24, player_position[1] + 44, SMALL_FONT_AND_CENTERED_TEXT);

    if (total_attack > 0)
    {
      push_text(total_attack, player_position[0] + 8, player_position[1], { _align: TEXT_ALIGN_RIGHT });
      push_textured_quad(TEXTURE_SWORD, player_position[0] + 10, player_position[1]);
    }

    if (total_defense > 0)
    {
      push_text(total_defense, player_position[0] + 46, player_position[1], { _align: TEXT_ALIGN_RIGHT });
      push_textured_quad(TEXTURE_SHEILD, player_position[0] + 48, player_position[1]);
    }

    for (let e = 0; e < 4; e++)
    {
      let enemy = enemies[enemy_position_index[e]];
      if (enemy && enemy._alive)
        render_enemy(enemy, enemy_positions[enemy_position_index[e]][0] + 8 - (enemy_offsets[enemy_position_index[e]] * 20), enemy_positions[enemy_position_index[e]][1] + 8);
    }

    for (let hand_index = 0; hand_index < hand_size; hand_index++)
    {
      let card = card_list[hand[hand_index]];
      if (card)
      {
        let selected = hand_index === selected_card_index && row;
        let highlight_colour = discarding[hand_index] ? RED : selected ? WHITE : undefined;
        render_card(50 + 110 * hand_index, SCREEN_HEIGHT - 85 - (selected ? 10 : 0), card, 1, highlight_colour);
      }
    }
    push_text(`${deck.length}|deck`, 25, SCREEN_HEIGHT - 30, SMALL_FONT_AND_CENTERED_TEXT);
    push_text(`${discard_pile.length}|discard`, SCREEN_WIDTH - 25, SCREEN_HEIGHT - 30, SMALL_FONT_AND_CENTERED_TEXT);

    if (mode === COMBAT_MODE_CARD_SELECT && !play_card_mode)
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
      render_panel(SCREEN_CENTER_X - 60, SCREEN_CENTER_Y, 120, 28, !row ? WHITE : DARK_GREY);
      push_text(text, SCREEN_CENTER_X, SCREEN_CENTER_Y + 10, { _align: TEXT_ALIGN_CENTER, _colour: (row ? LIGHT_GREY : WHITE) });
    }
    else if (mode === COMBAT_MODE_CARD_SELECT)
    {
      render_mode_text("play minions and spells from your hard");
      render_panel(SCREEN_CENTER_X - 40, SCREEN_CENTER_Y, 80, 28, !row ? WHITE : DARK_GREY);
      push_text("end turn", SCREEN_CENTER_X, SCREEN_CENTER_Y + 10, { _align: TEXT_ALIGN_CENTER, _colour: (row ? LIGHT_GREY : WHITE) });
    }
    else if (mode === COMBAT_MODE_ACTION_SELECT)
    {
      render_mode_text("select whether to use the minion's attack or defense");
      render_panel(SCREEN_CENTER_X - 55, SCREEN_CENTER_Y, 110, 40);
      render_text_menu(SCREEN_CENTER_X, SCREEN_CENTER_Y + 10, card_use_menu, card_use_menu.length, selected_action_index, 1);
    }
    else if (mode === COMBAT_MODE_SELECT_TARGET)
    {
      render_mode_text("select target");
      let target_list_length = target_list.length;
      render_panel(SCREEN_CENTER_X - 50, SCREEN_CENTER_Y, 100, 14 * target_list_length + 3);
      render_text_menu(SCREEN_CENTER_X, SCREEN_CENTER_Y + 5, target_list, target_list.length, target_index, 1);
    }
    else if (mode === COMBAT_MODE_LOOT_AND_LEAVE)
    {
      render_panel(SCREEN_CENTER_X - 175, 30, 350, 300);
      push_text("victory!", SCREEN_CENTER_X, 50, { _scale: 3, _align: TEXT_ALIGN_CENTER });
      push_text("reagents found", SCREEN_CENTER_X, 110, { _align: TEXT_ALIGN_CENTER, _scale: 2 });
      let y = 0;
      for (let l = 0; l < 5; l++)
      {
        if (loot[l] > 0)
        {
          push_text(`${loot[l]} ${resource_names[l]}`, SCREEN_CENTER_X, 140 + 12 * y, CENTERED_TEXT);
          y++;
        }
      }
      render_panel(SCREEN_CENTER_X - 40, 280, 80, 28);
      push_text("continue", SCREEN_CENTER_X, 290, CENTERED_TEXT);
    }

    render_player_status();
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}