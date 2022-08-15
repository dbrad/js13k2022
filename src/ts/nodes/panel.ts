import { BLACK, WHITE } from "@graphics/colour";
import { push_quad } from "@graphics/quad";

export let render_panel = (x: number, y: number, width: number, height: number) =>
{
  push_quad(x, y, width, height, WHITE);
  push_quad(x + 2, y + 2, width - 4, height - 4, BLACK);
};