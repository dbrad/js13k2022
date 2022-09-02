import { card_list } from "@gameplay/cards";
import { RED, WHITE } from "@graphics/colour";
import { CENTERED_TEXT, push_text } from "@graphics/text";
import { A_PRESSED, B_PRESSED, controls_used, DOWN_PRESSED, set_key_pulse_time, UP_PRESSED } from "@input/controls";
import { game_state } from "@root/game-state";
import { render_card } from "@root/nodes/card";
import { render_card_list } from "@root/nodes/card-list";
import { get_resource_name, render_resources } from "@root/nodes/resources";
import { clear_particle_system } from "@root/particle-system";
import { get_next_scene_id, push_scene, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_WIDTH } from "@root/screen";
import { number_sort, safe_add, safe_subtract } from "math";
import { Hub } from "./01-hub";
import { Dialog } from "./20-dialog";

export namespace Craft
{
  let card_costs: number[][] = "10000|01000|00100|30000|03000|00300|20010|02010|00210|11110|20010|02010|00210|11110|11110|30001|03001|00301|22201|50001|05001|00501".split("|").map(a => a.split("").map(n => +n));
  let card_index_list: number[] = [...Array(card_list.length).keys()];
  let number_of_cards = card_list.length;

  let selection_index = 0;
  let player_resources: number[];

  let can_afford = (costs: number[]) =>
  {
    for (let [i, cost] of costs.entries())
      if (cost > player_resources[i])
        return false;
    return true;
  };

  let _reset_fn = () =>
  {
    controls_used(D_UP, D_DOWN, A_BUTTON, B_BUTTON);
    set_key_pulse_time([D_UP, D_DOWN], 150);
    selection_index = 0;
    player_resources = game_state[GAMESTATE_RESOURCES];
  };

  let _update_fn = (delta: number) =>
  {
    let collection = game_state[GAMESTATE_CARD_COLLECTION];
    if (UP_PRESSED)
    {
      selection_index = safe_subtract(selection_index, 1);
      clear_particle_system();
    }
    else if (DOWN_PRESSED)
    {
      selection_index = safe_add(number_of_cards - 4, selection_index, 1);
      clear_particle_system();
    }
    else if (A_PRESSED)
    {
      let costs = card_costs[selection_index];
      if (can_afford(costs))
      {
        let card = card_list[selection_index + 3];
        Dialog._push_yes_no_dialog(`are you sure you want to craft|"${card[CARD_NAME].replace("|", " ")}"`,
          () =>
          {
            for (let [i, cost] of costs.entries())
              player_resources[i] -= cost;
            collection.push(selection_index + 3);
            collection.sort(number_sort);
          });
      }
      else
        Dialog._push_dialog_text("cannot afford to craft this card");
      push_scene(Dialog._scene_id);
    }
    else if (B_PRESSED)
      switch_to_scene(Hub._scene_id);
  };

  let _render_fn = () =>
  {
    push_text("card crafting", SCREEN_WIDTH - 5, 5, { _scale: 3, _align: TEXT_ALIGN_RIGHT });
    render_card_list(5, 50, card_index_list, number_of_cards, selection_index, 3);
    render_card(SCREEN_CENTER_X - 100, 50, card_list[selection_index + 3], 2);

    push_text("crafting cost", SCREEN_CENTER_X, SCREEN_CENTER_Y + 35, CENTERED_TEXT);
    let costs = card_costs[selection_index];
    let y_offset = 0;
    for (let [i, cost] of costs.entries())
    {
      if (cost > 0)
      {
        let _colour = cost <= player_resources[i] ? WHITE : RED;
        push_text(cost + " " + get_resource_name(i), SCREEN_CENTER_X, SCREEN_CENTER_Y + 60 + y_offset, { _align: TEXT_ALIGN_CENTER, _colour });
        y_offset += 15;
      }
    }
    render_resources(game_state[GAMESTATE_RESOURCES]);
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}