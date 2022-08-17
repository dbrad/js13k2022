import { rgba_to_abgr_number } from "@graphics/colour";
import { add_interpolator, get_interpolation_data, has_interpolation_data } from "@root/interpolate";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@root/screen";

import { assert } from "@debug/assert";
import { push_quad } from "@graphics/quad";
import { clear_input, update_input_system } from "@input/controls";
import { save_game } from "@root/game-state";
import { clear_particle_system, render_particle_system, update_particle_system } from "./particle-system";

export type Scene = {
    _scene_id: number;
    _reset_fn: () => void;
    _update_fn: (now: number, delta: number) => void;
    _render_fn: () => void;
};

let transition_colour = 0;

let scenes: Map<number, Scene> = new Map();
let scene_stack: Scene[] = [];
let current_scene: Scene;

let next_scene_id = 0;
export let get_next_scene_id = (): number => next_scene_id++;

export let register_scene = (scene: Scene): void =>
{
    scenes.set(scene._scene_id, scene);

    if (!current_scene)
    {
        current_scene = scene;
        scene_stack = [scene];
        current_scene._reset_fn();
    }
};

export let switch_to_scene = (sceneId: number): void =>
{
    clear_input();

    add_interpolator(INTERP_SCENE_TRANSITION, 250, [0], [1], () =>
    {
        let scene = scenes.get(sceneId);
        assert(scene !== undefined, `Unable to find scene #"${sceneId}"`);
        current_scene = scene;
        scene_stack = [scene];
        current_scene._reset_fn();
        clear_particle_system();
        add_interpolator(INTERP_SCENE_TRANSITION, 250, [1], [0]);
    });
    save_game();
};

export let push_scene = (sceneId: number): void =>
{
    clear_input();

    let scene = scenes.get(sceneId);
    assert(scene !== undefined, `Unable to find scene #"${sceneId}"`);
    scene_stack.push(scene);
    current_scene = scene;
    current_scene._reset_fn();
    save_game();
};

export let pop_scene = (): void =>
{
    clear_input();

    let old_scene = scene_stack[scene_stack.length - 1];
    scene_stack.pop();
    assert(old_scene !== undefined, `Unable to find scene #"${next_scene_id}"`);
    current_scene = scene_stack[scene_stack.length - 1];
    current_scene._reset_fn();
    save_game();
};

export let update_scene = (now: number, delta: number): void =>
{
    if (!has_interpolation_data(INTERP_SCENE_TRANSITION))
        update_input_system(now, delta);

    current_scene._update_fn(now, delta);
    update_particle_system(now, delta);
};

export let render_scene = (): void =>
{
    for (let i = 0, len = scene_stack.length; i < len; ++i)
        scene_stack[i]._render_fn();

    render_particle_system();

    let scene_transition = get_interpolation_data(INTERP_SCENE_TRANSITION);
    if (scene_transition)
    {
        if (scene_transition?._values)
        {
            let values = scene_transition._values;
            let colour = rgba_to_abgr_number(0, 0, 0, values[0]);
            transition_colour = colour;
        }
        push_quad(0, 0, SCREEN_WIDTH + 2, SCREEN_HEIGHT + 2, transition_colour);
    }
};