import { BLACK, WHITE } from "@graphics/colour";
import { push_quad } from "@graphics/quad";
import { push_text } from "@graphics/text";
import { math } from "math";

export let render_percentage_bar = (x: number, y: number, width: number, height: number, value: number, max_value: number, colour: number) =>
{
  push_quad(x, y, width - 2, height - 2, WHITE);
  push_quad(x + 1, y + 1, width - 1, height - 1, BLACK);

  let percentage = math.min(1, value / max_value);
  push_quad(x + 2, y + 2, math.ceil((width - 4) * percentage), height - 2, colour);
  push_text(value + "/" + max_value, x + width + 2, y, { _font: FONT_SMALL });
};