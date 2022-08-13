import { push_quad } from "../draw-quad";
import { Font_Small, push_text } from "../draw-text";
import { gl_push_textured_quad } from "../gl";
import { key_state, D_LEFT, D_RIGHT, D_UP, D_DOWN, KEY_WAS_DOWN } from "../input";
import { add_interpolator, get_interpolation_data, has_interpolation_data } from "../interpolate";
import { INTERP_CAMERA_MOVEMENT, INTERP_PLAYER_MOVEMENT } from "../interpolation_ids";
import { math } from "../math";
import { get_next_scene_id, Scene } from "../scene";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../screen";
import { get_texture, Texture } from "../texture";
import { V2, V4 } from "../vector";

export namespace RayCast
{
  //#region Map
  let map = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    1, 0, 1, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    1, 0, 0, 2, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 1, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ];
  let map_dimension = 10;
  let get_map_value = (x: number, y: number): number =>
  {
    x = math.floor(x);
    y = math.floor(y);
    if (y < 0 || y > map_dimension || x < 0 || x > map_dimension)
    {
      return 0;
    }
    return map[y * map_dimension + x] || 0;
  };
  //#endregion Map

  let camera_width = SCREEN_WIDTH;
  let camera_height = SCREEN_HEIGHT;
  let resolution = SCREEN_WIDTH / 2;
  let stripe_width = camera_width / resolution;

  let view_plane: V2 = [0, 0.8];
  let direction_vector: V2 = [-1, 0];
  let player_position: V2 = [4.5, 4.5];

  let draw_buffer: V4[][] = [];

  let wall_texture: Texture;
  let window_texture: Texture;
  let u_step: number;
  let map_values: number[] = [0, 0];

  let _setup_fn = () =>
  {
    for (let x = 0; x < resolution; x++)
    {
      draw_buffer[x] = [];
      for (let z = 0; z < 16; z++)
        draw_buffer[x][z] = [0, 0, 0, 0];
    }
    wall_texture = get_texture("br");
    window_texture = get_texture("wd");
    u_step = (wall_texture._u1 - wall_texture._u0) / 16;
  };
  let _reset_fn = () => { };
  let _update_fn = (now: number, delta: number) =>
  {
    for (let x = 0; x < resolution; x++)
    {
      for (let z = 0; z < 16; z++)
        draw_buffer[x][z][3] = 0;

      // calculate ray position and direction
      let camera_x = 2 * x / resolution - 1; // x-coordinate in camera space
      let ray_direction_x = direction_vector[0] + view_plane[0] * camera_x;
      let ray_direction_y = direction_vector[1] + view_plane[1] * camera_x;

      // which box of the map we're in
      let map_x = math.floor(player_position[0]);
      let map_y = math.floor(player_position[1]);

      // length of ray from current position to next x or y-side
      let ray_length_x;
      let ray_length_y;

      // length of ray from one x or y-side to next x or y-side
      let ray_unit_x = (ray_direction_x == 0) ? Infinity : math.abs(1 / ray_direction_x);
      let ray_unit_y = (ray_direction_y == 0) ? Infinity : math.abs(1 / ray_direction_y);
      let normalized_distance;

      // what direction to step in x or y-direction (either +1 or -1)
      let step_x;
      let step_y;

      let hit = 0; // was there a wall hit?
      let side; // was a NS or a EW wall hit?

      // calculate step and initial sideDist
      if (ray_direction_x < 0)
      {
        step_x = -1;
        ray_length_x = (player_position[0] - map_x) * ray_unit_x;
      }
      else
      {
        step_x = 1;
        ray_length_x = (map_x + 1 - player_position[0]) * ray_unit_x;
      }
      if (ray_direction_y < 0)
      {
        step_y = -1;
        ray_length_y = (player_position[1] - map_y) * ray_unit_y;
      }
      else
      {
        step_y = 1;
        ray_length_y = (map_y + 1 - player_position[1]) * ray_unit_y;
      }

      // perform DDA
      let z = 0;
      while (hit === 0)
      {
        // jump to next map square, either in x-direction, or in y-direction
        if (ray_length_x < ray_length_y)
        {
          ray_length_x += ray_unit_x;
          map_x += step_x;
          map_values[0] = get_map_value(map_x, map_y);
          map_values[1] = get_map_value(map_x - step_x, map_y);
          side = 0;
        }
        else
        {
          ray_length_y += ray_unit_y;
          map_y += step_y;
          map_values[0] = get_map_value(map_x, map_y);
          map_values[1] = get_map_value(map_x, map_y - step_y);
          side = 1;
        }

        // Check if ray has hit a wall
        for (let i = 0; i < 2; i++)
        {
          let map_value = map_values[i];
          if (map_value > 0)
          {
            // Calculate distance of perpendicular ray (Euclidean distance would give fisheye effect!)
            if (side == 0) normalized_distance = (ray_length_x - ray_unit_x);
            else normalized_distance = (ray_length_y - ray_unit_y);

            // Calculate height of line to draw on screen
            let line_height = math.floor(camera_height / normalized_distance);

            // calculate lowest and highest pixel to fill in current stripe
            let y_top = -line_height / 2 + camera_height / 2;
            let y_bottom = line_height / 2 + camera_height / 2;

            let wall_x; // where exactly the wall was hit
            if (side == 0) wall_x = player_position[1] + normalized_distance * ray_direction_y;
            else wall_x = player_position[0] + normalized_distance * ray_direction_x;
            wall_x -= math.floor((wall_x));

            // x coordinate on the texture
            let texture_x = math.floor(wall_x * 16);
            if (side == 0 && ray_direction_x > 0) texture_x = 16 - texture_x - 1;
            if (side == 1 && ray_direction_y < 0) texture_x = 16 - texture_x - 1;

            draw_buffer[x][z][0] = y_top;
            draw_buffer[x][z][1] = y_bottom;
            draw_buffer[x][z][2] = texture_x;
            draw_buffer[x][z][3] = map_value;
            z++;
          }

          if (map_value === 1)
          {
            hit = 1;
            break;
          }
        }
      }
    }

    // let seconds = delta / 500;
    // let moveSpeed = seconds * 3.0;
    // let rotSpeed = seconds * 2.0;
    // if (key_state.get(D_LEFT) === KEY_IS_DOWN)
    // {
    //   let oldDirX = direction_vector[0];
    //   direction_vector[0] = direction_vector[0] * math.cos(rotSpeed) - direction_vector[1] * math.sin(rotSpeed);
    //   direction_vector[1] = oldDirX * math.sin(rotSpeed) + direction_vector[1] * math.cos(rotSpeed);

    //   let oldPlaneX = view_plane[0];
    //   view_plane[0] = view_plane[0] * math.cos(rotSpeed) - view_plane[1] * math.sin(rotSpeed);
    //   view_plane[1] = oldPlaneX * math.sin(rotSpeed) + view_plane[1] * math.cos(rotSpeed);
    // }
    // else if (key_state.get(D_RIGHT) === KEY_IS_DOWN)
    // {
    //   let oldDirX = direction_vector[0];
    //   direction_vector[0] = direction_vector[0] * math.cos(-rotSpeed) - direction_vector[1] * math.sin(-rotSpeed);
    //   direction_vector[1] = oldDirX * math.sin(-rotSpeed) + direction_vector[1] * math.cos(-rotSpeed);

    //   let oldPlaneX = view_plane[0];
    //   view_plane[0] = view_plane[0] * math.cos(-rotSpeed) - view_plane[1] * math.sin(-rotSpeed);
    //   view_plane[1] = oldPlaneX * math.sin(-rotSpeed) + view_plane[1] * math.cos(-rotSpeed);
    // }
    // if (key_state.get(D_UP) === KEY_IS_DOWN)
    // {
    //   if (get_map_value(math.floor(player_position[0] + direction_vector[0] * moveSpeed), math.floor(player_position[1])) === 0) player_position[0] += direction_vector[0] * moveSpeed;
    //   if (get_map_value(math.floor(player_position[0]), math.floor(player_position[1] + direction_vector[1] * moveSpeed)) === 0) player_position[1] += direction_vector[1] * moveSpeed;
    // }
    // else if (key_state.get(D_DOWN) === KEY_IS_DOWN)
    // {
    //   if (get_map_value(math.floor(player_position[0] - direction_vector[0] * moveSpeed), math.floor(player_position[1])) === 0) player_position[0] -= direction_vector[0] * moveSpeed;
    //   if (get_map_value(math.floor(player_position[0]), math.floor(player_position[1] - direction_vector[1] * moveSpeed)) === 0) player_position[1] -= direction_vector[1] * moveSpeed;
    // }
    let PI = math.PI;

    if (!has_interpolation_data(INTERP_CAMERA_MOVEMENT) && !has_interpolation_data(INTERP_PLAYER_MOVEMENT))
    {
      if (key_state.get(D_LEFT) === KEY_WAS_DOWN)
      {
        let cos = math.cos(PI / 2);
        let sin = math.sin(PI / 2);
        let targets = [];
        targets[0] = direction_vector[0] * cos - direction_vector[1] * sin;
        targets[1] = direction_vector[0] * sin + direction_vector[1] * cos;
        targets[2] = view_plane[0] * cos - view_plane[1] * sin;
        targets[3] = view_plane[0] * sin + view_plane[1] * cos;

        add_interpolator(INTERP_PLAYER_MOVEMENT, 100, [direction_vector[0], direction_vector[1], view_plane[0], view_plane[1]], targets);
      }
      else if (key_state.get(D_RIGHT) === KEY_WAS_DOWN)
      {
        let cos = math.cos(-PI / 2);
        let sin = math.sin(-PI / 2);
        let targets = [];
        targets[0] = direction_vector[0] * cos - direction_vector[1] * sin;
        targets[1] = direction_vector[0] * sin + direction_vector[1] * cos;
        targets[2] = view_plane[0] * cos - view_plane[1] * sin;
        targets[3] = view_plane[0] * sin + view_plane[1] * cos;

        add_interpolator(INTERP_PLAYER_MOVEMENT, 100, [direction_vector[0], direction_vector[1], view_plane[0], view_plane[1]], targets);
      }

      if (key_state.get(D_UP) === KEY_WAS_DOWN)
      {
        let targets = [];
        targets[0] = player_position[0] + direction_vector[0];
        targets[1] = player_position[1] + direction_vector[1];
        if (get_map_value(targets[0], targets[1]) === 0)
          add_interpolator(INTERP_CAMERA_MOVEMENT, 200, [player_position[0], player_position[1]], targets);
      }
      else if (key_state.get(D_DOWN) === KEY_WAS_DOWN)
      {
        let targets = [];
        targets[0] = player_position[0] - direction_vector[0];
        targets[1] = player_position[1] - direction_vector[1];
        if (get_map_value(targets[0], targets[1]) === 0)
          add_interpolator(INTERP_CAMERA_MOVEMENT, 200, [player_position[0], player_position[1]], targets);
      }
    }
    else
    {
      let movement = get_interpolation_data(INTERP_CAMERA_MOVEMENT);
      if (movement)
      {
        player_position[0] = movement._values[0];
        player_position[1] = movement._values[1];
      }
      let turn = get_interpolation_data(INTERP_PLAYER_MOVEMENT);
      if (turn)
      {
        direction_vector[0] = math.abs(turn._values[0]) < 0.01 ? 0 : turn._values[0];
        direction_vector[1] = math.abs(turn._values[1]) < 0.01 ? 0 : turn._values[1];
        view_plane[0] = math.abs(turn._values[2]) < 0.001 ? 0 : turn._values[2];
        view_plane[1] = math.abs(turn._values[3]) < 0.001 ? 0 : turn._values[3];
      }
    }
  };

  let _render_fn = () =>
  {
    for (let r = 0; r < resolution; r++)
    {
      let x = r * stripe_width;
      let z_buffer = draw_buffer[r];
      for (let z = 15; z >= 0; z--)
      {
        if (z_buffer[z][3] === 0)
          continue;

        let wall = z_buffer[z];

        if (wall[3] === 1)
        {
          let u0 = wall_texture._u0 + wall[2] * u_step;
          let u1 = u0 + u_step;
          gl_push_textured_quad(wall_texture._atlas, x, wall[0], stripe_width, wall[1] - wall[0], u0, wall_texture._v0, u1, wall_texture._v1);
        }
        else if (wall[3] === 2)
        {
          let u0 = window_texture._u0 + wall[2] * u_step;
          let u1 = u0 + u_step;
          gl_push_textured_quad(window_texture._atlas, x, wall[0], stripe_width, wall[1] - wall[0], u0, window_texture._v0, u1, window_texture._v1);
        }

        push_quad(x, wall[1], stripe_width, camera_height, 0xFF4D494D); // 4d494d
        push_quad(x, 0, stripe_width, wall[0], 0xFF1c0c14); // 140c1c
      }
    }
    push_text(`x:${direction_vector[0].toFixed(2)} y: ${direction_vector[1].toFixed(2)}`, 0, 48, { _font: Font_Small });
    push_text(`x:${player_position[0].toFixed(2)} y: ${player_position[1].toFixed(2)}`, 0, 58, { _font: Font_Small });
    push_text(`x:${view_plane[0].toFixed(2)} y: ${view_plane[1].toFixed(2)}`, 0, 68, { _font: Font_Small });
  };

  export let _scene_id = get_next_scene_id();
  export let _scene: Scene = { _scene_id, _setup_fn, _reset_fn, _update_fn, _render_fn };
};