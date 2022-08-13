import { V4 } from "@math/vector";

export let abgr_number_to_abgr_v4 = (abgr: number): V4 =>
{
  abgr >>>= 0;
  let r: number = abgr & 0xFF;
  let g: number = (abgr & 0xFF00) >>> 8;
  let b: number = (abgr & 0xFF0000) >>> 16;
  let a: number = ((abgr & 0xFF000000) >>> 24);
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
  let r: number = abgr & 0xFF;
  let g: number = (abgr & 0xFF00) >>> 8;
  let b: number = (abgr & 0xFF0000) >>> 16;
  let a: number = ((abgr & 0xFF000000) >>> 24);
  return [r, g, b, a / 255];
};