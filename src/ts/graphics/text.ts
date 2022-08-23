import { assert } from "@debug/assert";
import { SCREEN_WIDTH } from "@root/screen";
import { gl_push_textured_quad, gl_restore, gl_save, gl_scale, gl_translate } from "gl";
import { math } from "math";
import { TEXTURES } from "texture";
import { WHITE } from "./colour";

const font_sizes: Map<number, number> = new Map([[FONT_NORMAL, 8], [FONT_SMALL, 5]]);

export type TextParameters =
  {
    _colour?: number,
    _align?: number,
    _scale?: number,
    _width?: number,
    _font?: number,
  };

let default_text_parameters = {
  _colour: WHITE,
  _align: TEXT_ALIGN_LEFT,
  _scale: 1,
  _width: SCREEN_WIDTH,
  _font: FONT_NORMAL
};

let text_cache: Map<string, [string, number][]> = new Map();

let parse_text_into_lines = (text: string, width: number = SCREEN_WIDTH, font: number = FONT_NORMAL, scale: number = 1): number =>
{
  if (text_cache.has(`${text}_${font}_${scale}_${width}`)) return text_cache.get(`${text}_${font}_${scale}_${width}`)?.length || 0;

  let letter_gap = font === FONT_SMALL ? 1 : 0;
  let font_size = font_sizes.get(font) || 8;
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

  text_cache.set(`${text}_${font}_${scale}_${width}`, result_lines);

  return result_lines.length;
};

export let character_code_map: Map<string, number> = new Map();

export let push_text = (text: string, x: number, y: number, parameters: TextParameters = default_text_parameters): void =>
{
  let colour = parameters._colour || WHITE;
  let original_colour = colour;
  let align = parameters._align || TEXT_ALIGN_LEFT;
  let scale = parameters._scale || 1;
  let width = parameters._width || SCREEN_WIDTH;
  let font: number = parameters._font || FONT_NORMAL;

  let letter_gap = font === FONT_SMALL ? 1 : 0;
  let font_size = font_sizes.get(font) || 8;
  let letter_size: number = (font_size) * scale;

  let original_x = x;
  let x_offset: number = 0;

  let lines = text_cache.get(`${text}_${font}_${scale}_${width}`);
  if (!lines)
  {
    parse_text_into_lines(text, width, font, scale);
    lines = text_cache.get(`${text}_${font}_${scale}_${width}`);
  }
  assert(lines !== undefined, "text lines not found");

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
        let character_index = character_code_map.get(letter);
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
      colour = original_colour;
      x_offset += letter_size + letter_gap;
    }
    y += letter_size + (scale * 2);
    x_offset = 0;
  }
};

export let CENTERED: TextParameters = { _align: TEXT_ALIGN_CENTER };
export let SMALL_AND_CENTERED: TextParameters = { _align: TEXT_ALIGN_CENTER, _font: FONT_SMALL };