/** Gộp các class Tailwind, bỏ giá trị rỗng/false. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
