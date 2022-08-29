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

export let load_palette = async (): Promise<void> =>
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

let make_texture = (_w: number, _h: number, _u0: number, _v0: number, _u1: number, _v1: number): Texture => { return { _w, _h, _u0, _v0, _u1, _v1 }; };

let font_letters = `!"'()+,-./0123456789?abcdefghijklmnopqrstuvwxyz`;
export let load_textures = async (): Promise<void> =>
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

      TEXTURES[TEXTURE_SINGLE_WHITE_PIXEL] = make_texture(1, 1, 2 / width, 1 / height, 3 / width, 2 / height);

      for (let texture of texture_definitions)
      {
        let [def_type, id, x, y, w, h] = texture;
        if (def_type === TEXTURE_TYPE_FONT)
        {
          for (let letter_index: number = 0; letter_index < 47; letter_index++)
          {
            let i = font_letters.charCodeAt(letter_index);
            character_code_map[String.fromCharCode(i)] = i;
            let offset_x = x + (letter_index) * w;
            TEXTURES[id[0] + i] = make_texture(w, h, offset_x / width, y / height, (offset_x + w) / width, (y + h) / height);
          }
        }
        else
        {
          for (let offset_x: number = x, i: number = 0; offset_x < width; offset_x += w)
            TEXTURES[id[i++]] = make_texture(w, h, offset_x / width, y / height, (offset_x + w) / width, (y + h) / height);
        }
      }
      resolve();
    });
    texture_atlas.src = texture_atlas_data_url;
  }
  );
};