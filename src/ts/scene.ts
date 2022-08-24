import { rgba_to_abgr_number } from "@graphics/colour";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@root/screen";

import { assert } from "@debug/assert";
import { push_quad } from "@graphics/quad";
import { clear_input, update_input_system } from "@input/controls";
import { save_game } from "./game-state";
import { lerp } from "./interpolate";
import { clear_particle_system, render_particle_system, update_particle_system } from "./particle-system";

export type Scene = {
    _scene_id: number;
    _reset_fn: () => void;
    _update_fn: (now: number, delta: number) => void;
    _render_fn: () => void;
};

const transition_time = 250;
let transition_alpha = 0;
let transition_time_remaining = 0;
let target_alpha = 0;
let scene_transitioning = false;

let target_scene = 0;

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

    transition_time_remaining = transition_time;
    scene_transitioning = true;
    target_alpha = 1;
    target_scene = sceneId;
};

export let push_scene = (sceneId: number): void =>
{
    clear_input();

    let scene = scenes.get(sceneId);
    assert(scene !== undefined, `Unable to find scene #"${sceneId}"`);
    scene_stack.push(scene);
    current_scene = scene;
    current_scene._reset_fn();
};

export let pop_scene = (): void =>
{
    clear_input();

    let old_scene = scene_stack[scene_stack.length - 1];
    scene_stack.pop();
    assert(old_scene !== undefined, `Unable to find scene #"${next_scene_id}"`);
    current_scene = scene_stack[scene_stack.length - 1];
};

export let update_scene = (now: number, delta: number): void =>
{
    if (!scene_transitioning)
        update_input_system(now, delta);
    else
        transition_time_remaining -= delta;

    if (scene_transitioning && target_alpha)
    {
        transition_alpha = lerp(target_alpha, 0, transition_time_remaining / transition_time);
        if (transition_time_remaining <= 0)
        {
            target_alpha = 0;
            transition_time_remaining = transition_time;

            let scene = scenes.get(target_scene);
            assert(scene !== undefined, `Unable to find scene #"${target_scene}"`);
            current_scene = scene;
            scene_stack = [scene];
            current_scene._reset_fn();
            clear_particle_system();
            save_game();
        }
    }
    else if (scene_transitioning && !target_alpha)
    {
        transition_alpha = lerp(target_alpha, 1, transition_time_remaining / transition_time);
        if (transition_time_remaining <= 0)
            scene_transitioning = false;
    }

    current_scene._update_fn(now, delta);
    update_particle_system(now, delta);
};

export let render_scene = (): void =>
{
    for (let i = 0, len = scene_stack.length; i < len; ++i)
        scene_stack[i]._render_fn();

    render_particle_system();

    if (scene_transitioning)
        push_quad(0, 0, SCREEN_WIDTH + 2, SCREEN_HEIGHT + 2, rgba_to_abgr_number(0, 0, 0, transition_alpha));
};