const SORT_BY_X = (p1: Point, p2: Point) => {
  if (p1.x < p2.x) return -1;
  if (p1.x > p2.x) return 1;
  return 0;
};

const SORT_BY_Y = (p1: Point, p2: Point) => {
  if (p1.y < p2.y) return -1;
  if (p1.y > p2.y) return 1;
  return 0;
};

const ROUND_PRECISION = 4;
const EPSILON = 0.00001;
const MAX_SLOPE = 9999;

function truncateToThreeDecimals(value: number): number {
  const factor = 10000; // 10^3 to shift the decimal point three places
  return Math.trunc(value * factor) / factor;
}

export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = truncateToThreeDecimals(x);
    this.y = truncateToThreeDecimals(y);
  }

  equals(p: Point): boolean {
    return this.x === p.x && this.y === p.y;
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }

  toLinePoint(): number[] {
    return [this.x, this.y];
  }
}

export class LineSegment {
  start: Point;
  end: Point;

  constructor(p1: Point, p2: Point) {
    // Sort for x and if x is same, sort for y
    if (p1.x < p2.x) {
      this.start = p1;
      this.end = p2;
    } else if (p1.x > p2.x) {
      this.end = p1;
      this.start = p2;
    } else {
      if (p1.y < p2.y) {
        this.start = p1;
        this.end = p2;
      } else {
        this.end = p1;
        this.start = p2;
      }
    }
  }

  equals(line: LineSegment): boolean {
    return this.start.equals(line.start) && this.end.equals(line.end);
  }

  toString(): string {
    return `${this.start.toString()} -> ${this.end.toString()}`;
  }
}

/**
 * Splits two line segments if they intersect into their smallest respective parts.
 *
 * @note
 * This function requires the segments to be sorted by X-axis (Or Y-axis if x equals) to work.
 * @param l1
 * @param l2
 * @returns A list of the split segments, undefined otherwise.
 */
