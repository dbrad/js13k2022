import { card_list } from "@gameplay/cards";
import { WHITE } from "@graphics/colour";
import { push_text } from "@graphics/text";
import { is_touch } from "@input/controls";
import { render_panel } from "./panel";

export let render_card_list = (x: number, y: number, card_id_list: number[], list_length: number, selected_index: number, skip: number = 0) =>
{
  let list_start = 0;
  let render_index = 0;
  if (selected_index > 10) list_start += 1 * (selected_index - 10);
  for (let card_index = list_start + skip; card_index < list_length; card_index++)
  {
    let card = card_list[card_id_list[card_index]];

    let touch_offset = render_index >= 6 && is_touch ? 116 : 0;
    let y_offset = (render_index) * 16 + touch_offset;

    let _colour = (card_index - skip) === selected_index ? WHITE : 0xff2d2d2d;

    render_panel(x, y + y_offset, 140, 16, _colour);
    push_text(card[CARD_NAME].replace("\n", " "), x + 5, y + 4 + y_offset, { _colour });
    if (card[CARD_TYPE] <= 2)
      push_text("lvl" + card[CARD_LEVEL], x + 135, y + 4 + y_offset, { _align: TEXT_ALIGN_RIGHT, _colour });

    render_index++;
  }
};