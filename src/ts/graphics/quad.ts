import { gl_push_textured_quad, gl_restore, gl_save, gl_scale, gl_translate } from "gl";
import { WHITE } from "./colour";

import { Texture, TEXTURES } from "./texture/texture";

let single_pixel_texture: Texture;
export let push_quad = (x: number, y: number, w: number, h: number, colour: number): void =>
{
  if (!single_pixel_texture)
    single_pixel_texture = TEXTURES[TEXTURE_SINGLE_WHITE_PIXEL];
  gl_push_textured_quad(0, x, y, w, h, single_pixel_texture._u0, single_pixel_texture._v0, single_pixel_texture._u1, single_pixel_texture._v1, colour);
};

export type TextureQuadParameters = {
  _palette_offset?: number,
  _horizontal_flip?: boolean;
  _vertical_flip?: boolean;
  _scale?: number;
  _colour?: number;
};
let default_texture_quad_parameters = {
  _palette_offset: 0,
  _horizontal_flip: false,
  _vertical_flip: false,
  _scale: 1,
  _colour: WHITE
};
export let push_textured_quad = (texture_id: number, x: number, y: number, parameters: TextureQuadParameters = default_texture_quad_parameters): void =>
{
  let pallete_offset = parameters._palette_offset || 0;
  let horizontal_flip = parameters._horizontal_flip || false;
  let vertical_flip = parameters._vertical_flip || false;
  let scale = parameters._scale || 1;
  let colour = parameters._colour || WHITE;

  let texture = TEXTURES[texture_id];
  gl_save();
  gl_translate(x, y);
  gl_save();
  if (horizontal_flip)
  {
    gl_translate(texture._w * scale, 0);
    gl_scale(-1, 1);
  }
  if (vertical_flip)
  {
    gl_translate(0, texture._h * scale);
    gl_scale(1, -1);
  }
  gl_scale(scale, scale);
  gl_push_textured_quad(pallete_offset, 0, 0, texture._w, texture._h, texture._u0, texture._v0, texture._u1, texture._v1, colour);
  gl_restore();
  gl_restore();
};