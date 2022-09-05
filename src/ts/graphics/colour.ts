import { V4 } from "@math/vector";

export let abgr_number_to_abgr_v4 = (abgr: number): V4 =>
{
  abgr >>>= 0;
  let r: number = abgr & 0xff;
  let g: number = (abgr & 0xff00) >>> 8;
  let b: number = (abgr & 0xff0000) >>> 16;
  let a: number = ((abgr & 0xff000000) >>> 24);
  return [a, b, g, r];
};

export let abgr_v4_to_abgr_number = (abgr: V4): number =>
{
  let out: number = 0x0;
  out = ((out | (abgr[0] & 0xff)) << 8) >>> 0;
  out = ((out | (abgr[1] & 0xff)) << 8) >>> 0;
  out = ((out | (abgr[2] & 0xff)) << 8) >>> 0;
  out = ((out | (abgr[3] & 0xff))) >>> 0;
  return out;
};

export let rgba_to_abgr_number = (red: number, green: number, blue: number, alpha: number): number =>
{
  let out: number = 0x0;
  out = ((out | ((alpha * 255) & 0xff)) << 8) >>> 0;
  out = ((out | (blue & 0xff)) << 8) >>> 0;
  out = ((out | (green & 0xff)) << 8) >>> 0;
  out = ((out | (red & 0xff))) >>> 0;
  return out;
};

export let rgba_v4_to_abgr_number = (colour: V4): number =>
{
  let out: number = 0x0;
  out = ((out | ((colour[3] * 255) & 0xff)) << 8) >>> 0;
  out = ((out | (colour[2] & 0xff)) << 8) >>> 0;
  out = ((out | (colour[1] & 0xff)) << 8) >>> 0;
  out = ((out | (colour[0] & 0xff))) >>> 0;
  return out;
};

export let abgr_number_to_rgba_v4 = (abgr: number): V4 =>
{
  abgr >>>= 0;
  let r: number = abgr & 0xff;
  let g: number = (abgr & 0xff00) >>> 8;
  let b: number = (abgr & 0xff0000) >>> 16;
  let a: number = ((abgr & 0xff000000) >>> 24);
  return [r, g, b, a / 255];
};

export const WHITE = 0xffffffff;
export const BLACK = 0xff000000;
export const BLACK_T99 = rgba_to_abgr_number(0, 0, 0, 0.99);
export const BLACK_T75 = rgba_to_abgr_number(0, 0, 0, 0.75);
export const BLACK_T50 = rgba_to_abgr_number(0, 0, 0, 0.50);
export const BLACK_T25 = rgba_to_abgr_number(0, 0, 0, 0.25);
export const FLOOR_COLOUR = 0xff2a1f1c;
export const DARK_GREY = 0xff2d2d2d;
export const LIGHT_GREY = 0xff555555;
export const RED = 0xff0000ff;
export const GREEN = 0xff00ff00;
export const YELLOW = 0xff00ffff;