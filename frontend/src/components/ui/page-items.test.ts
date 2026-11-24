import { describe, expect, it } from 'vitest';
import { getPageItems } from './page-items';

describe('getPageItems', () => {
  it('không có trang nào', () => {
    expect(getPageItems(1, 0)).toEqual([]);
  });

  it('chỉ một trang', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
  });

  it('ít trang thì hiện hết', () => {
    expect(getPageItems(2, 3)).toEqual([1, 2, 3]);
  });

  it('đầu danh sách nhiều trang', () => {
    expect(getPageItems(1, 10)).toEqual([1, 2, 'ellipsis-end', 10]);
  });

  it('giữa danh sách', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 10]);
  });

  it('cuối danh sách', () => {
    expect(getPageItems(10, 10)).toEqual([1, 'ellipsis-start', 9, 10]);
  });
});
