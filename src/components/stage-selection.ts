// Selection maths for the work stage. No React here so tests can import it directly.

export const wrapIndex = (index: number, count: number) => ((index % count) + count) % count;

// Cards keep their circular order: the selected card sits at 0, its neighbours at -1 and 1.
// With three cards every card is always either the centre or one of the two sides.
export function cardPosition(index: number, selected: number, count: number) {
  const offset = wrapIndex(index - selected, count);
  return offset > count / 2 ? offset - count : offset;
}

export function keyTarget(key: string, selected: number, count: number): number | null {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return wrapIndex(selected + 1, count);
    case "ArrowLeft":
    case "ArrowUp":
      return wrapIndex(selected - 1, count);
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

export const swipeThreshold = 48;

// A mostly horizontal drag longer than the threshold moves one card in the drag direction.
export function swipeTarget(dx: number, dy: number, selected: number, count: number): number | null {
  if (Math.abs(dx) < swipeThreshold || Math.abs(dx) <= Math.abs(dy)) return null;
  return wrapIndex(selected + (dx < 0 ? 1 : -1), count);
}
