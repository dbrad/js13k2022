import { assert } from "@debug/assert";
import { BLACK, floor_palettes, wall_palettes, WHITE } from "@graphics/colour";
import { push_quad, push_textured_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { key_state } from "@input/controls";
import { V2 } from "@math/vector";
import { Card, Effect, Enemy, game_state, Level, Player } from "@root/game-state";
import { render_card } from "@root/nodes/card";
import { render_panel } from "@root/nodes/panel";
import { render_player_status } from "@root/nodes/player-status";
import { render_text_menu } from "@root/nodes/text-menu";
import { render_enemy } from "@root/nodes/unit";
import { get_next_scene_id, Scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_HEIGHT } from "@root/screen";
import { math, shuffle } from "math";
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

  type Minion = {
    _type: number,
    _value: number;
    _effects: Effect[];
  };

  let player: Player;
  let attackers: Minion[] = [];
  let defenders: Minion[] = [];
  let deck: Card[] = [];
  let discard: Card[] = [];

  let hand: Card[] = [];
  let hand_size: number = 0;
  let discarding = [false, false, false, false, false];

  type AttackAnimation = {
    _attack_type: number,
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
      _attack_type: 0,
      _attack_value: 0,
      _done: true,
      _playing: false,
      _lifetime_remaining: 0,
      _animation_fn: () => { }
    };
  }

  let add_attack = (attack_type: number, attack_value: number, lifetime: number, animation_fn: () => void) =>
  {
    attack_queue[queue_index]._attack_type = attack_type;
    attack_queue[queue_index]._attack_value = attack_value;
    attack_queue[queue_index]._done = false;
    attack_queue[queue_index]._playing = false;
    attack_queue[queue_index]._lifetime_remaining = lifetime;
    attack_queue[queue_index]._animation_fn = animation_fn;
    queue_index++;
  };

  let player_position: V2 = [1.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 48];
  let summon_positions: V2[] = [
    [3.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 48],
    [1.5 * 48 + SCREEN_CENTER_X - 264, 2 * 48 + 48],
    [1.5 * 48 + SCREEN_CENTER_X - 264, 4 * 48 + 48],
    [3 * 48 + SCREEN_CENTER_X - 264, 1.5 * 48 + 48],
    [3 * 48 + SCREEN_CENTER_X - 264, 4.5 * 48 + 48],
  ];
  let enemy_starting_positions: V2[] = [
    [8.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 48],
    [7.5 * 48 + SCREEN_CENTER_X - 264, 1.5 * 48 + 48],
    [7.5 * 48 + SCREEN_CENTER_X - 264, 4.5 * 48 + 48],
    [6.5 * 48 + SCREEN_CENTER_X - 264, 3 * 48 + 48],
  ];
  let enemy_positions: V2[] = [];

  let _reset_fn = () =>
  {
    mode = COMBAT_MODE_POST_COMBAT;
    sub_mode = 0;
    row = 1;

    current_level = game_state[GAMESTATE_CURRENT_DUNGEON];
    let player_tile_x = math.floor(current_level._player_position[0] / 16);
    let player_tile_y = math.floor(current_level._player_position[1] / 16);
    player_room_x = math.floor(player_tile_x / 11);
    player_room_y = math.floor(player_tile_y / 9);
    let player_room_index = player_room_y * 10 + player_room_x;
    let player_room = current_level._rooms[player_room_index];
    enemies = player_room._enemies;

    player = game_state[GAMESTATE_PLAYER];
    deck = JSON.parse(JSON.stringify(game_state[GAMESTATE_DECK]));

    for (let [i, [x, y]] of enemy_starting_positions.entries())
    {
      enemy_positions[i] = [x, y];
    }
  };

  let _update_fn = (now: number, delta: number) =>
  {
    let UP_PRESSED = key_state[D_UP] === KEY_WAS_DOWN;
    let DOWN_PRESSED = key_state[D_DOWN] === KEY_WAS_DOWN;
    let LEFT_PRESSED = key_state[D_LEFT] === KEY_WAS_DOWN;
    let RIGHT_PRESSED = key_state[D_RIGHT] === KEY_WAS_DOWN;
    let A_PRESSED = key_state[A_BUTTON] === KEY_WAS_DOWN;
    let B_PRESSED = key_state[B_BUTTON] === KEY_WAS_DOWN;
    hand_size = hand.length;

    if (selected_card_index >= hand_size)
      selected_card_index = hand_size - 1;
    if (selected_card_index < 0)
      selected_card_index = 0;

    if (mode === COMBAT_MODE_DRAW)
    {
      for (let i = 0; i < 5; i++)
      {
        if (discarding[i])
          discard.push(hand.splice(i, 1)[0]);
        discarding[i] = false;
      }
      for (let i = 0; i < 5; i++)
      {
        if (!hand[i])
        {
          let card = deck.pop();
          if (!card)
          {
            deck = window.structuredClone(shuffle(discard));
            discard.length = 0;
            card = deck.pop();
          }
          assert(card !== undefined, "card from deck undefined after shuffling in discard pile");
          hand[i] = card;
        }
      }
      hand_size = hand.length;
      mode = COMBAT_MODE_CARD_SELECT;
    }
    else if (mode === COMBAT_MODE_CARD_SELECT)
    {
      if (hand_size === 0)
        mode = COMBAT_MODE_ATTACK_ACTION;

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
            mode = COMBAT_MODE_ACTION_SELECT;
          else
          {
            mode = COMBAT_MODE_ATTACK_ACTION;
            row = 1;
          }
        }
        else // 0 = Discard Mode
        {
          if (row)
            discarding[selected_card_index] = !discarding[selected_card_index];
          else
          {
            mode = COMBAT_MODE_DRAW;
            sub_mode = 1; // SWITCH TO PLAY MODE
            row = 1;
          }
        }
      }
    }
    else if (mode === COMBAT_MODE_ACTION_SELECT)
    {
      // ACTION SELECT
      if (UP_PRESSED)
        selected_action_index = math.max(0, selected_action_index - 1);
      else if (DOWN_PRESSED)
        selected_action_index = math.min(1, selected_action_index + 1);
      else if (A_PRESSED)
      {
        let card = hand.splice(selected_card_index, 1)[0];

        if (selected_action_index)
          defenders.push({ _type: card[CARD_TYPE], _value: card[CARD_DEFENSE], _effects: card[CARD_EFFECTS] });
        else
          attackers.push({ _type: card[CARD_TYPE], _value: card[CARD_ATTACK], _effects: card[CARD_EFFECTS] });

        discard.push(card);
        mode = COMBAT_MODE_CARD_SELECT;
      }
      else if (B_PRESSED)
      {
        mode = COMBAT_MODE_CARD_SELECT;
      }
    }
    else if (mode === COMBAT_MODE_ATTACK_ACTION)
    {
      // ATTACK ACTION MINIGAME
      if (A_PRESSED)
      {
        attackers.length = 0;
        mode = COMBAT_MODE_DEFEND_ACTION;
      }
    }
    else if (mode === COMBAT_MODE_DEFEND_ACTION)
    {
      // DEFENSE ACTION MINIGAME
      if (A_PRESSED)
      {
        defenders.length = 0;
        mode = COMBAT_MODE_ENEMY_ATTACKS;
        add_attack(0, 0, 100, () => { });
        add_attack(0, 0, 100, () => { });
        add_attack(0, 0, 100, () => { });
        add_attack(0, 0, 100, () => { });
      }
    }
    else if (mode === COMBAT_MODE_ENEMY_ATTACKS)
    {
      // Enemy Attacks Playing Out
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
          // player death?
          // enemy death via barbs?
          // handle xp
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
      if (attacks_done === 4)
      {
        queue_index = 0;
        mode = COMBAT_MODE_POST_COMBAT;
      }
    }
    else if (mode === COMBAT_MODE_POST_COMBAT)
    {
      let enemies_alive = false;
      for (let enemy of enemies)
        enemies_alive = enemies_alive || enemy._alive;
      if (enemies_alive)
      {
        // get new enemy intents
        mode = COMBAT_MODE_DRAW;
        sub_mode = 0;
        row = 1;

      }
      else
        mode = COMBAT_MODE_LOOT_AND_LEAVE;
    }
    else if (mode === COMBAT_MODE_LOOT_AND_LEAVE)
    {
      // COMBAT OVER, SHOW LOOT THEN LEAVE TO MAP
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

    push_quad(player_position[0] + 8 - 6, player_position[1] + 8 + 28, 30, 8, 0x99000000);
    push_textured_quad(TEXTURE_ROBED_MAN, player_position[0] + 8, player_position[1] + 8, { _scale: 2, _palette_offset: PALETTE_PLAYER, _animated: true });

    // for (let s = 0; s < 5; s++)
    // {
    //   if (summons[s] && summons[s][SUMMON_ALIVE])
    //     render_summon(summons[s], summon_positions[s][0] + 8, summon_positions[s][1] + 8);
    // }

    for (let e = 0; e < 4; e++)
    {
      if (enemies[e] && enemies[e]._alive)
        render_enemy(enemies[e], enemy_positions[e][0] + 8, enemy_positions[e][1] + 8);
    }

    if (mode === COMBAT_MODE_CARD_SELECT || mode === COMBAT_MODE_DRAW || mode === COMBAT_MODE_ACTION_SELECT)
    {
      for (let hand_index = 0; hand_index < hand_size; hand_index++)
      {
        let card = hand[hand_index];
        if (card)
        {
          let selected = hand_index === selected_card_index && row;
          let highlight_colour = discarding[hand_index] ? 0xff0000ff : selected ? WHITE : undefined;
          render_card(50 + 110 * hand_index, SCREEN_HEIGHT - 85 - (selected ? 10 : 0), card, highlight_colour);
        }
      }
    }
    if (mode === COMBAT_MODE_CARD_SELECT && !sub_mode)
    {
      push_text("discard and draw", SCREEN_CENTER_X, SCREEN_HEIGHT - 110, { _align: TEXT_ALIGN_CENTER });
      render_panel(SCREEN_CENTER_X - 40, SCREEN_CENTER_Y - 10, 80, 28, !row ? WHITE : 0xff2d2d2d);
      let text = "done";
      for (let d = 0; d < 5; d++)
      {
        if (discarding[d])
        {
          text = "discard";
          break;
        }
      }
      push_text(text, SCREEN_CENTER_X, SCREEN_CENTER_Y, { _align: TEXT_ALIGN_CENTER, _colour: (row ? 0xff444444 : WHITE) });
    }
    else if (mode === COMBAT_MODE_CARD_SELECT)
    {
      render_panel(SCREEN_CENTER_X - 40, SCREEN_CENTER_Y - 10, 80, 28, !row ? WHITE : 0xff2d2d2d);
      push_text("end turn", SCREEN_CENTER_X, SCREEN_CENTER_Y, { _align: TEXT_ALIGN_CENTER, _colour: (row ? 0xff444444 : WHITE) });
    }

    render_player_status();

    if (mode === COMBAT_MODE_ACTION_SELECT)
    {
      render_panel(SCREEN_CENTER_X - 55, SCREEN_CENTER_Y + 30 - 10, 110, 40);
      render_text_menu([SCREEN_CENTER_X, SCREEN_CENTER_Y + 30], ["attack!", "protect me!"], 2, selected_action_index, 1);
    }
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}