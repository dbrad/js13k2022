import { push_text } from "@graphics/text";
import { A_PRESSED, DOWN_PRESSED, UP_PRESSED } from "@input/controls";
import { render_resoures } from "@root/nodes/resources";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_WIDTH } from "@root/screen";
import { safe_add, safe_subtract } from "math";
import { MainMenu } from "./00-main-menu";
import { Craft } from "./01a-craft";
import { ManageDeck } from "./01b-manaage-deck";
import { LevelSelect } from "./02-level-select";
export namespace Hub
{
  let selected_option_index = 0;
  let number_of_options = 4;
  let menu_options = [
    "descend",
    "craft cards",
    "manage deck",
    "save and quit"
  ];
  let _reset_fn = () =>
  {
    selected_option_index = 0;
  };
  let _update_fn = (now: number, delta: number) =>
  {
    if (UP_PRESSED)
      selected_option_index = safe_subtract(selected_option_index, 1);
    else if (DOWN_PRESSED)
      selected_option_index = safe_add(number_of_options - 1, selected_option_index, 1);
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
    render_text_menu([SCREEN_CENTER_X, SCREEN_CENTER_Y - 50], menu_options, number_of_options, selected_option_index);
    render_resoures();
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}