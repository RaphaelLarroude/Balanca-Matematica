export interface BlockData {
  id: string;
  expression: string;
  value: number; // Can be NaN if variable is missing
}

export type ZoneId = 'bench' | 'left' | 'right';

export interface DragItem {
  id: string;
  sourceZone: ZoneId;
}

export const ItemTypes = {
  BLOCK: 'block',
};