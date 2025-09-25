export interface KebabOrder {
  id: string;
  kebabType: string;
  size: string;
  sauce: string;
  meatType: string;
  customerName: string;
  date?: string;
}

export type KebabOrderData = Omit<KebabOrder, 'id'>;
