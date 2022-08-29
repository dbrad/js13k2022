import { assert } from "@debug/assert";
import { SCREEN_WIDTH } from "@root/screen";
import { gl_push_textured_quad, gl_restore, gl_save, gl_scale, gl_translate } from "gl";
import { math } from "math";
import { TEXTURES } from "texture";
import { WHITE } from "./colour";

export type TextParameters =
  {
    _colour?: number,
    _align?: number,
    _scale?: number,
    _width?: number,
    _font?: number,
  };

export const character_code_map: { [key: string]: number; } = {};
const font_sizes: { [key: number]: number; } = { [FONT_NORMAL]: 8, [FONT_SMALL]: 5 };
const text_cache: { [key: string]: [string, number][]; } = {};

let parse_text_into_lines = (text: string, width: number = SCREEN_WIDTH, font: number = FONT_NORMAL, scale: number = 1): [string, number][] =>
{
  let letter_gap = font === FONT_SMALL ? 1 : 0;
  let font_size = font_sizes[font] || 8;
  let letter_size: number = (font_size + letter_gap) * scale;
  let result_lines: [string, number][] = [];
  let result_line: string[] = [];

  let source_lines = text.split("\n");
  for (let source_line of source_lines)
  {
    let words: string[] = source_line.split(" ");
    for (let word of words)
    {
      result_line.push(word);
      if ((result_line.join(" ").length) * letter_size > width)
      {
        let last_word = result_line.pop();
        assert(last_word !== undefined, "No last word to pop found.");
        let line = result_line.join(" ");
        let line_length = line.length;
        result_lines.push([line, line_length]);
        result_line = [last_word];
      }
    }
    if (result_line.length > 0)
    {
      let line = result_line.join(" ");
      let line_length = line.length;
      result_lines.push([line, line_length]);
    }
    result_line.length = 0;
  }

  text_cache[`${text}_${font}_${scale}_${width}`] = result_lines;

  return result_lines;
};

export let push_text = (text: string, x: number, y: number, parameters: TextParameters = {}): void =>
{
  let colour = parameters._colour || WHITE;
  let align = parameters._align || TEXT_ALIGN_LEFT;
  let scale = parameters._scale || 1;
  let width = parameters._width || SCREEN_WIDTH;
  let font: number = parameters._font || FONT_NORMAL;

  let letter_gap = font === FONT_SMALL ? scale : 0;
  let letter_size: number = (font_sizes[font] || 8) * scale;

  let original_x = x;
  let x_offset: number = 0;

  let lines = text_cache[`${text}_${font}_${scale}_${width}`];
  if (!lines)
    lines = parse_text_into_lines(text, width, font, scale);

  let alignment_offset: number = 0;

  for (let [line, character_count] of lines)
  {
    let words: string[] = line.split(" ");
    let line_length: number = (character_count * letter_size) + ((character_count - 1) * letter_gap);

    if (align === TEXT_ALIGN_CENTER)
      alignment_offset = math.floor(-line_length / 2);
    else if (align === TEXT_ALIGN_RIGHT)
      alignment_offset = math.floor(-(line_length));

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

export let CENTERED: TextParameters = { _align: TEXT_ALIGN_CENTER };
export let SMALL_AND_CENTERED: TextParameters = { _align: TEXT_ALIGN_CENTER, _font: FONT_SMALL };