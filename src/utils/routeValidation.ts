export type Point = {
  x: number;
  y: number;
};

export const doSegmentsIntersect = (
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
): boolean => {
  const denominator =
    (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  if (Math.abs(denominator) < 0.0001) {
    return false;
  }

  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
    denominator;
  const ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
    denominator;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
};

export const pathCrossesItself = (path: Point[]): boolean => {
  if (path.length < 20) return false;

  const currentSegmentStart = path.length - 2;
  const currentSegmentEnd = path.length - 1;

  for (let i = 0; i < path.length - 15; i++) {
    if (
      doSegmentsIntersect(
        path[currentSegmentStart],
        path[currentSegmentEnd],
        path[i],
        path[i + 1],
      )
    ) {
      return true;
    }
  }

  return false;
};

export const pointsToSvgPath = (points: Point[]): string => {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return rest.reduce(
    (acc, point) => `${acc} L ${point.x} ${point.y}`,
    `M ${first.x} ${first.y}`,
  );
};
