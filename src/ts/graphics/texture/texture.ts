import { character_code_map } from "@graphics/text";
import palette_data_url from "@res/palette.webp";
import texture_atlas_data_url from "@res/sheet.webp";
import { document_reference } from "@root/screen";
import { gl_upload_texture } from "gl";
import { texture_definitions } from "./texture-definitions";

export type Texture = {
  _w: number;
  _h: number;
  _u0: number;
  _v0: number;
  _u1: number;
  _v1: number;
};

export let TEXTURES: Texture[] = [];

export let load_palette = (): Promise<void> =>
{
  let palette: HTMLImageElement = new Image();
  return new Promise((resolve) =>
  {
    palette.addEventListener("load", () =>
    {
      gl_upload_texture(palette, GL_TEXTURE1);
      resolve();
    });
    palette.src = palette_data_url;
  });
};

let font_letters = `!"'()+,-./0123456789?abcdefghijklmnopqrstuvwxyz`;
export let load_textures = (): Promise<void> =>
{
  let texture_atlas: HTMLImageElement = new Image();
  return new Promise((resolve) =>
  {
    texture_atlas.addEventListener("load", () =>
    {
      let canvas = document_reference.createElement("canvas");
      let width = canvas.width = texture_atlas.width;
      let height = canvas.height = texture_atlas.height;
      canvas.getContext("2d")?.drawImage(texture_atlas, 0, 0);

      gl_upload_texture(canvas, GL_TEXTURE0);

      TEXTURES[TEXTURE_SINGLE_WHITE_PIXEL] = {
        _w: 1, _h: 1,
        _u0: 2 / width, _v0: 1 / height,
        _u1: (2 + 1) / width, _v1: (1 + 1) / height
      };
      for (let texture of texture_definitions)
      {
        let [texture_type, texture_id, x, y, texture_width, texture_height] = texture;
        if (texture_type === TEXTURE_TYPE_FONT)
        {
          for (let letter_index: number = 0; letter_index < 47; letter_index++)
          {
            let i = font_letters.charCodeAt(letter_index);
            character_code_map.set(String.fromCharCode(i), i);
            let offset_x = x + (letter_index) * texture_width;
            TEXTURES[texture_id[0] + i] = {
              _w: texture_width,
              _h: texture_height,
              _u0: (offset_x) / width,
              _v0: (y) / height,
              _u1: (offset_x + texture_width) / width,
              _v1: (y + texture_height) / height
            };
          }
        }
        else
        {
          for (let offset_x: number = x, i: number = 0; offset_x < width; offset_x += texture_width)
          {
            TEXTURES[texture_id[i++]] = {
              _w: texture_width,
              _h: texture_height,
              _u0: (offset_x) / width,
              _v0: (y) / height,
              _u1: (offset_x + texture_width) / width,
              _v1: (y + texture_height) / height
            };
          }
        }
      }
      resolve();
    });
    texture_atlas.src = texture_atlas_data_url;
  }
  );
};