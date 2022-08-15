import { push_quad, push_textured_quad, TextureQuadParameters } from "@graphics/quad";
import { push_text, TextParameters } from "@graphics/text";
import { V2 } from "@math/vector";
import { canvas_reference, document_reference, request_fullscreen, SCREEN_HEIGHT, SCREEN_WIDTH, window_reference } from "@root/screen";
import { is_point_in_circle, is_point_in_rect, math } from "math";

let hardware_key_state: number[] = [
    KEY_IS_UP, // D_LEFT
    KEY_IS_UP, // D_UP
    KEY_IS_UP, // D_RIGHT
    KEY_IS_UP, // D_DOWN
    KEY_IS_UP, // A_BUTTON
    KEY_IS_UP, // B_BUTTON
];

export let key_state: number[] = [
    KEY_IS_UP, // D_LEFT
    KEY_IS_UP, // D_UP
    KEY_IS_UP, // D_RIGHT
    KEY_IS_UP, // D_DOWN
    KEY_IS_UP, // A_BUTTON
    KEY_IS_UP, // B_BUTTON
];

let key_map: Record<string, number> = {
    "ArrowLeft": D_LEFT,
    "ArrowUp": D_UP,
    "ArrowRight": D_RIGHT,
    "ArrowDown": D_DOWN,
    "KeyX": A_BUTTON,
    "KeyC": B_BUTTON,
};

let gamepad: Gamepad | null = null;

let is_touch: boolean = false;
let touches: V2[] = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];

export let is_touch_event = (e: Event | PointerEvent | TouchEvent): void =>
{
    is_touch = (e.type[0] === "t");
};

let set_touch_position = (e: TouchEvent): void =>
{
    if (!document_reference.fullscreenElement) request_fullscreen();

    let canvas_bounds = canvas_reference.getBoundingClientRect();
    is_touch_event(e);
    for (let i = 0; i < 7; i++)
    {
        let touch = e.touches[i];
        if (touch)
        {
            touches[i][0] = math.floor((touch.clientX - canvas_bounds.left) / (canvas_bounds.width / SCREEN_WIDTH));
            touches[i][1] = math.floor((touch.clientY - canvas_bounds.top) / (canvas_bounds.height / SCREEN_HEIGHT));
        }
        else
        {
            touches[i][0] = 0;
            touches[i][1] = 0;
        }
    }
    e.preventDefault();
};

let is_mapped_key = (key: number): key is number =>
{
    return (key !== undefined);
};

export let initialize_input = (): void =>
{
    document_reference.addEventListener("touchmove", set_touch_position);
    canvas_reference.addEventListener("touchstart", set_touch_position);
    canvas_reference.addEventListener("touchend", set_touch_position);
    document_reference.addEventListener("keydown", (e: KeyboardEvent) =>
    {
        let key = key_map[e.code];
        if (is_mapped_key(key))
        {
            e.preventDefault();
            hardware_key_state[key] = KEY_IS_DOWN;
        }
    });
    document_reference.addEventListener("keyup", (e: KeyboardEvent) =>
    {
        let key = key_map[e.code];
        if (is_mapped_key(key))
        {
            e.preventDefault();
            hardware_key_state[key] = KEY_IS_UP;
        }
    });
    window_reference.addEventListener("gamepadconnected", () =>
    {
        gamepad = navigator.getGamepads()[0];
    });
    window_reference.addEventListener("gamepaddisconnected", () =>
    {
        gamepad = null;
    });
};

let dpad_scale = 7;
let dpad_size = 16 * dpad_scale;
let dpad_touch_center = math.floor(dpad_size / 3);
let [dpad_x, dpad_y] = [20, SCREEN_HEIGHT - dpad_size - 80];

let button_scale = 3;
let button_size = 16 * button_scale;
let half_button_size = button_size / 2;
let button_options: TextureQuadParameters = { _scale: button_scale, _colour: 0x993C3C3C };
let button_text_options: TextParameters = { _scale: 3, _colour: 0X99A0A0A0, _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER };

let [a_button_x, a_button_y] = [SCREEN_WIDTH - button_size - 80, SCREEN_HEIGHT - button_size - 100];
let [b_button_x, b_button_y] = [SCREEN_WIDTH - button_size - 20, SCREEN_HEIGHT - button_size - 120];

