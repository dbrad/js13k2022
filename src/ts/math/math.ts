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

export function shuffle<T>(array: T[]): T[]
{
  let currentIndex: number = array.length, temporaryValue: T, randomIndex: number;
  let arr: T[] = array.slice();
  while (0 !== currentIndex)
  {
    randomIndex = math.floor(math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = arr[currentIndex];
    arr[currentIndex] = arr[randomIndex];
    arr[randomIndex] = temporaryValue;
  }
  return arr;
}