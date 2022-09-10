import { card_list } from "@gameplay/cards";
import { push_textured_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { load_game } from "@root/game-state";
import { render_card } from "@root/nodes/card";
import { get_next_scene_id, Scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "@root/screen";
export namespace Image160160
{
  let _reset_fn = () =>
  {
    load_game();
  };
  let _update_fn = (delta: number) => { };
  let _render_fn = () =>
  {
    push_text("forgotten|depths", SCREEN_CENTER_X + 110, SCREEN_CENTER_Y - 90, { _align: TEXT_ALIGN_RIGHT, _scale: 3 });
    for (let i = 3; i < 6; i++)
      render_card(SCREEN_CENTER_X - 70 + (i * 15), SCREEN_CENTER_Y - 70 + (i * 15), card_list[i]);
    push_textured_quad(TEXTURE_ROBED_MAN, SCREEN_CENTER_X - 110, SCREEN_CENTER_Y, { _scale: 5, _palette_offset: PALETTE_PLAYER });
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}