function splitOnIntersect(
  l1: LineSegment,
  l2: LineSegment
): LineSegment[] | undefined {
  /* The conrol flow is meticulously plannded out and should not be changed! */

  if (l1.equals(l2)) return;
  /*
   * Disclaymore for future reference!
   * slope === NaN      -> Invalid line segment = it is a point
   * slope === 0        -> Horizontal line segment
   * slope === Infinity -> Vertical line segment
   * slope1 === slope2  -> line segments are parallel or overlap
   */
  let l1_slope = (l1.end.y - l1.start.y) / (l1.end.x - l1.start.x);
  let l2_slope = (l2.end.y - l2.start.y) / (l2.end.x - l2.start.x);
  //console.log(`l1 = ${l1_slope} l2 = ${l2_slope} diff = ${l1_slope - l2_slope}`)

  /* At least one of the segments is a point, i.o invalid */
  if (Number.isNaN(l1_slope) || Number.isNaN(l2_slope)) return;
  if (Math.abs(l1_slope) < EPSILON) l1_slope = 0;
  if (Math.abs(l1_slope) > MAX_SLOPE) l1_slope = Infinity;
  if (Math.abs(l2_slope) < EPSILON) l2_slope = 0;
  if (Math.abs(l2_slope) > MAX_SLOPE) l2_slope = Infinity;
  //console.log(`l1 = ${l1_slope} l2 = ${l2_slope} diff = ${l1_slope - l2_slope}`)

  /* Lines are parallel or overlap */
  if (l1_slope === l2_slope || Math.abs(l1_slope - l2_slope) < EPSILON) {
    if (l1_slope === 0) {
      if (l1.start.y !== l2.start.y) return;
      if (l1.end.x <= l2.start.x || l1.start.x <= l2.end.x) return;
      const res: LineSegment[] = [];
      const points: Point[] = [l1.start, l1.end];
      if (!l2.start.equals(l1.start) && !l2.start.equals(l1.end))
        points.push(l2.start);
      if (!l2.end.equals(l1.start) && !l2.end.equals(l1.end))
        points.push(l2.end);
      points.sort(SORT_BY_X);
      for (let i = 0; i < points.length - 1; i++) {
        res.push(new LineSegment(points[i], points[i + 1]));
      }
      return res;
    }
    if (l1_slope === Infinity) {
      if (l1.start.x !== l2.start.x) return;
      if (l1.end.y <= l2.start.y || l2.end.y <= l1.start.y) return;
      const res: LineSegment[] = [];
      const points: Point[] = [l1.start, l1.end];
      if (!l2.start.equals(l1.start) && !l2.start.equals(l1.end))
        points.push(l2.start);
      if (!l2.end.equals(l1.start) && !l2.end.equals(l1.end))
        points.push(l2.end);
      points.sort(SORT_BY_Y);
      for (let i = 0; i < points.length - 1; i++) {
        res.push(new LineSegment(points[i], points[i + 1]));
      }
      return res;
    }
    if (l2.start.x < l1.start.x) {
      const temp = l1;
      l1 = l2;
      l2 = temp;
      const temp_slope = l1_slope;
      l1_slope = l2_slope;
      l2_slope = temp_slope;
    }

    /* Test l2.start */
    let lambdaX = (l2.start.x - l1.start.x) / (l1.end.x - l1.start.x);
    let lambdaY = (l2.start.y - l1.start.y) / (l1.end.y - l1.start.y);

    if (Math.abs(lambdaX - lambdaY) > EPSILON) {
      return;
    }
    if (lambdaX >= 1 || lambdaX <= 0) {
      lambdaX = (l2.end.x - l1.start.x) / (l1.end.x - l1.start.x);
      lambdaY = (l2.end.y - l1.start.y) / (l1.end.y - l1.start.y);
      if (lambdaX >= 1 || lambdaX <= 0) {
        return;
      }
    }

    /* Since we know that lines intersect, we just take all points, remove duplicates and connect them in sorted order */
    const res: LineSegment[] = [];
    const points: Point[] = [l1.start, l1.end];
    if (!l2.start.equals(l1.start) && !l2.start.equals(l1.end))
      points.push(l2.start);
    if (!l2.end.equals(l1.start) && !l2.end.equals(l1.end)) points.push(l2.end);
    points.sort(SORT_BY_X);
    for (let i = 0; i < points.length - 1; i++) {
      res.push(new LineSegment(points[i], points[i + 1]));
    }
    //console.log(res)

    return res;
  }

  /* Check if the line segments have same start or end points.
   * This is a valid interesction but we dont need to split anything. */
  if (
    l1.start.equals(l2.start) ||
    l1.start.equals(l2.end) ||
    l1.end.equals(l2.start) ||
    l1.end.equals(l2.end)
  ) {
    return;
  }

  /* Sorting here avoids having to handle the edge cases for l2 as well. */
  if (l2_slope === Infinity || l2_slope === 0) {
    const temp = l1;
    l1 = l2;
    l2 = temp;
    const temp_slope = l1_slope;
    l1_slope = l2_slope;
    l2_slope = temp_slope;
  }

  if (l1_slope === 0) {
    if (l2_slope === Infinity) {
      if (
        l2.start.x >= l1.start.x &&
        l2.start.x <= l1.end.x &&
        l1.start.y >= l2.start.y &&
        l1.start.y <= l2.end.y
      ) {
        const intersection = new Point(l2.start.x, l1.start.y);
        return splitLines(l1, l2, intersection);
      }
      /* The lines dont intersect */
      return;
    }

    // @todo: Check if lines segments are disjunct
    const b2 = l2.start.y - l2_slope * l2.start.x;
    const x2 = (l1.start.y - b2) / l2_slope;
    const intersection = new Point(x2, l1.start.y);
    if (intersection.x <= l1.start.x || intersection.x >= l1.end.x) return;
    const lambda = (intersection.x - l2.start.x) / (l2.end.x - l2.start.x);
    /* Intersection is not in line segment */
    if (lambda < 0 || lambda > 1) return;

    //console.log(`l1 = 0 l2 = ${l2_slope - Number.MAX_VALUE}`)
    return splitLines(l1, l2, intersection);
  }

  if (l1_slope === Infinity) {
    if (l2_slope === 0) {
      if (
        l1.start.x >= l2.start.x &&
        l1.start.x <= l2.end.x &&
        l2.start.y >= l1.start.y &&
        l2.start.y <= l1.end.y
      ) {
        const intersection = new Point(l1.start.x, l2.start.y);
        return splitLines(l1, l2, intersection);
      }
      /* The lines dont intersect */
      return;
    }

    // @todo: Check if lines segments are disjunct
    const b2 = l2.start.y - l2_slope * l2.start.x;
    const y2 = l2_slope * l1.start.x + b2;
    const intersection = new Point(l1.start.x, y2);
    if (intersection.y < l1.start.y || intersection.y > l1.end.y) return;
    const lambda = (intersection.x - l2.start.x) / (l2.end.x - l2.start.x);
    /* Test if intersection is in line segment */
    if (lambda < 0 || lambda > 1) return;

    //console.log(`l1 = infinty l2 = ${l2.start.y}, ${l2.end.y}`)
    return splitLines(l1, l2, intersection);
  }

  /* Regular case here */
  const b1 = l1.start.y - l1_slope * l1.start.x;
  const b2 = l2.start.y - l2_slope * l2.start.x;
  const x = (b2 - b1) / (l1_slope - l2_slope);
  const y = l1_slope * x + b1;
  const intersection = new Point(x, y);
  let lambdaX = (intersection.x - l2.start.x) / (l2.end.x - l2.start.x);
  let lambdaY = (intersection.y - l2.start.y) / (l2.end.y - l2.start.y);
  if (Math.abs(lambdaX - lambdaY) > EPSILON) return;
  /* Test if intersection is in line segment */
  if (lambdaX < 0 || lambdaY > 1) return;

  lambdaX = (intersection.x - l1.start.x) / (l1.end.x - l1.start.x);
  lambdaY = (intersection.y - l1.start.y) / (l1.end.y - l1.start.y);
  if (Math.abs(lambdaX - lambdaY) > EPSILON) return;
  /* Test if intersection is in line segment */
  if (lambdaX < 0 || lambdaY > 1) return;
  return splitLines(l1, l2, intersection);
}

