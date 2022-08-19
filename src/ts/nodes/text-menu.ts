import { push_text } from "@graphics/text";
import { V2 } from "@math/vector";
import { fire_particle } from "@root/particle-definitions";
import { emit_particles } from "@root/particle-system";

export let render_text_menu = (position: V2, menu_options: string[], number_of_options: number, selected_option_index: number, scale: number = 2) =>
{
  let selected_text = menu_options[selected_option_index];
  let selected_text_length = selected_text.length * (8 * scale) / 2;

  fire_particle._size_begin = 20 * scale / 100;
  fire_particle._size_variation = 30 * scale / 100;
  fire_particle._lifetime = 250 * scale;
  fire_particle._position[1] = position[1] + (4 * scale) + (14 * scale) * selected_option_index;

  fire_particle._position[0] = position[0] - selected_text_length - (4 * scale);
  emit_particles(fire_particle, 2);

  fire_particle._position[0] = position[0] + selected_text_length + (3 * scale);
  emit_particles(fire_particle, 2);

  for (let option_index = 0; option_index < number_of_options; option_index++)
    push_text(menu_options[option_index], position[0], position[1] + (14 * scale) * option_index, { _align: TEXT_ALIGN_CENTER, _scale: scale });
};