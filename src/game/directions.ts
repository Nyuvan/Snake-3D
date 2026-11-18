import { CONFIG } from '../config';
import type { Cell, Dir } from './types';

export const DIR_LIST: readonly Dir[] = ['up', 'right', 'down', 'left'];

export const VECTORS: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

export function insideGrid(cell: Cell): boolean {
  return (
    cell.x >= 0 &&
    cell.y >= 0 &&
    cell.x < CONFIG.grid.width &&
    cell.y < CONFIG.grid.height
  );
}
