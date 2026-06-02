import { describe, it, expect } from 'vitest';
import { mergeSort } from './sort';

const numCmp = (a: number, b: number): number => a - b;
const numDesc = (a: number, b: number): number => b - a;

describe('mergeSort', () => {
  it('returns empty array unchanged', () => {
    expect(mergeSort([], numCmp)).toEqual([]);
  });

  it('returns single-element array unchanged', () => {
    expect(mergeSort([42], numCmp)).toEqual([42]);
  });

  it('sorts numbers ascending', () => {
    expect(mergeSort([3, 1, 4, 1, 5, 9, 2, 6], numCmp)).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
  });

  it('sorts numbers descending', () => {
    expect(mergeSort([3, 1, 4, 1, 5], numDesc)).toEqual([5, 4, 3, 1, 1]);
  });

  it('does not mutate the original array', () => {
    const original = [3, 1, 2];
    const sorted = mergeSort(original, numCmp);
    expect(original).toEqual([3, 1, 2]);
    expect(sorted).toEqual([1, 2, 3]);
  });

  it('handles already-sorted array', () => {
    expect(mergeSort([1, 2, 3, 4], numCmp)).toEqual([1, 2, 3, 4]);
  });

  it('handles reverse-sorted array', () => {
    expect(mergeSort([4, 3, 2, 1], numCmp)).toEqual([1, 2, 3, 4]);
  });

  it('sorts objects by a field', () => {
    const chats = [
      { id: 1, time: '2024-01-03' },
      { id: 2, time: '2024-01-01' },
      { id: 3, time: '2024-01-02' },
    ];
    const sorted = mergeSort(chats, (a, b) =>
      new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
    expect(sorted.map((c) => c.id)).toEqual([1, 3, 2]);
  });

  it('is stable: equal elements keep original relative order', () => {
    const items = [
      { val: 1, order: 0 },
      { val: 1, order: 1 },
      { val: 1, order: 2 },
    ];
    const sorted = mergeSort(items, (a, b) => a.val - b.val);
    expect(sorted.map((i) => i.order)).toEqual([0, 1, 2]);
  });
});
