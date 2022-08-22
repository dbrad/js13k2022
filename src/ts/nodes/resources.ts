import { push_text } from "@graphics/text";
import { game_state } from "@root/game-state";
import { SCREEN_WIDTH } from "@root/screen";
import { render_panel } from "./panel";

export let resource_names = ["bones", "rotting flesh", "souls", "human hearts", "lich hearts"];

export let render_resoures = () =>
{
  for (let r = 0; r < 5; r++)
  {
    render_panel(SCREEN_WIDTH - 125, 40 + 40 * r, 120, 30);
    push_text(resource_names[r], SCREEN_WIDTH - 10, 45 + 40 * r, { _align: TEXT_ALIGN_RIGHT });
    push_text(game_state[GAMESTATE_RESOURCES][r] + "", SCREEN_WIDTH - 10, 57 + 40 * r, { _align: TEXT_ALIGN_RIGHT });
  }
};