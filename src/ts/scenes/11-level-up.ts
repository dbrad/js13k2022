import { get_next_scene_id, Scene } from "@root/scene";
export namespace LevelUp
{
  let _reset_fn = () => { };
  let _update_fn = (now: number, delta: number) => { };
  let _render_fn = () => { };
  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _reset_fn, _update_fn, _render_fn };
}