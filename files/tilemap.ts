import { rgba_v4_to_abgr_number } from "@graphics/colour";
import { push_quad, push_textured_quad } from "@graphics/quad";
import { V2 } from "@math/vector";
import { D_DOWN, D_LEFT, D_RIGHT, D_UP, key_state, KEY_WAS_DOWN } from "@root/input/controls";
import { add_interpolator, ease_out_quad, get_interpolation_data, has_interpolation_data } from "@root/interpolate";
import { get_next_scene_id, Scene } from "@root/scene";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@root/screen";
import { is_point_in_circle, math } from "math";

export namespace TileMap
{
  let sprite_scale = 2;
  let tile_pixel_size = 16 * sprite_scale;

  let player_tile_position: V2 = [1, 1];
  let player_pixel_position: V2 = [player_tile_position[0] * tile_pixel_size, player_tile_position[1] * tile_pixel_size];

  let camera_pixel_position: V2 = [0, 0];
  let camera_room_position: V2 = [0, 0];

  let room_tile_width = 19;
  let room_tile_height = 11;

  let map_room_width = 5;

  let map_tile_width = map_room_width * room_tile_width;

  let raw_map = "0233333333333333340023333333333333334002333333333333333400233333333333333340023333333333333334001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111124111111111111111112411111111111111111241111111111111111124111111111111111110011111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111100111111113111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111000000000010000000000000000001000000000000000000100000000000000000010000000000000000001000000000056666666166666667005666666616666666700566666661666666670056666666166666667005666666616666666700111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111112411111111111111111241111111111111111124111111111111111112411111111111111111001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100000000001000000000000000000100000000000000000010000000000000000001000000000000000000100000000002333333313333333400233333331333333340023333333133333334002333333313333333400233333331333333340011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111241111111111111111124111111111111111112411111111111111111241111111111111111100111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110000000000100000000000000000010000000000000000001000000000000000000100000000000000000010000000000233333331333333340023333333133333334002333333313333333400233333331333333340023333333133333334001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111124111111111111111112411111111111111111241111111111111111124111111111111111110011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111000000000010000000000000000001000000000000000000100000000000000000010000000000000000001000000000023333333133333334002333333313333333400233333331333333340023333333133333334002333333313333333400111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111112411111111111111111241111111111111111124111111111111111112411111111111111111001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100111111111111111110011111111111111111001111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

  let map: number[];
  let light_value_map: number[] = [];

  let light_sources: Map<number, number> = new Map();

  let _setup_fn = () => { };
  let _reset_fn = () =>
  {
    map = raw_map.split("").map(n => Number(n));

    for (let i = 0, len = map.length; i < len; i++)
      light_value_map[i] = 0;

    light_sources.set(9 + 0 * map_tile_width, 4);
    light_sources.set(4 + 11 * map_tile_width, 5);
  };

  let fract = (a: number) =>
  {
    return a - math.floor(a);
  };

  let pingpong = (a: number, b: number) =>
  {
    if (b == 0.0)
      return 0.0;
    else
      return math.abs(fract((a - b) / (b * 2.0)) * b * 2.0 - b);
  };

  let active_lights: [V2, number][] = [];

