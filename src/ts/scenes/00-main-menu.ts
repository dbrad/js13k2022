import { CENTERED_TEXT, push_text, SMALL_FONT_AND_CENTERED_TEXT } from "@graphics/text";
import { A_PRESSED, controls_used, DOWN_PRESSED, UP_PRESSED } from "@input/controls";
import { has_save_file, load_game, setup_game_state } from "@root/game-state";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_HEIGHT } from "@root/screen";
import { safe_add, safe_subtract } from "math";
import { Hub } from "./01-hub";

export namespace MainMenu
{
  let selected_option_index: number;
  let number_of_options: number;
  let menu_options: string[];

  let _reset_fn = () =>
  {
    controls_used(D_UP, D_DOWN, A_BUTTON);
    selected_option_index = 0;
    menu_options = [];
    if (has_save_file())
      menu_options[0] = "continue";
    menu_options.push("new game");
    number_of_options = menu_options.length;
  };

  let _update_fn = (delta: number) =>
  {
    if (UP_PRESSED)
      selected_option_index = safe_subtract(selected_option_index);
    else if (DOWN_PRESSED)
      selected_option_index = safe_add(number_of_options - 1, selected_option_index);
    else if (A_PRESSED)
    {
      if (number_of_options === 2 && selected_option_index === 0)
        load_game();
      if (selected_option_index === number_of_options - 1)
        setup_game_state();
      switch_to_scene(Hub._scene_id);
    }
  };

  let _render_fn = () =>
  {
    push_text("forgotten depths", SCREEN_CENTER_X, SCREEN_CENTER_Y - 110, { _align: TEXT_ALIGN_CENTER, _scale: 3 });
    push_text("path of the necromancer", SCREEN_CENTER_X, SCREEN_CENTER_Y - 70, SMALL_FONT_AND_CENTERED_TEXT);
    render_text_menu(SCREEN_CENTER_X, SCREEN_CENTER_Y - 20, menu_options, number_of_options, selected_option_index);
    push_text(`js13k 2022 entry by david brad`, SCREEN_CENTER_X, SCREEN_HEIGHT - 30, CENTERED_TEXT);
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}