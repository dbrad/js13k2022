import { math } from "math";

export type EasingFn = (t: number) => number;

export let linear: EasingFn = (t: number) =>
{
  return t;
};

export let bounce: EasingFn = (t: number) =>
{
  if (t < (1 / 2.75))
    return (7.5625 * t * t);
  else if (t < (2 / 2.75))
    return (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
  else if (t < (2.5 / 2.75))
    return (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
  else
    return (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
};

export let ease_out_quad: EasingFn = (t: number) =>
{
  return t * (2 - t);
};

export let lerp = (target: number, origin: number, amount: number): number =>
{
  amount = amount < 0 ? 0 : amount;
  amount = amount > 1 ? 1 : amount;
  return target + (origin - target) * amount;
};

export type InterpolationData =
  {
    _start_time: number,
    _duration: number,
    _origin: number[],
    _target: number[],
    _values: number[],
    _callback: ((values: number[]) => void) | null,
    _easing: EasingFn,
    _active: boolean,
    _done: boolean;
  };

let interpolator_lookup: number[] = [];
let interpolator_pool: InterpolationData[] = [];
let interpolator_pool_size = 1000;
let interpolator_index = 0;

export let initialze_interpolation_system = () =>
{
  for (let i = 0; i < interpolator_pool_size; i++)
  {
    interpolator_lookup[i] = -1;

    interpolator_pool[i] = {
      _start_time: -1,
      _duration: 0,
      _origin: [0],
      _target: [0],
      _values: [0],
      _callback: null,
      _easing: linear,
      _active: false,
      _done: false,
    };
  }
};

export let add_interpolator = (interpolation_key: number, duration: number, origin: number[], destination: number[], callback: ((values: number[]) => void) | null = null, easing: EasingFn = linear): void =>
{
  interpolator_pool[interpolator_index] = {
    _start_time: -1,
    _duration: duration,
    _origin: [...origin],
    _target: [...destination],
    _values: [...origin],
    _callback: callback,
    _easing: easing,
    _active: true,
    _done: false,
  };
  interpolator_lookup[interpolation_key] = interpolator_index;
  interpolator_index = ++interpolator_index % interpolator_pool_size;
};

export let get_interpolation_data = (interpolation_key: number) =>
{
  let index = interpolator_lookup[interpolation_key];
  if (index === -1 || !interpolator_pool[index]._active)
    return null;
  else
    return interpolator_pool[index];
};

export let has_interpolation_data = (interpolation_key: number) =>
{
  let index = interpolator_lookup[interpolation_key];
  return index !== -1 && interpolator_pool[index]._active;
};

let values: number[] = [];
let len: number = 0;
let interpolate = (now: number, interpolation_data: InterpolationData): void =>
{
  if (interpolation_data._start_time === -1)
    interpolation_data._start_time = now;

  if (interpolation_data._done)
  {
    interpolation_data._active = false;
    return;
  }

  let elapsed = now - interpolation_data._start_time;
  if (elapsed >= interpolation_data._duration)
  {
    len = interpolation_data._values.length;
    for (let i = 0; i < len; i++)
      interpolation_data._values[i] = interpolation_data._target[i];

    interpolation_data._done = true;
    if (interpolator_data._callback)
      interpolator_data._callback(interpolation_data._values);

    return;
  }

  let p = interpolation_data._easing(elapsed / interpolation_data._duration);

  values.length = 0;
  len = interpolation_data._origin.length;
  for (let i = 0; i < len; i++)
    values[i] = interpolation_data._origin[i] + math.round(interpolation_data._target[i] - interpolation_data._origin[i]) * p;

  len = interpolation_data._values.length;
  for (let i = 0; i < len; i++)
    interpolation_data._values[i] = values[i];
};

let interpolator_data: InterpolationData;
export let update_interpolation_system = (now: number, delta: number) =>
{
  for (let i = 0; i < interpolator_pool_size; i++)
  {
    interpolator_data = interpolator_pool[i];
    if (!interpolator_data._active)
      continue;

    interpolate(now, interpolator_data);
  }
};