  let _update_fn = (now: number, delta: number) =>
  {
    let camera_movement = get_interpolation_data(INTERP_CAMERA_MOVEMENT);
    if (camera_movement)
    {
      camera_pixel_position[0] = math.floor(camera_movement._values[0]);
      camera_pixel_position[1] = math.floor(camera_movement._values[1]);
    }

    let player_movement = get_interpolation_data(INTERP_PLAYER_MOVEMENT);
    if (player_movement)
    {
      player_pixel_position[0] = math.floor(player_movement._values[0]);
      player_pixel_position[1] = math.floor(player_movement._values[1]);
    }

    if (!camera_movement && !player_movement)
    {
      camera_room_position[0] = math.floor(player_tile_position[0] / room_tile_width);
      camera_room_position[1] = math.floor(player_tile_position[1] / room_tile_height);

      let destination: V2 = [camera_room_position[0] * room_tile_width * tile_pixel_size, camera_room_position[1] * room_tile_height * tile_pixel_size];
      if (camera_pixel_position[0] != destination[0] || camera_pixel_position[1] != destination[1])
        add_interpolator(INTERP_CAMERA_MOVEMENT, 300, camera_pixel_position, destination, null, ease_out_quad);
    }

    if (!camera_movement && !player_movement)
    {
      if (key_state.get(D_DOWN) === KEY_WAS_DOWN)
      {
        if (map[player_tile_position[0] + (player_tile_position[1] + 1) * map_tile_width] === 1)
          player_tile_position[1]++;
      }
      else if (key_state.get(D_UP) === KEY_WAS_DOWN)
      {
        if (map[player_tile_position[0] + (player_tile_position[1] - 1) * map_tile_width] === 1)
          player_tile_position[1]--;
      }
      else if (key_state.get(D_LEFT) === KEY_WAS_DOWN)
      {
        if (map[(player_tile_position[0] - 1) + player_tile_position[1] * map_tile_width] === 1)
          player_tile_position[0]--;
      }
      else if (key_state.get(D_RIGHT) === KEY_WAS_DOWN)
      {
        if (map[(player_tile_position[0] + 1) + player_tile_position[1] * map_tile_width] === 1)
          player_tile_position[0]++;
      }

      let player_destination = [player_tile_position[0] * tile_pixel_size, player_tile_position[1] * tile_pixel_size];
      if (player_destination[0] !== player_pixel_position[0] || player_destination[1] !== player_pixel_position[1])
        add_interpolator(INTERP_PLAYER_MOVEMENT, 50, player_pixel_position, player_destination);
    }

    // Lighting
    let start_x = math.floor(camera_pixel_position[0] / tile_pixel_size - room_tile_width);
    let start_y = math.floor(camera_pixel_position[1] / tile_pixel_size - room_tile_height);
    let end_x = room_tile_width * 3;
    let end_y = room_tile_height * 3;

    active_lights.length = 0;
    active_lights.push([player_tile_position, 2]);

    for (let loop_x = 0; loop_x < end_x; loop_x++)
    {
      for (let loop_y = 0; loop_y < end_y; loop_y++)
      {
        let index = (start_x + loop_x) + (start_y + loop_y) * map_tile_width;
        let light = light_sources.get(index);
        if (light !== undefined)
          active_lights.push([[start_x + loop_x, start_y + loop_y], light]);

        light_value_map[index] = 0;
      }
    }

    let distance_x: number;
    let distance_y: number;
    let distance: number;

    let t = now / 100;
    let light_flicker = (pingpong(t, 20) + 80) / 100;

    for (let [[light_x, light_y], light_radius] of active_lights)
    {
      for (let map_x = light_x - light_radius * 2; map_x <= light_x + light_radius * 2; map_x++)
      {
        for (let map_y = light_y - light_radius * 2; map_y <= light_y + light_radius * 2; map_y++)
        {
          if (!is_point_in_circle([map_x, map_y], [light_x, light_y], light_radius * 2 + 1))
            continue;
          let map_index = map_x + map_y * map_tile_width;
          let blocked = false;
          let light_modifier = 0;

          if (map[map_index] !== 0)
          {
            // light collision
            let points_between = points_on_line(map_x, map_y, light_x, light_y);
            for (let [x, y] of points_between)
            {
              if ((x === map_x && y === map_y) || (x === light_x && y === light_y)) continue;

              let map_point_value = map[x + y * map_tile_width];
              if (map_point_value === 0)
              {
                blocked = true;
                break;
              }
              else if (map_point_value !== 1)
                light_modifier += 0.02;
            }

            if (!blocked)
            {
              distance_x = light_x - map_x;
              distance_y = light_y - map_y;
              distance = math.sqrt(distance_x * distance_x + distance_y * distance_y);

              let attenuation = math.max(0, (1 / ((distance / light_radius + 1) ** 2)) - light_modifier) * light_flicker;
              // light_value_map[map_index] = math.min(1, attenuation + light_value_map[map_index]);
              light_value_map[map_index] = math.max(math.min(1, attenuation), light_value_map[map_index]);
            }
          }
        }
      }
    }

    for (let loop_x = 0; loop_x < end_x; loop_x++)
    {
      for (let loop_y = 0; loop_y < end_y; loop_y++)
      {
        let index = (start_x + loop_x) + (start_y + loop_y) * map_tile_width;
        light_value_map[index] = 1 - math.max(0.05, light_value_map[index]);
      }
    }
  };

  let screen_offset_x = 16;
  let screen_offset_y = 4;

