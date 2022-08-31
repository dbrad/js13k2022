import { generate_level } from "@gameplay/level-gen";
import { A_PRESSED, B_PRESSED, controls_used, DOWN_PRESSED, UP_PRESSED } from "@input/controls";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "@root/screen";
import { safe_add, safe_subtract } from "math";
import { Hub } from "./01-hub";
import { Dungeon } from "./03-dungeon";
export namespace LevelSelect
{
  let selected_option_index = 0;
  let number_of_options = 5;
  let menu_options = [
    "the catacombs",
    "the bone zone",
    "the flesh mound",
    "the forgotten haunt",
    "the throne of the first lich",
  ];

  let _reset_fn = () =>
  {
    controls_used(D_UP, D_DOWN, A_BUTTON, B_BUTTON);
    // TODO: update menu options based on game progress
  };

  let _update_fn = (delta: number) =>
  {
    if (UP_PRESSED)
      selected_option_index = safe_subtract(selected_option_index, 1);
    else if (DOWN_PRESSED)
      selected_option_index = safe_add(number_of_options - 1, selected_option_index, 1);
    else if (A_PRESSED)
    {
      generate_level(selected_option_index + 1, 0);
      switch_to_scene(Dungeon._scene_id);
    }
    else if (B_PRESSED)
      switch_to_scene(Hub._scene_id);
  };
  let _render_fn = () =>
  {
    render_text_menu(SCREEN_CENTER_X, SCREEN_CENTER_Y - 100, menu_options, number_of_options, selected_option_index);
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}