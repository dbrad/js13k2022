
export let is_point_in_rect = (x0: number, y0: number, x1: number, y1: number, w: number, h: number): boolean =>
{
  return x0 >= x1 && x0 < x1 + w && y0 >= y1 && y0 < y1 + h;
};

export let is_point_in_circle = (x0: number, y0: number, x1: number, y1: number, radius: number): boolean =>
{
  return (((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1)) < radius * radius);
};

export let math = Math;
export let floor = math.floor;
export let ceil = math.ceil;
export let max = math.max;

export let random_int = (min: number, max: number): number =>
{
  return floor(math.random() * (max - min + 1)) + min;
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
    random_index = floor(math.random() * current_index);
    current_index -= 1;
    temporary_value = arr[current_index];
    arr[current_index] = arr[random_index];
    arr[random_index] = temporary_value;
  }
  return arr;
};

export let safe_subtract = (base: number, value: number = 1): number => max(0, base - value);
export let safe_add = (max: number, base: number, value: number = 1): number => math.min(max, base + value);

export let number_sort = (a: number, b: number) => a - b;