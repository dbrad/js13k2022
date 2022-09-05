import { card_list } from "@gameplay/cards";
import { CENTERED_TEXT, push_text, SMALL_FONT_AND_CENTERED_TEXT } from "@graphics/text";
import { A_PRESSED, B_PRESSED, controls_used, DOWN_PRESSED, LEFT_PRESSED, RIGHT_PRESSED, set_key_pulse_time, UP_PRESSED } from "@input/controls";
import { game_state } from "@root/game-state";
import { render_card } from "@root/nodes/card";
import { render_card_list } from "@root/nodes/card-list";
import { clear_particle_system } from "@root/particle-system";
import { get_next_scene_id, push_scene, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_WIDTH } from "@root/screen";
import { floor, math, number_sort, safe_add, safe_subtract } from "math";
import { Hub } from "./01-hub";
import { Dialog } from "./20-dialog";

export namespace ManageDeck
{
  let column = 0;
  let left_index = 0;
  let right_index = 0;

  let collection: number[];
  let collection_size: number;

  let deck: number[];
  let deck_size: number;

  let _reset_fn = () =>
  {
    controls_used(D_UP, D_DOWN, D_LEFT, D_RIGHT, A_BUTTON, B_BUTTON);
    set_key_pulse_time([D_UP, D_DOWN], 150);
    column = 0;
    left_index = 0;
    right_index = 0;
  };
  let _update_fn = (delta: number) =>
  {
    collection = game_state[GAMESTATE_CARD_COLLECTION];
    collection_size = collection.length;
    deck = game_state[GAMESTATE_DECK];
    deck_size = deck.length;

    if (UP_PRESSED)
    {
      if (column)
        right_index = safe_subtract(right_index);
      else
        left_index = safe_subtract(left_index);
      clear_particle_system();
    }
    else if (DOWN_PRESSED)
    {
      if (column)
        right_index = safe_add(deck_size - 1, right_index);
      else
        left_index = safe_add(collection_size - 1, left_index);
      clear_particle_system();
    }
    else if (LEFT_PRESSED)
    {
      column = 0;
      clear_particle_system();
    }
    else if (RIGHT_PRESSED)
    {
      column = 1;
      clear_particle_system();
    }
    else if (A_PRESSED)
    {
      if (column)
      {
        let card_id = deck.splice(right_index, 1)[0];
        if (card_id > 2)
        {
          collection.push(card_id);
          collection.sort(number_sort);
        }
      }
      else
      {
        let card_id = collection[left_index];
        if (card_id > 2)
          collection.splice(left_index, 1);
        deck.push(card_id);
        deck.sort(number_sort);
      }
      collection_size = collection.length;
      deck_size = deck.length;
      left_index = math.min(collection_size - 1, left_index);
      right_index = math.min(deck_size - 1, right_index);
      clear_particle_system();
    }
    else if (B_PRESSED)
    {
      if (deck_size < 10 || deck_size > 40)
      {
        Dialog._push_dialog_text("deck must contain at least 10 cards|and no more than 40.");
        push_scene(Dialog._scene_id);
      }
      else
        switch_to_scene(Hub._scene_id);
    }
  };

  let _render_fn = () =>
  {
    push_text("deck management", SCREEN_WIDTH - 5, 5, { _scale: 3, _align: TEXT_ALIGN_RIGHT });
    push_text("collection (" + collection_size + ")", 75, 30, CENTERED_TEXT);
    push_text("deck (" + deck_size + ") (max 40)", SCREEN_WIDTH - 75, 30, CENTERED_TEXT);
    push_text("player max hp. " + floor(deck_size / 2), SCREEN_WIDTH - 75, 40, SMALL_FONT_AND_CENTERED_TEXT);

    render_card_list(5, 50, collection, collection_size, column ? -1 : left_index);
    render_card_list(SCREEN_WIDTH - 140, 50, deck, deck_size, column ? right_index : -1);

    let card_index = column ? deck[right_index] : collection[left_index];
    if (card_index !== undefined)
      render_card(SCREEN_CENTER_X - 100, SCREEN_CENTER_Y - 37, card_list[card_index], 2);
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}