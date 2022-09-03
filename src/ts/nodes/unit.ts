import { abgr_number_to_rgba_v4, GREEN, RED, WHITE } from "@graphics/colour";
import { push_textured_quad } from "@graphics/quad";
import { push_text, SMALL_FONT_AND_CENTERED_TEXT } from "@graphics/text";
import { set_V2, set_V4, V4 } from "@math/vector";
import { Enemy } from "@root/game-state";
import { spirit_particle } from "@root/particle-definitions";
import { emit_particle } from "@root/particle-system";
import { unpack_number_array_from_string } from "@root/util";
import { ceil } from "math";
import { render_percentage_bar } from "./percent-bar";

export let unit_sprite = unpack_number_array_from_string("34021");

export let unit_palette_map: number[] = [
  PALETTE_SKELETON,
  PALETTE_ZOMBIE,
  0,
  PALETTE_ENEMY,
  PALETTE_ENEMY,
];

let intent_type_sprite = unpack_number_array_from_string("05589");

let intent_palette = [
  29,
  0,
  0,
  20,
  20
];


export let unit_name_map = ["skeleton", "zombie", "spirit", "cultist", "lich"];

export let render_enemy = (enemy: Enemy, x: number, y: number) =>
{
  let attack = calculate_attack(enemy);
  let enemy_type = enemy._type;
  if (enemy_type === ENEMY_TYPE_SPIRIT)
    render_spirit(x + 16, y + 16);
  else
    push_textured_quad(unit_sprite[enemy_type], x, y, { _scale: 2, _horizontal_flip: true, _palette_offset: unit_palette_map[enemy_type], _animated: true });

  render_percentage_bar(x - 8, y + 32, 48, 5, enemy._hp, enemy._max_hp, RED);
  push_text(unit_name_map[enemy_type], x + 16, y + 38, { _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER });

  if (enemy._attack_debuff_turns > 0)
    push_text("weaken (" + enemy._attack_debuff_turns + " turns)", x + 24, y - 18, SMALL_FONT_AND_CENTERED_TEXT);

  let intent = enemy._current_intent;
  let intent_type = intent;
  if (intent_type !== ENEMY_INTENT_TYPE_NONE)
  {
    push_textured_quad(intent_type_sprite[intent_type], x + 16, y - 10, { _palette_offset: intent_palette[intent_type] });

    if (intent_type === ENEMY_INTENT_TYPE_ATTACK_HEAL)
      push_textured_quad(TEXTURE_CROSS, x + 24, y - 10, { _palette_offset: PALETTE_PLAYER - 1 });

    if (intent_type === ENEMY_INTENT_TYPE_ATTACK || intent_type === ENEMY_INTENT_TYPE_ATTACK_HEAL)
      push_text(attack, x + 8, y - 10, { _colour: attack > enemy._attack ? GREEN : attack < enemy._attack ? RED : WHITE });
    else if (intent_type === ENEMY_INTENT_TYPE_HEAL)
      push_text(ceil(enemy._attack / 2), x + 8, y - 10);
    else if (intent_type === ENEMY_INTENT_TYPE_BUFF)
      push_textured_quad(TEXTURE_SWORD, x + 8, y - 10);
  }
};

let spirit_colours: [V4, V4] = [abgr_number_to_rgba_v4(0x22ffffff), abgr_number_to_rgba_v4(0x11ffcccc)];
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

export let calculate_attack = (enemy: Enemy): number => enemy._attack - (enemy._attack_debuff_turns > 0 ? 1 : 0) + enemy._attack_buff;