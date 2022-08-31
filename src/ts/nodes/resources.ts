import { push_text } from "@graphics/text";
import { is_touch } from "@input/controls";
import { SCREEN_WIDTH } from "@root/screen";
import { render_panel } from "./panel";

export let resource_names = ["bones", "rotting flesh", "souls", "human hearts", "lich hearts"];

export let render_resources = (resources: number[]) =>
{
  for (let r = 0; r < 5; r++)
  {
    let y_offset = 40 * r + (r >= 3 && is_touch ? 85 : 0);
    render_panel(SCREEN_WIDTH - 125, 50 + y_offset, 120, 30);
    push_text(resource_names[r], SCREEN_WIDTH - 10, 55 + y_offset, { _align: TEXT_ALIGN_RIGHT });
    push_text(resources[r], SCREEN_WIDTH - 10, 67 + y_offset, { _align: TEXT_ALIGN_RIGHT });
  }
};