import { generate_level } from "@gameplay/level-gen";
import { A_PRESSED, DOWN_PRESSED, UP_PRESSED } from "@input/controls";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "@root/screen";
import { safe_add, safe_subtract } from "math";
import { Dungeon } from "./03-dungeon";
export namespace LevelSelect
{
  let selected_option_index = 0;
  let number_of_options = 1;
  let menu_options = [
    "continue",
  ];

  let _reset_fn = () =>
  {
    // TODO: update menu options based on game progress
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
      {
        generate_level(1, 0);
        switch_to_scene(Dungeon._scene_id);
      }
    }
  };
  let _render_fn = () =>
  {
    render_text_menu([SCREEN_CENTER_X, SCREEN_CENTER_Y], menu_options, number_of_options, selected_option_index);
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}