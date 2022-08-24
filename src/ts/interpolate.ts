export let lerp = (target: number, origin: number, amount: number): number =>
{
  amount = amount < 0 ? 0 : amount;
  amount = amount > 1 ? 1 : amount;
  return target + (origin - target) * amount;
};