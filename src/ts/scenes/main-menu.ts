import { push_text } from "@graphics/text";
import { key_state, set_key_pulse_time } from "@input/controls";
import { emit_particles, ParticleParameters } from "@root/particle-system";
import { get_next_scene_id, push_scene, Scene } from "@root/scene";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y, SCREEN_HEIGHT } from "@root/screen";
import { math } from "math";
import { Dialog } from "./dialog";

export namespace MainMenu
{
  let fire_particle: ParticleParameters = {
    _position: [0, 0],
    _velocity: [0, -45],
    _velocity_variation: [24, 40],
    _size_begin: 0.55,
    _size_end: 0,
    _size_variation: 0.5,
    _colour_begin: [255, 0, 0, 1],
    _colour_end: [244, 180, 27, 0.25],
    _lifetime: 500
  };

  let splode_particle: ParticleParameters = {
    _position: [0, 0],
    _velocity: [0, 0],
    _velocity_variation: [45, 40],
    _size_begin: 0.55,
    _size_end: 0,
    _size_variation: 0.25,
    _colour_begin: [0, 0, 0, 1],
    _colour_end: [200, 200, 200, 0.25],
    _lifetime: 1000
  };

  let selected_option_index = 0;
  let number_of_options = 3;

  let menu_options = [
    "continue",
    "new game",
    "options"
  ];

  let splode = () =>
  {
    splode_particle._position[1] = SCREEN_CENTER_Y + 15 + 45 * selected_option_index;
    splode_particle._position[0] = SCREEN_CENTER_X - 110;
    emit_particles(splode_particle, 25);

    splode_particle._position[0] = SCREEN_CENTER_X + 105;
    emit_particles(splode_particle, 25);
  };
  let _setup_fn = () => { };
  let _reset_fn = () =>
  {
    set_key_pulse_time([D_UP, D_DOWN], 250);
  };

  let timer_end = Date.parse('13 Sep 2022 07:00:00 EST') / 1000;
  let remaining_seconds: number;
  let _update_fn = (now: number, delta: number) =>
  {
    if (DEBUG)
    {
      remaining_seconds = timer_end - Date.now() / 1000;
    }

    fire_particle._position[1] = SCREEN_CENTER_Y + 15 + 45 * selected_option_index;

    fire_particle._position[0] = SCREEN_CENTER_X - 110;
    fire_particle._colour_begin = [255, 0, 0, 1];
    fire_particle._colour_end = [244, 180, 27, 0.25];
    emit_particles(fire_particle, 5);

    fire_particle._position[0] = SCREEN_CENTER_X + 105;
    fire_particle._colour_begin = [200, 200, 255, 1];
    fire_particle._colour_end = [0, 0, 200, 0.25];
    emit_particles(fire_particle, 5);

    if (key_state.get(D_UP) === KEY_WAS_DOWN)
    {
      splode();
      selected_option_index = math.max(0, selected_option_index - 1);
    }
    else if (key_state.get(D_DOWN) === KEY_WAS_DOWN)
    {
      splode();
      selected_option_index = math.min(number_of_options - 1, selected_option_index + 1);
    }
    else if (key_state.get(A_BUTTON) === KEY_WAS_DOWN)
    {
      Dialog.push_dialog_text("Lorem Ipsum is simply dummy text of the printing and typesetting industry.");
      push_scene(Dialog._scene_id);
    }
  };

  let _render_fn = () =>
  {
    if (DEBUG)
    {
      let days = (Math.floor(remaining_seconds / 86400) + "").padStart(2, "0");
      let hours = (Math.floor((remaining_seconds % 86400) / 3600) + "").padStart(2, "0");
      let minutes = (Math.floor((remaining_seconds % 86400) % 3600 / 60) + "").padStart(2, "0");
      let seconds = (Math.floor(remaining_seconds % 60) + "").padStart(2, "0");

      push_text(`Submission Deadline: ${days}:${hours}:${minutes}:${seconds}`, SCREEN_CENTER_X, SCREEN_HEIGHT - 40, { _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER });
    }

    push_text("js13k 2022", SCREEN_CENTER_X, SCREEN_CENTER_Y - 100, { _align: TEXT_ALIGN_CENTER, _scale: 4 });
    push_text("great things in small packages", SCREEN_CENTER_X, SCREEN_CENTER_Y - 60, { _align: TEXT_ALIGN_CENTER, _font: FONT_SMALL });
    for (let option_index = 0; option_index < number_of_options; option_index++)
    {
      let text = option_index === selected_option_index ? menu_options[option_index].toUpperCase() : menu_options[option_index];
      push_text(text, SCREEN_CENTER_X, SCREEN_CENTER_Y + 45 * option_index, { _align: TEXT_ALIGN_CENTER, _scale: 3 });
    }
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _setup_fn, _reset_fn, _update_fn, _render_fn };
}