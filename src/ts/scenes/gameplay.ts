import { get_next_scene_id, Scene } from "@root/scene";
export namespace Gameplay
{
  let _setup_fn = () => { };
  let _reset_fn = () => { };
  let _update_fn = (now: number, delta: number) => { };
  let _render_fn = () => { };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _setup_fn, _reset_fn, _update_fn, _render_fn };
}