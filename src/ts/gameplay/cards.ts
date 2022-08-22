import { Card } from "@root/game-state";
import { buff, minion, spell } from "./card-builders";
import { build_attack_modifier, build_barbs, build_defense_modifier, build_heal, build_weaken } from "./effects";

export let card_list: Card[] = [
  minion(0, 0),
  minion(1, 0),
  minion(2, 0),
  minion(0, 1),
  minion(1, 1),
  minion(2, 1),
  spell("bone throw", 3),
  spell("bite", 2, [build_heal(1)]),
  spell("haunt", 2, [build_weaken(1)]),
  minion(0, 2),
  minion(1, 2),
  minion(2, 2),
  spell("death coil", 1, [build_heal(2)]),
  spell("bone barbs", 0, [build_barbs(2)]),
  spell("unyielding", 0, [build_heal(3)]),
  spell("curse", 0, [build_weaken(3)]),
  buff("necrotic\npower", [build_attack_modifier(1), build_defense_modifier(-1)]),
  buff("necrotic\nvigor", [build_attack_modifier(-1), build_defense_modifier(1)]),
  minion(0, 3),
  minion(1, 3),
  minion(2, 3),
  spell("consume\nlife", 3, [build_heal(3)]),
  buff("the bone\nzone", [build_attack_modifier(3), build_defense_modifier(-1)]),
  buff("wall of\nflesh", [build_attack_modifier(-1), build_defense_modifier(3)]),
  buff("haunting\nhour", [build_attack_modifier(2)]),
];