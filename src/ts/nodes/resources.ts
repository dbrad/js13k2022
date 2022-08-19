import { push_text } from "@graphics/text";
import { game_state } from "@root/game-state";
import { render_panel } from "./panel";

let currencies = ["bones", "flesh", "souls"];
export let render_resources = (x: number, y: number) =>
{
  for (let i = 0; i < 3; i++)
  {
    render_panel(x, y, 50, 28);
    push_text(currencies[i] + "\n" + game_state[GAMESTATE_PLAYER][PLAYER_BONES + i], x + 25, 10, { _align: TEXT_ALIGN_CENTER });
    x += 55;
  }
};