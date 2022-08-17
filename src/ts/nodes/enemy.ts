import { abgr_number_to_rgba_v4 } from "@graphics/colour";
import { push_textured_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { set_V2, set_V4, V4 } from "@math/vector";
import { Enemy } from "@root/game-state";
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

let intent_type_sprite = [
  0,
  TEXTURE_SWORD,
  TEXTURE_SHEILD,
  TEXTURE_FIRE,
  TEXTURE_ICE,
  TEXTURE_HOLY,
  TEXTURE_SHADOW
];

type EnemyPaletteMap = [
  number[],
  number[],
  [V4, V4][],
  number[],
  number[],
  number[],
];

let element_palette_map: EnemyPaletteMap = [
  [PALETTE_SKELETON, PALETTE_FIRE, PALETTE_ICE, PALETTE_HOLY, PALETTE_SHADOW],
  [PALETTE_ZOMBIE, PALETTE_FIRE, PALETTE_ICE, PALETTE_HOLY, PALETTE_SHADOW],
  [[abgr_number_to_rgba_v4(0xFFFFFFFF), abgr_number_to_rgba_v4(0x40FFFFFF)], [abgr_number_to_rgba_v4(0xFF5196FF), abgr_number_to_rgba_v4(0x401A3CBC)], [abgr_number_to_rgba_v4(0xFFFCDBCB), abgr_number_to_rgba_v4(0x40C6B299)], [abgr_number_to_rgba_v4(0xFFD2FDFF), abgr_number_to_rgba_v4(0x4061BEFC)], [abgr_number_to_rgba_v4(0xFF3B3B46), abgr_number_to_rgba_v4(0x403232AC)]],
  [PALETTE_BANDIT],
  [PALETTE_MAGE, PALETTE_MAGE, PALETTE_MAGE, PALETTE_CLERIC, PALETTE_MAGE],
  [PALETTE_PLAYER],
];

let enemy_name_map = ["skeleton", "zombie", "spirit", "bandit", "mage", "lich"];
let enemy_element_map = ["", "fire", "ice", "holy", "shadow"];

let enemy_name = (enemy_type: number, enemy_element: number) =>
{
  let element = enemy_element_map[enemy_element];
  if (element !== "")
    return element + "\n" + enemy_name_map[enemy_type];
  return enemy_name_map[enemy_type];
};

export let render_enemy = (enemy: Enemy, x: number, y: number) =>
{
  if (enemy[ENEMY_TYPE] === ENEMY_TYPE_SPIRIT)
  {
    let [begin, end] = element_palette_map[ENEMY_TYPE_SPIRIT][enemy[ENEMY_ELEMENT]];
    set_V2(spirit_particle._position, x + 16, y + 16);
    set_V4(spirit_particle._colour_begin, begin[0], begin[1], begin[2], begin[3]);
    set_V4(spirit_particle._colour_end, end[0], end[1], end[2], end[3]);
    emit_particle(spirit_particle);
  }
  else
  {
    let palette = element_palette_map[enemy[ENEMY_TYPE]][enemy[ENEMY_ELEMENT]] as number;
    push_textured_quad(enemy_type_sprite[enemy[ENEMY_TYPE]], x, y, { _scale: 2, _horizontal_flip: true, _palette_offset: palette, _animated: true });
  }
  render_percentage_bar(x - 8, y + 32, 48, 5, enemy[ENEMY_HP], enemy[ENEMY_MAX_HP], 0xFF0000FF);
  push_text(enemy_name(enemy[ENEMY_TYPE], enemy[ENEMY_ELEMENT]), x + 16, y + 38, { _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER });
  push_textured_quad(intent_type_sprite[enemy[ENEMY_INTENT][ENEMY_INTENT_TYPE]], x + 16, y - 10);
  push_text(enemy[ENEMY_INTENT][ENEMY_INTENT_VALUE] === 0 ? "" : enemy[ENEMY_INTENT][ENEMY_INTENT_VALUE] + "", x + 8, y - 10);
};