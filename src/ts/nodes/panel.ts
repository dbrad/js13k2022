import { BLACK, WHITE } from "@graphics/colour";
import { push_quad } from "@graphics/quad";

export let render_panel = (x: number, y: number, width: number, height: number, outline_colour: number = WHITE) =>
{
  push_quad(x, y, width, height, outline_colour);
  push_quad(x + 1, y + 1, width - 2, height - 2, BLACK);
};