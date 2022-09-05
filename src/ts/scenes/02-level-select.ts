import { generate_level } from "@gameplay/level-gen";
import { push_text } from "@graphics/text";
import { A_PRESSED, B_PRESSED, controls_used, DOWN_PRESSED, UP_PRESSED } from "@input/controls";
import { game_state } from "@root/game-state";
import { render_text_menu } from "@root/nodes/text-menu";
import { get_next_scene_id, Scene, switch_to_scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_WIDTH } from "@root/screen";
import { floor, math, safe_add, safe_subtract } from "math";
import { Hub } from "./01-hub";
import { Dungeon } from "./03-dungeon";
export namespace LevelSelect
{
  let selected_option_index = 0;
  let number_of_options = 0;
  let chapter_names = [
    "the catacombs",
    "the bone zone",
    "the flesh mound",
    "the forgotten haunt",
    "the lich's throne",
    "the depths",
    "the unknown",
    "the abyss",
  ];

  let menu_options: string[] = [];

  let _reset_fn = () =>
  {
    controls_used(D_UP, D_DOWN, A_BUTTON, B_BUTTON);
    for (let c = 0; c <= math.min(8, game_state[GAMESTATE_PLAYER][PLAYER_GAME_PROGRESS]); c++)
    {
      menu_options[c] = chapter_names[c];
    }
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
      game_state[GAMESTATE_PLAYER][PLAYER_MAX_HP] = floor(game_state[GAMESTATE_DECK].length / 2);
      game_state[GAMESTATE_PLAYER][PLAYER_HP] = game_state[GAMESTATE_PLAYER][PLAYER_MAX_HP];
      generate_level(selected_option_index + 1);
      switch_to_scene(Dungeon._scene_id);
    }
    else if (B_PRESSED)
      switch_to_scene(Hub._scene_id);
  };
  let _render_fn = () =>
  {
    push_text("level select", SCREEN_WIDTH - 5, 5, { _scale: 3, _align: TEXT_ALIGN_RIGHT });
    render_text_menu(SCREEN_CENTER_X, SCREEN_CENTER_Y - 100, menu_options, number_of_options, selected_option_index);
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}