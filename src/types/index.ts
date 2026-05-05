export interface Item {
  id: string;
  url: string;
}

export interface Tier {
  id: string;
  label: string;
  color: string;
  itemIds: string[];
}

export interface TierListData {
  tiers: Tier[];
  items: Record<string, Item>;
  unrankedItemIds: string[];
}
