import { push_quad, push_textured_quad, TextureQuadParameters } from "@graphics/quad";
import { push_text, TextParameters } from "@graphics/text";
import { canvas_reference, document_reference, request_fullscreen, SCREEN_HEIGHT, SCREEN_WIDTH, window_reference } from "@root/screen";
import { unpack_number_array_from_string } from "@root/util";
import { boop, boop_good, zzfx_play } from "@root/zzfx";
import { floor, is_point_in_circle, is_point_in_rect } from "math";

let hardware_key_state = unpack_number_array_from_string("000000");
let key_state = unpack_number_array_from_string("000000");
let controls_enabled = unpack_number_array_from_string("000000");

export let controls_used = (...keys: number[]) =>
{
    for (let key = 0; key < 6; key++)
        controls_enabled[key] = 0;

    for (let key of keys)
        controls_enabled[key] = 1;
};

export let UP_PRESSED: boolean = false;
export let DOWN_PRESSED: boolean = false;
export let LEFT_PRESSED: boolean = false;
export let RIGHT_PRESSED: boolean = false;
export let A_PRESSED: boolean = false;
export let B_PRESSED: boolean = false;

let key_map: Record<string, number> = {
    "ArrowLeft": D_LEFT,
    "ArrowUp": D_UP,
    "ArrowRight": D_RIGHT,
    "ArrowDown": D_DOWN,
    "KeyX": A_BUTTON,
    "KeyC": B_BUTTON,
};

let gamepad: Gamepad | null = null;

export let is_touch: boolean = false;
let touches = "00|00|00|00|00|00".split("|").map(a => unpack_number_array_from_string(a));

export let is_touch_event = (e: Event | PointerEvent | TouchEvent): void =>
{
    is_touch = (e.type[0] === "t");
};

