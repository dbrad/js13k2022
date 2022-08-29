import { assert } from "@debug/assert";
import { rgba_to_abgr_number } from "@graphics/colour";
import { push_textured_quad } from "@graphics/quad";
import { add_V2, set_V2, set_V4, V2, V4 } from "@math/vector";
import { lerp } from "@root/interpolate";
import { gl_restore, gl_save, gl_scale, gl_translate } from "gl";
import { math } from "math";

type Particle = {
  _position: V2;
  _velocity: V2;

  _size_begin: number,
  _size_end: number,

  _colour_begin: V4,
  _colour_end: V4,

  _lifetime: number,
  _lifetime_remaining: number;

  _active: boolean,
};

export type ParticleParameters = {
  _position: V2;
  _velocity: V2;
  _velocity_variation: V2,

  _size_begin: number,
  _size_end: number,
  _size_variation: number,

  _colour_begin: V4,
  _colour_end: V4,

  _lifetime?: number;
};

let particle_pool: Particle[] = [];
let particle_pool_size: number = 5000;
let particle_pool_index = 4999;

export let initialize_particle_system = (): void =>
{
  for (let i = particle_pool_size - 1; i >= 0; --i)
  {
    particle_pool[i] = {
      _active: false,
      _position: [0, 0],
      _velocity: [0, 0],
      _size_begin: 0,
      _size_end: 0,
      _colour_begin: [255, 255, 255, 1],
      _colour_end: [255, 255, 255, 1],
      _lifetime: 0,
      _lifetime_remaining: 0
    };
  }
};

export let update_particle_system = (now: number, delta: number): void =>
{
  let delta_in_seconds = (delta / 1000);
  for (let i = 0; i < particle_pool_size; i++)
  {
    let particle = particle_pool[i];
    if (!particle._active)
      continue;

    if (particle._lifetime_remaining <= 0)
    {
      particle._active = false;
      continue;
    }

    particle._lifetime_remaining -= delta;
    add_V2(particle._position, particle._velocity[0] * delta_in_seconds, particle._velocity[1] * delta_in_seconds);
  }
};

export let clear_particle_system = (): void =>
{
  for (let i = 0; i < particle_pool_size; i++)
  {
    let particle = particle_pool[i];
    if (!particle._active)
      continue;
    particle._active = false;
  }
};

export let render_particle_system = () =>
{
  for (let i = 0; i < particle_pool_size; i++)
  {
    let particle = particle_pool[i];
    if (!particle._active)
      continue;

    let life_progress = particle._lifetime_remaining / particle._lifetime;

    let colour_begin = particle._colour_begin;
    let colour_end = particle._colour_end;

    let red = lerp(colour_end[0], colour_begin[0], life_progress);
    let green = lerp(colour_end[1], colour_begin[1], life_progress);
    let blue = lerp(colour_end[2], colour_begin[2], life_progress);
    let alpha = lerp(colour_end[3], colour_begin[3], life_progress);

    let size = lerp(particle._size_end, particle._size_begin, life_progress);
    let halfSize = math.floor(16 * size / 2);

    gl_save();
    gl_translate(-halfSize, -halfSize);
    gl_translate(math.floor(particle._position[0]), math.floor(particle._position[1]));
    gl_scale(size, size);
    push_textured_quad(TEXTURE_WHITE_CIRCLE, 0, 0, { _colour: rgba_to_abgr_number(red, green, blue, alpha) });
    gl_restore();
  }
};

export let emit_particle = (particle_params: ParticleParameters): void =>
{
  let particle = particle_pool[particle_pool_index];

  assert(particle !== undefined, `index ${particle_pool_index} is undefined in the pool`);
  assert(particle._active === false, "pool too small, attempted to use active particle");

  particle._active = true;

  set_V2(particle._position, ...particle_params._position);

  set_V2(particle._velocity, particle_params._velocity[0] + particle_params._velocity_variation[0] * (math.random() - 0.5), particle_params._velocity[1] + particle_params._velocity_variation[1] * (math.random() - 0.5));

  set_V4(particle._colour_begin, ...particle_params._colour_begin);

  set_V4(particle._colour_end, ...particle_params._colour_end);

  particle._lifetime = particle_params._lifetime ?? 1000;
  particle._lifetime_remaining = particle._lifetime;

  particle._size_begin = particle_params._size_begin + particle_params._size_variation * (math.random() - 0.5);
  particle._size_end = particle_params._size_end;

  --particle_pool_index;
  if (particle_pool_index < 0)
    particle_pool_index = particle_pool_size - 1;
};

export let emit_particles = (particle_params: ParticleParameters, count: number): void =>
{
  for (let i = 0; i < count; i++)
    emit_particle(particle_params);
};