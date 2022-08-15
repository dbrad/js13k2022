import { key_state } from "@input/controls";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X } from "@root/screen";
import { math } from "math";
import { MainMenu } from "./00-main-menu";
import { LevelSelect } from "./02-level-select";
export namespace Hub
{
  let selected_option_index = 0;
  let number_of_options = 6;
  let menu_options = [
    "descend",
    "inventory",
    "bone pile",
    "flesh mound",
    "soul well",
    "save and quit"
  ];
  let _reset_fn = () =>
  {
    selected_option_index = 0;
  };
  let _update_fn = (now: number, delta: number) =>
  {
    if (key_state[D_UP] === KEY_WAS_DOWN)
      selected_option_index = math.max(0, selected_option_index - 1);
    else if (key_state[D_DOWN] === KEY_WAS_DOWN)
      selected_option_index = math.min(number_of_options - 1, selected_option_index + 1);
    else if (key_state[A_BUTTON] === KEY_WAS_DOWN)
    {
      if (selected_option_index === 0)
      {
        switch_to_scene(LevelSelect._scene_id);
      }
      else if (selected_option_index === 5)
      {
        switch_to_scene(MainMenu._scene_id);
      }
    }
  };
  let _render_fn = () =>
  {
    render_text_menu([SCREEN_CENTER_X, 100], menu_options, number_of_options, selected_option_index);
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}