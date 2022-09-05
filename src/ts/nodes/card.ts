import { BLACK, DARK_GREY, GREEN, RED, WHITE } from "@graphics/colour";
import { push_quad, push_textured_quad } from "@graphics/quad";
import { push_text, SMALL_FONT_AND_CENTERED_TEXT } from "@graphics/text";
import { V2 } from "@math/vector";
import { Card, game_state } from "@root/game-state";
import { max } from "math";
import { render_spirit, unit_palette_map, unit_sprite } from "./unit";

let card_type_text = ['minion', 'minion', 'minion', 'buff', 'spell'];
export let render_card = (x: number, y: number, card: Card, scale: number = 1, highlight_colour: number = DARK_GREY) =>
{
  let card_width = 100 * scale;
  let card_width_half = card_width / 2;
  let card_height = 76 * scale;

  let card_type = card[CARD_TYPE];
  push_quad(x, y, card_width, card_height, highlight_colour);
  push_quad(x + 2, y + 2, card_width - 4, card_height - 4, BLACK);
  push_text(card[CARD_NAME], x + card_width_half, y + 6, { _align: TEXT_ALIGN_CENTER, _scale: scale });

  let sprite_x_offset = card_width_half - 16 * scale;
  if (card_type === 2)
    render_spirit(x + sprite_x_offset + 16 * scale, y + 42 * scale, scale);
  else if (card_type < 2)
    push_textured_quad(unit_sprite[card_type], x + sprite_x_offset, y + 23 * scale, { _palette_offset: unit_palette_map[card_type], _scale: 2 * scale, _animated: true });

  let y_offset = 33 * scale;
  for (let effect of card[CARD_EFFECTS])
  {
    let spacer = effect[EFFECT_VALUE] > 0 && card_type === 3 ? " +" : " ";
    push_text(effect[EFFECT_DESCRIPTION] + spacer + effect[EFFECT_VALUE], x + card_width_half, y + y_offset, { _font: FONT_SMALL, _align: TEXT_ALIGN_CENTER, _scale: scale });
    y_offset += 10 * scale;
  }

  let attack_modifier = 0;
  let defense_modifier = 0;

  if (card_type <= 2)
    [attack_modifier, defense_modifier] = get_modifiers();

  push_text(card_type_text[card_type], x + card_width_half, y + card_height - 4 - 5 * scale, { ...SMALL_FONT_AND_CENTERED_TEXT, _scale: scale });

  if (card_type !== 3)
  {
    let attack = max(0, card[CARD_ATTACK] + attack_modifier);
    if (attack > 0)
    {
      let attack_colour = attack_modifier > 0 ? GREEN : attack_modifier < 0 ? RED : WHITE;
      push_textured_quad(TEXTURE_SWORD, x + 4, y + card_height - 4 - 8 * scale, { _scale: scale });
      push_text(attack, x + 6 + 8 * scale, y + card_height - 3 - 8 * scale, { _colour: attack_colour, _scale: scale });
    }

    let defense = max(0, card[CARD_DEFENSE] + defense_modifier);
    if (defense > 0)
    {
      let defense_colour = defense_modifier > 0 ? GREEN : defense_modifier < 0 ? RED : WHITE;
      push_textured_quad(TEXTURE_SHEILD, x + card_width - 3 - 8 * scale, y + card_height - 4 - 8 * scale, { _scale: scale });
      push_text(defense, x + card_width - 4 - 8 * scale, y + card_height - 3 - 8 * scale, { _align: TEXT_ALIGN_RIGHT, _colour: defense_colour, _scale: scale });
    }
  }
};

export let get_modifiers = (): V2 =>
{
  let attack_modifier = game_state[GAMESTATE_COMBAT][ATTACK_MODIFIER];
  let defense_modifier = game_state[GAMESTATE_COMBAT][DEFENSE_MODIFIER];
  return [attack_modifier, defense_modifier];
};