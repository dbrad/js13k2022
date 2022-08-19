import { abgr_number_to_rgba_v4 } from "@graphics/colour";
import { push_textured_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { set_V2, set_V4, V4 } from "@math/vector";
import { Enemy, game_state, Summon } from "@root/game-state";
import { spirit_particle } from "@root/particle-definitions";
import { emit_particle } from "@root/particle-system";
import { render_percentage_bar } from "./percent-bar";

let enemy_type_sprite =
  [
    TEXTURE_SKELETON_0,
    TEXTURE_ZOMBIE_0,
    0,
    TEXTURE_BANDIT_0,
    TEXTURE_ROBED_MAN_0,
    TEXTURE_ROBED_MAN_0,
  ];

export let intent_type_sprite = [
  0,
  TEXTURE_SWORD,
  TEXTURE_SHEILD,
  TEXTURE_FIRE,
  TEXTURE_ICE,
  TEXTURE_HOLY,
  TEXTURE_SHADOW
];

export let intent_type_palette = [
  PALETTE_BANDIT + 2,
  0,
  0,
  PALETTE_FIRE,
  PALETTE_ICE,
  PALETTE_HOLY,
  PALETTE_SHADOW,
];

type EntityPaletteMap = [
  number[],
  number[],
  [V4, V4][],
  number[],
  number[],
  number[],
];

export let element_palette_map: EntityPaletteMap = [
  [PALETTE_SKELETON, PALETTE_FIRE, PALETTE_ICE, PALETTE_HOLY, PALETTE_SHADOW],
  [PALETTE_ZOMBIE, PALETTE_FIRE, PALETTE_ICE, PALETTE_HOLY, PALETTE_SHADOW],
  [[abgr_number_to_rgba_v4(0xFFFFFFFF), abgr_number_to_rgba_v4(0x40FFFFFF)], [abgr_number_to_rgba_v4(0xFF5196FF), abgr_number_to_rgba_v4(0x401A3CBC)], [abgr_number_to_rgba_v4(0xFFFCDBCB), abgr_number_to_rgba_v4(0x40C6B299)], [abgr_number_to_rgba_v4(0xFFD2FDFF), abgr_number_to_rgba_v4(0x4061BEFC)], [abgr_number_to_rgba_v4(0xFF3B3B46), abgr_number_to_rgba_v4(0x403232AC)]],
  [PALETTE_BANDIT],
  [PALETTE_MAGE, PALETTE_MAGE, PALETTE_MAGE, PALETTE_CLERIC, PALETTE_MAGE],
  [PALETTE_PLAYER],
];

export let unit_name_map = ["skeleton", "zombie", "spirit", "bandit", "mage", "lich"];
export let element_name_map = ["", "fire", "ice", "holy", "shadow"];

let enemy_name = (enemy_type: number, enemy_element: number) =>
{
  let element = element_name_map[enemy_element];
  if (element !== "")
    return element + "\n" + unit_name_map[enemy_type];
  return unit_name_map[enemy_type];
};

export let render_enemy = (enemy: Enemy, x: number, y: number) =>
{
  let enemy_type = enemy._type;
  let enemy_element = enemy._element;
  if (enemy_type === ENEMY_TYPE_SPIRIT)
  {
    let [begin, end] = element_palette_map[ENEMY_TYPE_SPIRIT][enemy_element];
    set_V2(spirit_particle._position, x + 16, y + 16);
    set_V4(spirit_particle._colour_begin, begin[0], begin[1], begin[2], begin[3]);
    set_V4(spirit_particle._colour_end, end[0], end[1], end[2], end[3]);
    emit_particle(spirit_particle);
  }
  else
  {
    let palette = element_palette_map[enemy_type][enemy_element] as number;
    push_textured_quad(enemy_type_sprite[enemy_type], x, y, { _scale: 2, _horizontal_flip: true, _palette_offset: palette, _animated: true });
  }

  render_percentage_bar(x - 8, y + 32, 48, 5, enemy._hp, enemy._max_hp, 0xFF0000FF);
  push_text(enemy_name(enemy_type, enemy_element), x + 16, y + 38, { _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER });

  let intent = enemy._current_intent;
  let intent_type = intent._type;
  let intent_value = intent._type;
  push_textured_quad(intent_type_sprite[intent_type], x + 16, y - 10, { _palette_offset: intent_type_palette[intent_type] });
  push_text(intent_value === 0 ? "" : intent_value + "", x + 8, y - 10);
};

export let render_summon = (summon: Summon, x: number, y: number) =>
{
  let summon_stats = game_state[GAMESTATE_PLAYER][PLAYER_SUMMON_LEVELS][summon[SUMMON_TYPE]];
  let summon_type = summon[SUMMON_TYPE];
  if (summon_type === SUMMON_TYPE_SPIRIT)
  {
    let [begin, end] = element_palette_map[SUMMON_TYPE_SPIRIT][0];
    set_V2(spirit_particle._position, x + 16, y + 16);
    set_V4(spirit_particle._colour_begin, begin[0], begin[1], begin[2], begin[3]);
    set_V4(spirit_particle._colour_end, end[0], end[1], end[2], end[3]);
    emit_particle(spirit_particle);
  }
  else
  {
    let palette = element_palette_map[summon_type][0] as number;
    push_textured_quad(enemy_type_sprite[summon_type], x, y, { _scale: 2, _palette_offset: palette, _animated: true });
  }

  render_percentage_bar(x - 8, y + 32, 48, 5, summon[SUMMON_HP], summon_stats[SUMMON_MAX_HP], 0xFF0000FF);
  push_text(enemy_name(summon_type, 0), x + 16, y + 38, { _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER });

  push_textured_quad(TEXTURE_SWORD, x + 16, y - 10);
  push_text(summon_stats[SUMMON_ATTACK] + "", x + 8, y - 10);
};