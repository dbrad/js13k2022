import { Card } from "@root/game-state";

export let skeleton = (): Card =>
{
  return [
    0,
    0,
    2,
    1,
    []
  ];
};

export let zombie = (): Card =>
{
  return [
    1,
    0,
    1,
    2,
    []
  ];
};

export let spirit = (): Card =>
{
  return [
    2,
    0,
    3,
    0,
    []
  ];
};