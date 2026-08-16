import { HISTORY_ROWS_1 } from "./historyRows1";
import { HISTORY_ROWS_2 } from "./historyRows2";
import { HISTORY_ROWS_3 } from "./historyRows3";
import { HISTORY_ROWS_4 } from "./historyRows4";
import { HISTORY_ROWS_5 } from "./historyRows5";

export type HistoricalProduct = {
  restaurantId: string; id: string; name: string; category: string; description: string;
  customerQuantity: number; billedLineQuantity: number; billedRate: number; billedAmount: number;
  invoiceNo?: string | null; invoiceDate?: string | null; size: string; sides: number;
};

const ROWS = [...HISTORY_ROWS_1, ...HISTORY_ROWS_2, ...HISTORY_ROWS_3, ...HISTORY_ROWS_4, ...HISTORY_ROWS_5] as const;
export const HISTORICAL_PRODUCTS: HistoricalProduct[] = ROWS.map((r) => ({
  restaurantId:r[0], id:r[1], name:r[2], category:r[3], description:r[4], customerQuantity:r[5],
  billedLineQuantity:r[6], billedRate:r[7], billedAmount:r[8], invoiceNo:r[9], invoiceDate:r[10],
  size:r[11], sides:r[12]
}));
export function historicalProductsForRestaurant(restaurantId: string) {
  return HISTORICAL_PRODUCTS.filter((p) => p.restaurantId === restaurantId);
}
