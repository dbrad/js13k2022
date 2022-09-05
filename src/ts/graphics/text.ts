import { assert } from "@debug/assert";
import { gl_push_textured_quad, gl_restore, gl_save, gl_scale, gl_translate } from "gl";
import { floor } from "math";
import { TEXTURES } from "texture";
import { WHITE } from "./colour";

export type TextParameters =
  {
    _colour?: number,
    _align?: number,
    _scale?: number,
    _font?: number,
  };

export const character_code_map: { [key: string]: number; } = {};
const font_sizes: { [key: number]: number; } = { [FONT_NORMAL]: 8, [FONT_SMALL]: 5 };

export let push_text = (text: string | number, x: number, y: number, parameters: TextParameters = {}): void =>
{
  text = text + "";
  let colour = parameters._colour || WHITE;
  let align = parameters._align || TEXT_ALIGN_LEFT;
  let scale = parameters._scale || 1;
  let font: number = parameters._font || FONT_NORMAL;

  let letter_gap = font === FONT_SMALL ? scale : 0;
  let letter_size: number = (font_sizes[font] || 8) * scale;

  let original_x = x;
  let x_offset: number = 0;

  let lines = text.split("|");

  let alignment_offset: number = 0;

  for (let line of lines)
  {
    let character_count = line.length;
    let words: string[] = line.split(" ");
    let line_length: number = (character_count * letter_size) + ((character_count - 1) * letter_gap);

    if (align === TEXT_ALIGN_CENTER)
      alignment_offset = floor(-line_length / 2);
    else if (align === TEXT_ALIGN_RIGHT)
      alignment_offset = floor(-(line_length));

    for (let word of words)
    {
      for (let letter of word.split(""))
      {
        let character_index = character_code_map[letter];
        assert(character_index !== undefined, `Undefined character ${letter} used.`);
        let t = TEXTURES[font + character_index];
        x = original_x + x_offset + alignment_offset;
        gl_save();
        gl_translate(x, y);
        gl_scale(scale, scale);
        gl_push_textured_quad(0, 0, 0, t._w, t._h, t._u0, t._v0, t._u1, t._v1, colour);
        gl_restore();
        x_offset += letter_size + letter_gap;
      }
      x_offset += letter_size + letter_gap;
    }
    y += letter_size + (scale * 2);
    x_offset = 0;
  }
};

export let CENTERED_TEXT: TextParameters = { _align: TEXT_ALIGN_CENTER };
export let RIGHT_ALGIN_TEXT: TextParameters = { _align: TEXT_ALIGN_RIGHT };
export let SMALL_FONT_AND_CENTERED_TEXT: TextParameters = { _align: TEXT_ALIGN_CENTER, _font: FONT_SMALL };