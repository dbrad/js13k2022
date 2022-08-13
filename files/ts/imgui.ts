import { push_quad } from "./draw-quad";
import { push_text, TEXT_ALIGN_CENTER } from "./draw-text";
import { input_context } from "./input";
import { V2, V4 } from "./vector";

let hot = -1;
let active = -1;

export let button = (id: number, label: string, position: V2, size: V2): boolean =>
{
  let result = false;
  let [x, y] = position;
  let [w, h] = size;

  push_quad(x, y, w, h, 0xFF000000);
  if (is_point_in_rect(input_context._cursor, [x, y, w, h]))
  {
    push_quad(x + 2, y + 2, w - 4, h - 4, 0xFF666666);
    hot = id;
    if (active === id)
    {
      push_quad(x + 2, y + 2, w - 4, h - 4, 0xFF888888);
      if (!input_context._mouse_down)
      {
        if (hot === id)
        {
          result = true;
        }
        active = -1;
      }
    }
    else if (input_context._mouse_down)
    {
      active = id;
    }
  }
  else
  {
    push_quad(x + 2, y + 2, w - 4, h - 4, 0xFF222222);
  }

  push_text(label, x + w / 2, y + h / 2 - 4, { _align: TEXT_ALIGN_CENTER });

  return result;
};