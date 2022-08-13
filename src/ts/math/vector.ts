export type V2 = [number, number];
export type V3 = [number, number, number];
export type V4 = [number, number, number, number];

export let set_V2 = (target: V2, x: number, y: number): void =>
{
  target[0] = x;
  target[1] = y;
};

export let add_V2 = (target: V2, x: number, y: number): void =>
{
  target[0] += x;
  target[1] += y;
};

export let subtract_V2 = (target: V2, x: number, y: number): void =>
{
  target[0] -= x;
  target[1] -= y;
};

export let set_V3 = (target: V3, source: V3): void =>
{
  target[0] = source[0];
  target[1] = source[1];
  target[2] = source[2];
};

export let set_V4 = (target: V4, x: number, y: number, z: number, w: number): void =>
{
  target[0] = x;
  target[1] = y;
  target[2] = z;
  target[3] = w;
};