/**
 *
 * @param l1 First line segment
 * @param l2 Second line segment
 * @param intersection Point on which both lines intersect
 * @returns List of new line segments
 * @warning This functino requires that the intersection point actually exists in both segments!
 */
function splitLines(
  l1: LineSegment,
  l2: LineSegment,
  intersection: Point
): LineSegment[] {
  /* Intersection is start or end point of line 1 -> we only split line 2 */
  if (intersection.equals(l1.start) || intersection.equals(l1.end)) {
    return [
      l1, // @todo: Decide wether to include the not split segment
      new LineSegment(l2.start, intersection),
      new LineSegment(l2.end, intersection),
    ];
  }
  /* Intersection is start or end point of line 2 -> we only split line 1 */
  if (intersection.equals(l2.start) || intersection.equals(l2.end)) {
    return [
      l2, // @todo: Decide wether to include the not split segment
      new LineSegment(l1.start, intersection),
      new LineSegment(l1.end, intersection),
    ];
  }

  /* Since we excluded both cases above, only case left is to split both lines */
  return [
    new LineSegment(l2.start, intersection),
    new LineSegment(l2.end, intersection),
    new LineSegment(l1.start, intersection),
    new LineSegment(l1.end, intersection),
  ];
}

// @todo: Find bug that increases size for ever.
// fix all bugs in intersect first
export function sweepLine(lines: number[]): number[] {
  const sortedSegments: LineSegment[] = [];
  let iterationCount = 0;
  const iterationLimit = 5000000;

  for (let i = 0; i < lines.length; i += 4) {
    sortedSegments.push(
      new LineSegment(
        new Point(lines[i], lines[i + 1]),
        new Point(lines[i + 2], lines[i + 3])
      )
    );
  }
  if (sortedSegments.length === 0) return [];

  sortedSegments.sort((l1: LineSegment, l2: LineSegment) => {
    if (l1.start.x < l2.start.x) return -1;
    if (l1.start.x > l2.start.x) return 1;
    return 0;
  });

  const activeSegments: Set<LineSegment> = new Set();
  const result: number[] = [];
  let sweepPos = sortedSegments[0].start.x;
  for (const segment of sortedSegments) {
    if (iterationCount > iterationLimit) {
      console.warn(`SweepLine: Ran over limit: ${iterationCount}`);
      break;
    }
    sweepPos = segment.start.x;
    let wasAdded = false;
    /* Remove all surpassed line segments */
    /*
        for (const activeSegment of activeSegments) {
            if (activeSegment.end.x < sweepPos) {
                activeSegments.delete(activeSegment);
                result.push(
                    activeSegment.start.x,
                    activeSegment.start.y,
                    activeSegment.end.x,
                    activeSegment.end.y
                );
            }
        }
        */

    let toRemove = [];
    for (const activeSegment of activeSegments) {
      if (activeSegment.end.x < sweepPos) {
        toRemove.push(activeSegment);
        result.push(
          activeSegment.start.x,
          activeSegment.start.y,
          activeSegment.end.x,
          activeSegment.end.y
        );
      }
    }
    console.log(`toRemove: ${toRemove.length}`);
    for (const segment of toRemove) {
      activeSegments.delete(segment);
    }

    const addQueue: LineSegment[] = [];
    const removeQueue: LineSegment[] = [];
    //console.log(activeSegments.size)
    for (const activeSegment of activeSegments) {
      iterationCount++;
      const split = splitOnIntersect(segment, activeSegment);
      if (!split) continue;
      removeQueue.push(activeSegment);
      split.forEach((s: LineSegment) => {
        addQueue.push(s);
      });
      wasAdded = true;
    }
    removeQueue.forEach((line: LineSegment) => {
      activeSegments.delete(line);
    });
    addQueue.forEach((line: LineSegment) => {
      activeSegments.add(line);
    });
    if (!wasAdded) activeSegments.add(segment);
  }
  console.log('res: ', result.length / 4)

  /* Add all leftovers */
  activeSegments.forEach((line: LineSegment) => {
    result.push(line.start.x, line.start.y, line.end.x, line.end.y);
  });
   console.log('res2: ', result.length / 4)

  return result;
}