  let _render_fn = () =>
  {
    let player_movement = has_interpolation_data(INTERP_PLAYER_MOVEMENT);

    let start_x = math.floor(camera_pixel_position[0] / tile_pixel_size);
    let start_y = math.floor(camera_pixel_position[1] / tile_pixel_size);

    let offset_x = camera_pixel_position[0] - start_x * tile_pixel_size;
    let offset_y = camera_pixel_position[1] - start_y * tile_pixel_size;

    for (let loop_x = -2; loop_x <= room_tile_width + 1; loop_x++)
    {
      for (let loop_y = -2; loop_y <= room_tile_height + 1; loop_y++)
      {
        let map_x = start_x + loop_x;
        let map_y = start_y + loop_y;

        let x = loop_x * tile_pixel_size - offset_x + screen_offset_x;
        let y = loop_y * tile_pixel_size - offset_y + screen_offset_y;

        let index = map_x + map_y * map_tile_width;

        let map_value = map[index];
        if (!map_value)
          push_quad(x, y, tile_pixel_size, tile_pixel_size, 0xFF1C0C14);
        else if (map_value === 1)
          push_textured_quad(TEXTURE_FLOOR, x, y, { _scale: sprite_scale, _palette_offset: (loop_x + loop_y) % 2 == 0 ? 7 : 7 });
        else if (map_value === 2)
          push_textured_quad(TEXTURE_LEFT_WALL, x, y, { _scale: sprite_scale, _palette_offset: 7 });
        else if (map_value === 3)
          push_textured_quad(TEXTURE_CENTER_WALL, x, y, { _scale: sprite_scale, _palette_offset: 7 });
        else if (map_value === 4)
          push_textured_quad(TEXTURE_RIGHT_WALL, x, y, { _scale: sprite_scale, _palette_offset: 7 });
        else if (map_value === 5)
          push_textured_quad(TEXTURE_LEFT_WALL, x, y, { _scale: sprite_scale, _palette_offset: 15 });
        else if (map_value === 6)
          push_textured_quad(TEXTURE_CENTER_WALL, x, y, { _scale: sprite_scale, _palette_offset: 15 });
        else if (map_value === 7)
          push_textured_quad(TEXTURE_RIGHT_WALL, x, y, { _scale: sprite_scale, _palette_offset: 15 });

        if (!player_movement && player_tile_position[0] === map_x && player_tile_position[1] === map_y)
          push_textured_quad(TEXTURE_PLAYER, x, y, { _scale: 2 });

        let light_colour = rgba_v4_to_abgr_number([0, 0, 0, light_value_map[index]]);
        push_quad(x, y, tile_pixel_size, tile_pixel_size, light_colour);

        // push_text(`${map_x}`, x, y, { _font: Font_Small });
        // push_text(`${map_y}`, x, y + 6, { _font: Font_Small });
        // push_text(`${light_value_map[index].toFixed(2)}`, x, y + 12, { _font: FONT_SMALL });
      }
    }

    for (let l = 1, len = active_lights.length; l < len; l++)
    {
      let x = active_lights[l][0][0] * tile_pixel_size - camera_pixel_position[0] - offset_x + screen_offset_x;
      let y = active_lights[l][0][1] * tile_pixel_size - camera_pixel_position[1] - offset_y + screen_offset_y;
      push_textured_quad(TEXTURE_TORCH, x, y, { _scale: 2 });
    }

    if (player_movement)
    {
      let player_x = player_pixel_position[0] - camera_pixel_position[0] - offset_x + screen_offset_x;
      let player_y = player_pixel_position[1] - camera_pixel_position[1] - offset_y + screen_offset_y;
      push_textured_quad(TEXTURE_PLAYER, player_x, player_y, { _scale: 2 });
    }

    push_quad(0, 0, SCREEN_WIDTH, screen_offset_y, 0xFF000000);
    push_quad(0, SCREEN_HEIGHT - screen_offset_y, SCREEN_WIDTH, screen_offset_y, 0xFF000000);
    push_quad(0, 0, screen_offset_x, SCREEN_HEIGHT, 0xFF000000);
    push_quad(SCREEN_WIDTH - screen_offset_x, 0, screen_offset_x, SCREEN_HEIGHT, 0xFF000000);

  };

  let points_on_line = (x1: number, y1: number, x2: number, y2: number): V2[] =>
  {
    let line: V2[] = [];
    let dx = math.abs(x2 - x1);
    let dy = math.abs(y2 - y1);
    let x = x1;
    let y = y1;
    let remaining_length = 1 + dx + dy;
    let x_direction = (x1 < x2 ? 1 : -1);
    let y_direction = (y1 < y2 ? 1 : -1);
    let e = dx - dy;
    dx *= 2;
    dy *= 2;
    while (remaining_length > 0)
    {
      line.push([x, y]);
      if (e > 0)
      {
        x += x_direction;
        e -= dy;
      }
      else
      {
        y += y_direction;
        e += dx;
      }
      remaining_length--;
    }
    return line;
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _setup_fn, _reset_fn, _update_fn, _render_fn };
}