import { abgr_number_to_rgba_v4 } from "@graphics/colour";
import { push_textured_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { set_V2, set_V4, V4 } from "@math/vector";
import { Enemy } from "@root/game-state";
import { spirit_particle } from "@root/particle-definitions";
import { emit_particle } from "@root/particle-system";
import { render_percentage_bar } from "./percent-bar";

export let unit_sprite = [
  TEXTURE_SKELETON,
  TEXTURE_ZOMBIE,
  0,
  TEXTURE_BANDIT,
  TEXTURE_ROBED_MAN,
];

export let unit_palette_map: number[] = [
  PALETTE_SKELETON,
  PALETTE_ZOMBIE,
  0,
  PALETTE_PLAYER,
  PALETTE_PLAYER,
];

let intent_type_sprite = [
  0,
  TEXTURE_SWORD,
  TEXTURE_SHEILD,
];

export let unit_name_map = ["skeleton", "zombie", "spirit", "cultist", "lich"];

export let render_enemy = (enemy: Enemy, x: number, y: number) =>
{
  let enemy_type = enemy._type;
  if (enemy_type === ENEMY_TYPE_SPIRIT)
    render_spirit(x + 16, y + 16);
  else
  {
    let palette = unit_palette_map[enemy_type] as number;
    push_textured_quad(unit_sprite[enemy_type], x, y, { _scale: 2, _horizontal_flip: true, _palette_offset: palette, _animated: true });
  }

  render_percentage_bar(x - 8, y + 32, 48, 5, enemy._hp, enemy._max_hp, 0xFF0000FF);
  push_text(unit_name_map[enemy_type], x + 16, y + 38, { _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER });

  let intent = enemy._current_intent;
  let intent_type = intent;
  if (intent_type !== ENEMY_INTENT_TYPE_NONE)
  {
    push_textured_quad(intent_type_sprite[intent_type], x + 16, y - 10, { _palette_offset: !intent_type ? 19 : 0 });
    push_text(enemy._attack === 0 ? "" : enemy._attack + "", x + 8, y - 10);
  }
};

let spirit_colours: [V4, V4] = [abgr_number_to_rgba_v4(0xFFFFFFFF), abgr_number_to_rgba_v4(0x40FFCCCC)];
export let render_spirit = (x: number, y: number, scale: number = 1) =>
{
  let [begin, end] = spirit_colours;
  spirit_particle._size_begin = 1 * scale;
  spirit_particle._size_end = 0.1 * scale;
  spirit_particle._size_variation = 0.5 * scale;
  set_V2(spirit_particle._velocity_variation, 30 * scale, 30 * scale);
  set_V2(spirit_particle._position, x, y);
  set_V4(spirit_particle._colour_begin, begin[0], begin[1], begin[2], begin[3]);
  set_V4(spirit_particle._colour_end, end[0], end[1], end[2], end[3]);
  emit_particle(spirit_particle);
};