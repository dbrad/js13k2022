import { ParticleParameters } from "./particle-system";

export let fire_particle: ParticleParameters = {
  _position: [0, 0],
  _velocity: [0, -45],
  _velocity_variation: [15, 40],
  _size_begin: 0.35,
  _size_end: 0,
  _size_variation: 0.5,
  _colour_begin: [120, 170, 220, 1],
  _colour_end: [255, 255, 255, 0.25],
  _lifetime: 500
};

export let spirit_particle: ParticleParameters = {
  _position: [0, 0],
  _velocity: [0, 0],
  _velocity_variation: [30, 30],
  _size_begin: 1,
  _size_end: 0.1,
  _size_variation: 0.5,
  _colour_begin: [255, 255, 255, 1],
  _colour_end: [200, 200, 200, 0.25],
  _lifetime: 1500
};