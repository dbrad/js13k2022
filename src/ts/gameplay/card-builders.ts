import { Card, Effect } from "@root/game-state";

export let skeleton = (): Card =>
{
  return [
    "skeleton",
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
    "zombie",
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
    "spirit",
    2,
    0,
    3,
    0,
    []
  ];
};

export let buff = (name: string, effects: Effect[]): Card =>
{
  return [
    name,
    3,
    0,
    0,
    0,
    effects
  ];
};

export let spell = (name: string, attack: number, effect: Effect): Card =>
{
  return [
    name,
    4,
    0,
    attack,
    0,
    [effect]
  ];
};