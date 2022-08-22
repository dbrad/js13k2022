import { V2 } from "@math/vector";
import { Card, Effect } from "@root/game-state";
import { unit_name_map } from "@root/nodes/unit";

let unit_base_stats: V2[] = [
  [2, 1],
  [1, 2],
  [3, 0]
];

export let minion = (type: number, level: number = 0): Card =>
{
  let stats = unit_base_stats[type];
  return [
    unit_name_map[type],
    type,
    level,
    stats[0] + (level * stats[0]),
    stats[1] + (level * stats[1]),
    []
  ];
};

export let buff = (name: string, effects: Effect[] = []): Card =>
  [
    name,
    3,
    0,
    0,
    0,
    effects
  ];

export let spell = (name: string, attack: number, effects: Effect[] = []): Card =>
  [
    name,
    4,
    0,
    attack,
    0,
    effects
  ];