export let update_hardware_input = (): void =>
{
    if (gamepad || is_touch)
    {
        hardware_key_state[A_BUTTON] = KEY_IS_UP;
        hardware_key_state[B_BUTTON] = KEY_IS_UP;
        hardware_key_state[D_UP] = KEY_IS_UP;
        hardware_key_state[D_DOWN] = KEY_IS_UP;
        hardware_key_state[D_LEFT] = KEY_IS_UP;
        hardware_key_state[D_RIGHT] = KEY_IS_UP;
    }
    if (is_touch)
    {
        for (let i = 0; i < 7; i++)
        {
            let [x, y] = touches[i];

            // D-pad Checks
            if (is_point_in_rect([x, y], [dpad_x, dpad_y, dpad_size, dpad_touch_center]))
                hardware_key_state[D_UP] = KEY_IS_DOWN;

            if (is_point_in_rect([x, y], [dpad_x, dpad_y + dpad_touch_center * 2, dpad_size, dpad_touch_center]))
                hardware_key_state[D_DOWN] = KEY_IS_DOWN;

            if (is_point_in_rect([x, y], [dpad_x, dpad_y, dpad_touch_center, dpad_size]))
                hardware_key_state[D_LEFT] = KEY_IS_DOWN;

            if (is_point_in_rect([x, y], [dpad_x + dpad_touch_center * 2, dpad_y, dpad_touch_center, dpad_size]))
                hardware_key_state[D_RIGHT] = KEY_IS_DOWN;

            // Button Checks
            if (is_point_in_circle([x, y], [a_button_x + half_button_size, a_button_y + half_button_size], half_button_size))
                hardware_key_state[A_BUTTON] = KEY_IS_DOWN;

            if (is_point_in_circle([x, y], [b_button_x + half_button_size, b_button_y + half_button_size], half_button_size))
                hardware_key_state[B_BUTTON] = KEY_IS_DOWN;
        }
    }
    if (gamepad)
    {
        let buttons = gamepad.buttons;
        let axes = gamepad.axes;

        if (buttons[12].pressed || axes[1] < -0.1)
            hardware_key_state[D_UP] = KEY_IS_DOWN;

        if (buttons[13].pressed || axes[1] > 0.1)
            hardware_key_state[D_DOWN] = KEY_IS_DOWN;

        if (buttons[14].pressed || axes[0] > 0.1)
            hardware_key_state[D_LEFT] = KEY_IS_DOWN;

        if (buttons[15].pressed || axes[0] < -0.1)
            hardware_key_state[D_RIGHT] = KEY_IS_DOWN;

        if (buttons[0].pressed)
            hardware_key_state[A_BUTTON] = KEY_IS_DOWN;

        if (buttons[1].pressed)
            hardware_key_state[B_BUTTON] = KEY_IS_DOWN;
    }
};

export let update_input_system = (now: number, delta: number): void =>
{
    for (let key = 0; key <= 5; key++) 
    {
        let hardware_key_value = hardware_key_state[key];
        if (hardware_key_value === KEY_IS_DOWN)
        {
            key_state[key] = KEY_IS_DOWN;

            if (interval_durations[key] > 0)
            {
                interval_timers[key] += delta;
                if (interval_timers[key] >= interval_durations[key])
                {
                    interval_timers[key] = 0;
                    key_state[key] = KEY_WAS_DOWN;
                }
            }
        }
        else
        {
            interval_timers[key] = 0;
            if (key_state[key] === KEY_IS_DOWN)
                key_state[key] = KEY_WAS_DOWN;
            else if (key_state[key] === KEY_WAS_DOWN)
                key_state[key] = KEY_IS_UP;
        }
    }
};

let get_button_colour = (key: number): number => key_state[key] === KEY_IS_UP ? 0x993C3C3C : 0x99666666;
export let render_controls = (): void =>
{
    if (is_touch)
    {
        push_textured_quad(TEXTURE_D_PAD, dpad_x, dpad_y, { _scale: dpad_scale, _colour: 0x99FFFFFF });

        if (key_state[D_UP] !== KEY_IS_UP)
            push_quad(dpad_x, dpad_y, dpad_size, dpad_touch_center, 0x55FFFFFF);

        if (key_state[D_DOWN] !== KEY_IS_UP)
            push_quad(dpad_x, dpad_y + dpad_touch_center * 2, dpad_size, dpad_touch_center, 0x55FFFFFF);

        if (key_state[D_LEFT] !== KEY_IS_UP)
            push_quad(dpad_x, dpad_y, dpad_touch_center, dpad_size, 0x55FFFFFF);

        if (key_state[D_RIGHT] !== KEY_IS_UP)
            push_quad(dpad_x + dpad_touch_center * 2, dpad_y, dpad_touch_center, dpad_size, 0x55FFFFFF);

        push_textured_quad(TEXTURE_WHITE_CIRCLE, b_button_x, b_button_y, { ...button_options, _colour: get_button_colour(B_BUTTON) });
        push_text("B", b_button_x + half_button_size, b_button_y + half_button_size - 7, button_text_options);

        push_textured_quad(TEXTURE_WHITE_CIRCLE, a_button_x, a_button_y, { ...button_options, _colour: get_button_colour(A_BUTTON) });
        push_text("A", a_button_x + half_button_size, a_button_y + half_button_size - 7, button_text_options);
    }
    else if (!gamepad)
    {
        push_text("Arrow Keys / X: Action / C: Cancel", SCREEN_WIDTH / 2, SCREEN_HEIGHT - 8, { _align: TEXT_ALIGN_CENTER, _font: FONT_SMALL, _colour: 0x66FFFFFF });
    }

    if (false)
    {
        push_text(`U: ${key_state[D_UP]}`, 0, 0, { _font: FONT_SMALL });
        push_text(`D: ${key_state[D_DOWN]}`, 0, 6, { _font: FONT_SMALL });
        push_text(`L: ${key_state[D_LEFT]}`, 0, 12, { _font: FONT_SMALL });
        push_text(`R: ${key_state[D_RIGHT]}`, 0, 18, { _font: FONT_SMALL });
        push_text(`A: ${key_state[A_BUTTON]}`, 0, 30, { _font: FONT_SMALL });
        push_text(`B: ${key_state[B_BUTTON]}`, 0, 36, { _font: FONT_SMALL });
    }
};

let interval_timers: number[] = [0, 0, 0, 0, 0, 0, 0];
let interval_durations: number[] = [0, 0, 0, 0, 0, 0, 0];

export let set_key_pulse_time = (keys: number[], interval_duration: number): void =>
{
    for (let key of keys)
    {
        interval_timers[key] = 0;
        interval_durations[key] = interval_duration;
    }
};

export let clear_input = (): void =>
{
    for (let key = 0; key <= 5; key++) 
    {
        interval_timers[key] = 0;
        interval_durations[key] = 0;
        hardware_key_state[key] = KEY_IS_UP;
        key_state[key] = KEY_IS_UP;
    }
};