let set_touch_position = (e: TouchEvent): void =>
{
    if (!document_reference.fullscreenElement) request_fullscreen();

    let canvas_bounds = canvas_reference.getBoundingClientRect();
    is_touch_event(e);
    for (let i = 0; i < 6; i++)
    {
        let touch = e.touches[i];
        if (touch)
        {
            touches[i][0] = floor((touch.clientX - canvas_bounds.left) / (canvas_bounds.width / SCREEN_WIDTH));
            touches[i][1] = floor((touch.clientY - canvas_bounds.top) / (canvas_bounds.height / SCREEN_HEIGHT));
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
let dpad_touch_center = floor(dpad_size / 3);
let [dpad_x, dpad_y] = [20, SCREEN_HEIGHT - dpad_size - 100];

let button_scale = 3;
let button_size = 16 * button_scale;
let half_button_size = button_size / 2;
let button_options: TextureQuadParameters = { _scale: button_scale, _colour: 0x993c3c3c };
let button_text_options: TextParameters = { _scale: 3, _colour: 0x99a0a0a0, _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER };

let [a_button_x, a_button_y] = [SCREEN_WIDTH - button_size - 80, SCREEN_HEIGHT - button_size - 120];
let [b_button_x, b_button_y] = [SCREEN_WIDTH - button_size - 20, SCREEN_HEIGHT - button_size - 140];

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
            if (is_point_in_rect(x, y, dpad_x, dpad_y, dpad_size, dpad_touch_center))
                hardware_key_state[D_UP] = KEY_IS_DOWN;

            if (is_point_in_rect(x, y, dpad_x, dpad_y + dpad_touch_center * 2, dpad_size, dpad_touch_center))
                hardware_key_state[D_DOWN] = KEY_IS_DOWN;

            if (is_point_in_rect(x, y, dpad_x, dpad_y, dpad_touch_center, dpad_size))
                hardware_key_state[D_LEFT] = KEY_IS_DOWN;

            if (is_point_in_rect(x, y, dpad_x + dpad_touch_center * 2, dpad_y, dpad_touch_center, dpad_size))
                hardware_key_state[D_RIGHT] = KEY_IS_DOWN;

            // Button Checks
            if (is_point_in_circle(x, y, a_button_x + half_button_size, a_button_y + half_button_size, half_button_size))
                hardware_key_state[A_BUTTON] = KEY_IS_DOWN;

            if (is_point_in_circle(x, y, b_button_x + half_button_size, b_button_y + half_button_size, half_button_size))
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

export let update_input_system = (delta: number): void =>
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
    UP_PRESSED = key_state[D_UP] === KEY_WAS_DOWN;
    DOWN_PRESSED = key_state[D_DOWN] === KEY_WAS_DOWN;
    LEFT_PRESSED = key_state[D_LEFT] === KEY_WAS_DOWN;
    RIGHT_PRESSED = key_state[D_RIGHT] === KEY_WAS_DOWN;
    A_PRESSED = key_state[A_BUTTON] === KEY_WAS_DOWN;
    B_PRESSED = key_state[B_BUTTON] === KEY_WAS_DOWN;

    if (UP_PRESSED && controls_enabled[D_UP])
        zzfx_play(boop);
    if (DOWN_PRESSED && controls_enabled[D_DOWN])
        zzfx_play(boop);
    if (LEFT_PRESSED && controls_enabled[D_LEFT])
        zzfx_play(boop);
    if (RIGHT_PRESSED && controls_enabled[D_RIGHT])
        zzfx_play(boop);
    if (A_PRESSED && controls_enabled[A_BUTTON])
        zzfx_play(boop_good);
    if (B_PRESSED && controls_enabled[B_BUTTON])
        zzfx_play(boop_good);
};

let TRANSPARENT_WHITE = 0x55ffffff;
let get_button_colour = (key: number): number => key_state[key] === KEY_IS_UP ? 0x993c3c3c : 0x99666666;
export let render_controls = (): void =>
{
    let help_text = "";
    if (is_touch)
    {
        push_textured_quad(TEXTURE_D_PAD, dpad_x, dpad_y, { _scale: dpad_scale, _colour: TRANSPARENT_WHITE });

        if (key_state[D_UP] !== KEY_IS_UP)
            push_quad(dpad_x, dpad_y, dpad_size, dpad_touch_center, TRANSPARENT_WHITE);

        if (key_state[D_DOWN] !== KEY_IS_UP)
            push_quad(dpad_x, dpad_y + dpad_touch_center * 2, dpad_size, dpad_touch_center, TRANSPARENT_WHITE);

        if (key_state[D_LEFT] !== KEY_IS_UP)
            push_quad(dpad_x, dpad_y, dpad_touch_center, dpad_size, TRANSPARENT_WHITE);

        if (key_state[D_RIGHT] !== KEY_IS_UP)
            push_quad(dpad_x + dpad_touch_center * 2, dpad_y, dpad_touch_center, dpad_size, TRANSPARENT_WHITE);

        push_textured_quad(TEXTURE_WHITE_CIRCLE, b_button_x, b_button_y, { ...button_options, _colour: get_button_colour(B_BUTTON) });
        push_text("b", b_button_x + half_button_size, b_button_y + half_button_size - 7, button_text_options);

        push_textured_quad(TEXTURE_WHITE_CIRCLE, a_button_x, a_button_y, { ...button_options, _colour: get_button_colour(A_BUTTON) });
        push_text("a", a_button_x + half_button_size, a_button_y + half_button_size - 7, button_text_options);
    }
    if (!gamepad && !is_touch)
        help_text = "arrow keys / x. action / c. cancel";
    else
        help_text = "dpad / a. action / b. cancel";

    push_text(help_text, SCREEN_WIDTH / 2, SCREEN_HEIGHT - 8, { _align: TEXT_ALIGN_CENTER, _font: FONT_SMALL, _colour: 0x66ffffff });

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

let interval_timers: number[] = unpack_number_array_from_string("000000");
let interval_durations: number[] = unpack_number_array_from_string("000000");

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
    UP_PRESSED = false;
    DOWN_PRESSED = false;
    LEFT_PRESSED = false;
    RIGHT_PRESSED = false;
    A_PRESSED = false;
    B_PRESSED = false;
};