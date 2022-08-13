import { initialize_fps_meter, performance_mark, tick_fps_meter } from "@debug/fps-meter";
import { push_text } from "@graphics/text";
import { load_options } from "@root/game-state";
import { initialize_input, input_context, is_touch, render_mobile_controls, update_hardware_input } from "@root/input/controls";
import { initialze_interpolation_system, update_interpolation_system } from "@root/interpolate";
import { initialize_particle_system, render_particle_system, update_particle_system } from "@root/particle-system";
import { register_scene, render_scene, update_scene } from "@root/scene";
import { canvas_reference, initialize_page, SCREEN_CENTER_X, SCREEN_CENTER_Y, window_reference } from "@root/screen";
import { zzfx_init } from "@root/zzfx";
import { Dialog } from "@scenes/dialog";
import { MainMenu } from "@scenes/main-menu";
import { gl_clear, gl_flush, gl_get_context, gl_init, gl_set_clear_colour } from "gl";
import { load_palette, load_textures } from "texture";

window_reference.addEventListener('load', async () =>
{
  initialize_fps_meter();
  initialize_page();

  let webgl_context = gl_get_context(canvas_reference);
  gl_init(webgl_context);

  await load_palette();
  await load_textures();

  let playing = false;
  let initialize_game = (e: PointerEvent | TouchEvent) =>
  {
    input_context._is_touch = is_touch(e);

    setTimeout(() =>
    {
      if (!playing)
      {
        canvas_reference.removeEventListener("pointerdown", initialize_game);
        canvas_reference.removeEventListener("touchstart", initialize_game);
        playing = true;
        initialize_input();
        initialze_interpolation_system();
        initialize_particle_system(10000);

        register_scene(MainMenu._scene);
        register_scene(Dialog._scene);

        zzfx_init();
        load_options();
      }
    }, 0);
  };

  canvas_reference.addEventListener("touchstart", initialize_game);
  canvas_reference.addEventListener("pointerdown", initialize_game);

  let colour_bit = true;
  let time_step = 16.5;
  let then: number;
  let elasped_time: number = 0;
  let loop = (now: number): void =>
  {
    requestAnimationFrame(loop);

    performance_mark("start_of_frame");
    gl_clear();

    let delta = now - then;
    if (delta > 1000)
      delta = time_step;

    elasped_time += delta;
    then = now;

    if (playing)
    {
      performance_mark("update_start");
      update_hardware_input();
      while (elasped_time >= time_step)
      {
        update_interpolation_system(now, time_step);
        update_scene(now, time_step);
        update_particle_system(now, time_step);
        elasped_time -= time_step;
      }
      performance_mark("update_end");

      performance_mark("render_start");
      render_scene();
      render_particle_system();
      render_mobile_controls();
      gl_flush();
      performance_mark("render_end");

      tick_fps_meter(now, delta);
    }
    else
    {
      if (elasped_time >= 1000)
      {
        colour_bit = !colour_bit;
        elasped_time = 0;
      }
      push_text("touch to play", SCREEN_CENTER_X, SCREEN_CENTER_Y, { _align: TEXT_ALIGN_CENTER, _colour: colour_bit ? 0xFFFFFFFF : 0xFF000000 });
      gl_flush();
    }
  };

  gl_set_clear_colour(0, 0, 0);
  then = performance.now();
  requestAnimationFrame(loop);
});