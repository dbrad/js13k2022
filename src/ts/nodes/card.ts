import { BLACK } from "@graphics/colour";
import { push_quad, push_textured_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { Card } from "@root/game-state";
import { render_spirit, unit_name_map, unit_palette_map, unit_sprite } from "./unit";

let card_width = 100;
let card_width_half = card_width / 2;
let card_height = 76;

export let render_card = (x: number, y: number, card: Card, highlight_colour: number = 0xff2d2d2d) =>
{
  let card_type = card[CARD_TYPE];
  let has_effects = card[CARD_EFFECTS].length > 0;
  push_quad(x, y, card_width, card_height, highlight_colour);
  push_quad(x + 2, y + 2, card_width - 4, card_height - 4, BLACK);
  push_text(unit_name_map[card_type], x + card_width_half, y + 6, { _align: TEXT_ALIGN_CENTER });

  let sprite_x_offset = (has_effects ? 9 : card_width_half - 16);
  if (card_type === 2)
    render_spirit(x + sprite_x_offset + 16, y + 26 + 16);
  else
  {
    let palette = unit_palette_map[card_type] as number;
    push_textured_quad(unit_sprite[card_type], x + sprite_x_offset, y + 23, { _palette_offset: palette, _scale: 2, _animated: true });
  }

  let y_offset = 23;
  for (let effect of card[CARD_EFFECTS])
  {
    push_text(effect[EFFECT_DESCRIPTION] + " " + effect[EFFECT_LEVEL], x + card_width_half, y + y_offset, { _font: FONT_SMALL });
    y_offset += 10;
  }

  push_textured_quad(TEXTURE_SWORD, x + 4, y + card_height - 12);
  push_text("" + card[CARD_ATTACK], x + 14, y + card_height - 12);

  push_textured_quad(TEXTURE_SHEILD, x + card_width - 21, y + card_height - 12);
  push_text("" + card[CARD_DEFENSE], x + card_width - 3 - 8, y + card_height - 12);
};

