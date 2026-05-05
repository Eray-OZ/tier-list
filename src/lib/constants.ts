import { Tier } from "@/types";
import { v4 as uuidv4 } from "uuid";

export const DEFAULT_TIERS: Tier[] = [
  { id: uuidv4(), label: "S", color: "#ff7f7f", itemIds: [] },
  { id: uuidv4(), label: "A", color: "#ffbf7f", itemIds: [] },
  { id: uuidv4(), label: "B", color: "#ffff7f", itemIds: [] },
  { id: uuidv4(), label: "C", color: "#7fff7f", itemIds: [] },
  { id: uuidv4(), label: "D", color: "#7fbfff", itemIds: [] },
  { id: uuidv4(), label: "F", color: "#7f7fff", itemIds: [] },
];
