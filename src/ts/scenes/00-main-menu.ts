import { push_text } from "@graphics/text";
import { key_state, set_key_pulse_time } from "@input/controls";
import { has_save_file, load_game, setup_game_state } from "@root/game-state";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_HEIGHT } from "@root/screen";
import { math } from "math";
import { Hub } from "./01-hub";

export namespace MainMenu
{
  let selected_option_index = 0;
  let number_of_options = 2;
  let menu_options = [
    "new game",
    "options"
  ];

  let _setup_fn = () => { };
  let _reset_fn = () =>
  {
    set_key_pulse_time([D_UP, D_DOWN], 250);
    if (has_save_file())
    {
      number_of_options = 3;
      menu_options = [
        "continue",
        "new game",
        "options"
      ];
    }
  };

  let timer_end = Date.parse('13 Sep 2022 07:00:00 EST') / 1000;
  let remaining_seconds: number;
  let _update_fn = (now: number, delta: number) =>
  {
    if (DEBUG)
      remaining_seconds = timer_end - Date.now() / 1000;

    if (key_state.get(D_UP) === KEY_WAS_DOWN)
      selected_option_index = math.max(0, selected_option_index - 1);
    else if (key_state.get(D_DOWN) === KEY_WAS_DOWN)
      selected_option_index = math.min(number_of_options - 1, selected_option_index + 1);
    else if (key_state.get(A_BUTTON) === KEY_WAS_DOWN)
    {
      if (number_of_options == 3 && selected_option_index == 0)
      {
        load_game();
        switch_to_scene(Hub._scene_id);
      }
      if (selected_option_index == number_of_options - 2)
      {
        setup_game_state();
        switch_to_scene(Hub._scene_id);
      }
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

      push_text(`Submission Deadline: ${days}:${hours}:${minutes}:${seconds}`, SCREEN_CENTER_X, SCREEN_HEIGHT - 40, { _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER });
    }

    push_text("The Forgotten Depths", SCREEN_CENTER_X, SCREEN_CENTER_Y - 110, { _align: TEXT_ALIGN_CENTER, _scale: 3 });
    push_text("birth of a necromancer", SCREEN_CENTER_X, SCREEN_CENTER_Y - 60, { _align: TEXT_ALIGN_CENTER, _font: FONT_SMALL });
    render_text_menu([SCREEN_CENTER_X, SCREEN_CENTER_Y], menu_options, number_of_options, selected_option_index);
    push_text(`entry by david brad`, SCREEN_CENTER_X, SCREEN_HEIGHT - 30, { _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER });
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _setup_fn, _reset_fn, _update_fn, _render_fn };
}