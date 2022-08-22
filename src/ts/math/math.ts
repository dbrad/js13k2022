import { V2, V4 } from "./vector";

export let is_point_in_rect = (point: V2, rect: V4): boolean =>
{
  return point[0] >= rect[0] && point[0] < rect[0] + rect[2] && point[1] >= rect[1] && point[1] < rect[1] + rect[3]
    ;
};

export let is_point_in_circle = (point: V2, center: V2, radius: number): boolean =>
{
  return (((point[0] - center[0]) * (point[0] - center[0]) + (point[1] - center[1]) * (point[1] - center[1])) < radius * radius);
};

export let math = Math;
export let random_int = (min: number, max: number): number =>
{
  return math.floor(math.random() * (max - min + 1)) + min;
};

export let random_float = (min: number, max: number): number =>
{
  return math.random() * (max - min + 1) + min;
};

export let shuffle = <T>(array: T[]): T[] =>
{
  let current_index: number = array.length, temporary_value: T, random_index: number;
  let arr: T[] = array.slice();
  while (0 !== current_index)
  {
    random_index = math.floor(math.random() * current_index);
    current_index -= 1;
    temporary_value = arr[current_index];
    arr[current_index] = arr[random_index];
    arr[random_index] = temporary_value;
  }
  return arr;
};

export let safe_subtract = (base: number, value: number): number => math.max(0, base - value);
export let safe_add = (max: number, base: number, value: number): number => math.min(max, base + value);

export let number_sort = (a: number, b: number) => a - b;