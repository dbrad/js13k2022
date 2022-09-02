import { push_text } from "@graphics/text";
import { A_PRESSED, controls_used, DOWN_PRESSED, UP_PRESSED } from "@input/controls";
import { game_state } from "@root/game-state";
import { render_resources } from "@root/nodes/resources";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, push_scene, Scene, switch_to_scene } from "@root/scene";
import { monetization_reference, SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_WIDTH } from "@root/screen";
import { number_sort, safe_add, safe_subtract } from "math";
import { MainMenu } from "./00-main-menu";
import { Craft } from "./01a-craft";
import { ManageDeck } from "./01b-manaage-deck";
import { LevelSelect } from "./02-level-select";
import { Dialog } from "./20-dialog";
export namespace Hub
{
  let selected_option_index: number;
  let number_of_options = 4;
  let menu_options = [
    "descend",
    "craft cards",
    "manage deck",
    "save and quit"
  ];
  let _reset_fn = () =>
  {
    controls_used(D_UP, D_DOWN, A_BUTTON);
    selected_option_index = 0;
  };
  let _update_fn = (delta: number) =>
  {
    if (monetization_reference && monetization_reference.state === "started")
    {
      if (game_state[GAMESTATE_EVENTS][EVENT_COIL_FIRST_TIME] === EVENT_NOT_DONE)
      {
        Dialog._push_dialog_text("thank you for supporting this game|through web monetization!");
        Dialog._push_dialog_text("as a bonus a few extra cards have been|added to you collection!");
        Dialog._push_dialog_text("death coil added!|level 1 skeleton, zombie,|and spirit added!");
        game_state[GAMESTATE_CARD_COLLECTION].push(3, 4, 5, 12);
        game_state[GAMESTATE_CARD_COLLECTION].sort(number_sort);
        push_scene(Dialog._scene_id);
        game_state[GAMESTATE_EVENTS][EVENT_COIL_FIRST_TIME] = EVENT_DONE;
        return;
      }
    }
    else
    {
    }

    if (game_state[GAMESTATE_EVENTS][1] === EVENT_PENDING)
    {
      Dialog._push_dialog_text("you have fallen in battle and|you have been brough back to the|entrance of the catacombs.");
      push_scene(Dialog._scene_id);
      game_state[GAMESTATE_EVENTS][1] = EVENT_DONE;
    }

    if (UP_PRESSED)
      selected_option_index = safe_subtract(selected_option_index);
    else if (DOWN_PRESSED)
      selected_option_index = safe_add(number_of_options - 1, selected_option_index);
    else if (A_PRESSED)
    {
      if (selected_option_index === 0)
        switch_to_scene(LevelSelect._scene_id);
      else if (selected_option_index === 1)
        switch_to_scene(Craft._scene_id);
      else if (selected_option_index === 2)
        switch_to_scene(ManageDeck._scene_id);
      else if (selected_option_index === number_of_options - 1)
        switch_to_scene(MainMenu._scene_id);
    }
  };
  let _render_fn = () =>
  {
    push_text("catacombs entrance", SCREEN_WIDTH - 5, 5, { _scale: 3, _align: TEXT_ALIGN_RIGHT });
    render_text_menu(SCREEN_CENTER_X, SCREEN_CENTER_Y - 50, menu_options, number_of_options, selected_option_index);
    render_resources(game_state[GAMESTATE_RESOURCES]);
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}