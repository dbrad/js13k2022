import { CENTERED, push_text, SMALL_AND_CENTERED } from "@graphics/text";
import { A_PRESSED, DOWN_PRESSED, UP_PRESSED } from "@input/controls";
import { has_save_file, load_game, setup_game_state } from "@root/game-state";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_HEIGHT } from "@root/screen";
import { safe_add, safe_subtract } from "math";
import { Hub } from "./01-hub";

export namespace MainMenu
{
  let selected_option_index = 0;
  let number_of_options = 1;
  let menu_options = [
    "new game",
  ];

  let _reset_fn = () =>
  {
    if (has_save_file())
    {
      number_of_options = 2;
      menu_options = [
        "continue",
        "new game",
      ];
    }
  };

  let timer_end = Date.parse('13 Sep 2022 07:00:00 EST') / 1000;
  let remaining_seconds: number;
  let _update_fn = (now: number, delta: number) =>
  {
    if (DEBUG)
      remaining_seconds = timer_end - Date.now() / 1000;

    if (UP_PRESSED)
      selected_option_index = safe_subtract(selected_option_index, 1);
    else if (DOWN_PRESSED)
      selected_option_index = safe_add(number_of_options - 1, selected_option_index, 1);
    else if (A_PRESSED)
    {
      if (number_of_options == 2 && selected_option_index == 0)
        load_game();
      if (selected_option_index == number_of_options - 1)
        setup_game_state();
      switch_to_scene(Hub._scene_id);
    }
  };

  let _render_fn = () =>
  {
    if (DEBUG)
    {
      let days = (Math.floor(remaining_seconds / 86400) + "").padStart(2, "0");
      let hours = (Math.floor((remaining_seconds % 86400) / 3600) + "").padStart(2, "0");
      let minutes = (Math.floor((remaining_seconds % 86400) % 3600 / 60) + "").padStart(2, "0");
      let seconds = (Math.floor(remaining_seconds % 60) + "").padStart(2, "0");

      push_text(`submission deadline ${days}.${hours}.${minutes}.${seconds}`, SCREEN_CENTER_X, SCREEN_HEIGHT - 40, SMALL_AND_CENTERED);
    }

    push_text("forgotten depths", SCREEN_CENTER_X, SCREEN_CENTER_Y - 110, { _align: TEXT_ALIGN_CENTER, _scale: 3 });
    push_text("path of the necromancer", SCREEN_CENTER_X, SCREEN_CENTER_Y - 70, SMALL_AND_CENTERED);
    render_text_menu([SCREEN_CENTER_X, SCREEN_CENTER_Y - 20], menu_options, number_of_options, selected_option_index);
    push_text(`js13k 2022 entry by david brad`, SCREEN_CENTER_X, SCREEN_HEIGHT - 30, CENTERED);
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}