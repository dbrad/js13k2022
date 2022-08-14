import { push_text } from "@graphics/text";
import { get_next_scene_id, Scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "@root/screen";
export namespace Inventory
{
  let _setup_fn = () => { };
  let _reset_fn = () => { };
  let _update_fn = (now: number, delta: number) => { };
  let _render_fn = () =>
  {
    push_text("Inventory", SCREEN_CENTER_X, SCREEN_CENTER_Y);
  };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _setup_fn, _reset_fn, _update_fn, _render_fn };
}