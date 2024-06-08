/* Constants */
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

/* Set through testing with various dxf files */
const EPSILON = 0.1;
const MAX_SLOPE = 9999;
/* This is a safety measure, to prevent infinit splitting */
const ITERATION_LIMIT = 10000000;

function truncate(value: number): number {
    const factor = 10000;
    return Math.trunc(value * factor) / factor;
}

/* Types */
export class Point {
    x: number;
    y: number;

    /**
     * Constructs a Point.
     * @note all values are truncated to a specific decimal because of floating point issues.
     */
    constructor(x: number, y: number) {
        this.x = truncate(x);
        this.y = truncate(y);
    }

    equals(p: Point): boolean {
        return this.x === p.x && this.y === p.y;
    }

    toString(): string {
        return `(${this.x}, ${this.y})`;
    }
}

export class UnorderdLineSegment {
    start: Point;
    end: Point;

    constructor(p1: Point, p2: Point) {
        this.start = p1;
        this.end = p2;
    }
}

/**
 * LineSegment with internal storage for intersection points.
 *
 * @note start and end point are sorted for start.x < end.x or y if x === x.
 * This is necessary for the sweepLine algorithm to work.
 */
export class LineSegment {
    start: Point;
    end: Point;
    intersections: UniquePoints = new UniquePoints();

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

    /**
     * Reads from the internal intersection points and constructs a list of the
     * smalles possible segments.
     *
     * @returns A list of of smalles possible segments.
     */
    getSmallestLines(): LineSegment[] {
        if (this.intersections.points.length === 0) return [this];
        const res: LineSegment[] = [];
        let lastPoint = this.start;
        this.intersections.points.forEach((p) => {
            res.push(new LineSegment(lastPoint, p));
            lastPoint = p;
        });
        res.push(new LineSegment(lastPoint, this.end));
        return res;
    }

    equals(line: LineSegment): boolean {
        return this.start.equals(line.start) && this.end.equals(line.end);
    }

    toString(): string {
        return `${this.start.toString()} -> ${this.end.toString()}`;
    }
}

/**
 * List of unique points in sorted order, behaving like a in-place binary search tree.
 */
export class UniquePoints {
    points: Point[] = [];

    add(p: Point) {
        if (this.points.length === 0) {
            this.points.push(p);
            return;
        }

        let lower = 0;
        let upper = this.points.length - 1;
        let middle = 0;

        while (lower <= upper) {
            middle = Math.floor((upper + lower) / 2);
            const currentPoint = this.points[middle];

            if (currentPoint.equals(p)) {
                return; // Point already exists, do not add
            }

            if (currentPoint.x < p.x || (currentPoint.x === p.x && currentPoint.y < p.y)) {
                lower = middle + 1;
            } else {
                upper = middle - 1;
            }
        }

        // Insert the point in the correct position
        this.points.splice(lower, 0, p);
    }

    /**
     * The `getPointsSortedByY` method returns a new array of points sorted by their y values.
     * If two points have the same y value, they are sorted by their x values.
     * @returns {Point[]} - An array of points sorted by their y values.
     */
    getPointsSortedByY(): Point[] {
        return [...this.points].sort((a, b) => {
            if (a.y < b.y) {
                return -1;
            }
            if (a.y > b.y) {
                return 1;
            }
            // If y values are equal, sort by x
            if (a.x < b.x) {
                return -1;
            }
            if (a.x > b.x) {
                return 1;
            }
            return 0;
        });
    }

    indexOf(p: Point): number {
        let lower = 0;
        let upper = this.points.length - 1;
        let middle = 0;

        while (lower <= upper) {
            middle = Math.floor((upper + lower) / 2);
            const currentPoint = this.points[middle];

            if (currentPoint.equals(p)) {
                return middle;
            }

            if (currentPoint.x < p.x || (currentPoint.x === p.x && currentPoint.y < p.y)) {
                lower = middle + 1;
            } else {
                upper = middle - 1;
            }
        }

        return -1; // Point not found
    }
}

/**
 * List of unique LineSegments in sorted order, behaving like a in-place binary search tree.
 */
class UniqueLineSegments {
    segments: LineSegment[] = [];

    add(s: LineSegment) {
        if (this.segments.length === 0) {
            this.segments.push(s);
            return;
        }

        let lower = 0;
        let upper = this.segments.length - 1;
        let middle = 0;

        while (lower <= upper) {
            middle = Math.floor((upper + lower) / 2);
            const currentSegment = this.segments[middle];

            if (currentSegment.equals(s)) {
                return; // Segment already exists, do not add
            }

            if (
                currentSegment.start.x < s.start.x ||
                (currentSegment.start.x === s.start.x && currentSegment.start.y < s.start.y)
            ) {
                lower = middle + 1;
            } else {
                upper = middle - 1;
            }
        }

        // Insert the point in the correct position
        this.segments.splice(lower, 0, s);
    }

    indexOf(s: LineSegment): number {
        let lower = 0;
        let upper = this.segments.length - 1;
        let middle = 0;

        while (lower <= upper) {
            middle = Math.floor((upper + lower) / 2);
            const currentSegment = this.segments[middle];

            if (currentSegment.equals(s)) {
                return middle;
            }

            if (
                currentSegment.start.x < s.start.x ||
                (currentSegment.start.x === s.start.x && currentSegment.start.y < s.start.y)
            ) {
                lower = middle + 1;
            } else {
                upper = middle - 1;
            }
        }

        return -1; // LineSegment not found
    }
}

/**
 * List of unique Numbers in sorted order, behaving like a in-place binary search tree.
 * @note Use Set<number> instead, if order is irrelevant.
 */
export class UniqueNumber {
    points: number[] = [];

    add(p: number) {
        if (this.points.length === 0) {
            this.points.push(p);
            return;
        }

        let lower = 0;
        let upper = this.points.length - 1;
        let middle = 0;

        while (lower <= upper) {
            middle = Math.floor((upper + lower) / 2);
            const currentPoint = this.points[middle];

            if (currentPoint === p) {
                return; // Point already exists, do not add
            }

            if (currentPoint < p) {
                lower = middle + 1;
            } else {
                upper = middle - 1;
            }
        }

        // Insert the point in the correct position
        this.points.splice(lower, 0, p);
    }

    indexOf(p: number): number {
        let lower = 0;
        let upper = this.points.length - 1;
        let middle = 0;

        while (lower <= upper) {
            middle = Math.floor((upper + lower) / 2);
            const currentPoint = this.points[middle];

            if (currentPoint === p) {
                return middle;
            }

            if (currentPoint < p) {
                lower = middle + 1;
            } else {
                upper = middle - 1;
            }
        }

        return -1; // Point not found
    }

    /**
     * Splices off all numbers in a given range.
     * @param min Start of range.
     * @param max End of range.
     * @returns List of spliced numbers.
     */
    spliceRange(min: number, max: number): number[] {
        let lower = 0;
        let upper = this.points.length - 1;
        let left = 0;
        let right = this.points.length;

        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (this.points[mid] < min) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        lower = left;

        right = this.points.length;

        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (this.points[mid] <= max) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        upper = left;

        return this.points.splice(lower, upper - lower);
    }
}

/**
 * Splits two line segments, if they intersect, into their smallest respective parts.
 *
 * @note
 * This function requires the segments to be sorted by X-axis (Or Y-axis if x equals) to work.
 * If lines intersect, the intersection points are stored inside the LineSegments.
 * @param l1 First line to split.
 * @param l2 Second line to split.
 */
function splitOnIntersect(l1: LineSegment, l2: LineSegment) {
    /*
     * Disclaymore for future reference!
     *
     * !! The conrol flow is meticulously plannded out and should not be changed !!
     *
     * slope === NaN      -> Invalid line segment = it is a point
     * slope === 0        -> Horizontal line segment
     * slope === Infinity -> Vertical line segment
     * slope1 === slope2  -> line segments are parallel or overlap
     */
    let l1_slope = (l1.end.y - l1.start.y) / (l1.end.x - l1.start.x);
    let l2_slope = (l2.end.y - l2.start.y) / (l2.end.x - l2.start.x);

    /* At least one of the segments is a point, i.o invalid */
    if (Number.isNaN(l1_slope) || Number.isNaN(l2_slope)) return;

    /* DXF files often seem to have ~~almost~~ Vertical / Horizontal lines.
     * We need to normalize them to avoid getting weird results. */
    const absSlope = Math.abs(l1_slope);
    if (absSlope < EPSILON) l1_slope = 0;
    else if (absSlope > MAX_SLOPE) l1_slope = Infinity;

    const absSlope2 = Math.abs(l2_slope);
    if (absSlope2 < EPSILON) l2_slope = 0;
    else if (absSlope2 > MAX_SLOPE) l2_slope = Infinity;

    /* Lines are parallel or overlap */
    if (l1_slope === l2_slope || Math.abs(l1_slope - l2_slope) < EPSILON) {
        if (l1_slope === 0) {
            if (l1.start.y !== l2.start.y) return;
            if (l1.start.x > l2.end.x || l2.start.x > l1.end.x) return;
            const points: Point[] = [l1.start, l1.end];
            if (!l2.start.equals(l1.start) && !l2.start.equals(l1.end))
                points.push(l2.start);
            if (!l2.end.equals(l1.start) && !l2.end.equals(l1.end)) points.push(l2.end);
            if (points.length < 3) return;
            points.sort(SORT_BY_X);
            const min = points.shift()!;
            const max = points.pop()!;
            l1.start = min;
            l1.end = max;
            l2.start = min;
            l2.end = max;
            points.forEach((p) => {
                l1.intersections.add(p);
                l2.intersections.add(p);
            });
            return;
        }
        if (l1_slope === Infinity) {
            if (l1.start.x !== l2.start.x) return;
            if (l1.start.y > l2.end.y || l2.start.y > l1.end.y) return;
            const points: Point[] = [l1.start, l1.end];
            if (!l2.start.equals(l1.start) && !l2.start.equals(l1.end))
                points.push(l2.start);
            if (!l2.end.equals(l1.start) && !l2.end.equals(l1.end)) points.push(l2.end);
            if (points.length < 3) return;
            points.sort(SORT_BY_Y);
            const min = points.shift()!;
            const max = points.pop()!;
            l1.start = min;
            l1.end = max;
            l2.start = min;
            l2.end = max;
            points.forEach((p) => {
                l1.intersections.add(p);
                l2.intersections.add(p);
            });
            return;
        }

        if (l2.start.x < l1.start.x) {
            let temp = l1;
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
        if (l1.start.x > l2.end.x || l2.start.x > l1.end.x) return;
        /* Since we know that lines intersect, we just take all points, remove duplicates and connect them in sorted order */
        const points: Point[] = [l1.start, l1.end];
        if (!l2.start.equals(l1.start) && !l2.start.equals(l1.end)) points.push(l2.start);
        if (!l2.end.equals(l1.start) && !l2.end.equals(l1.end)) points.push(l2.end);
        if (points.length < 3) return;
        points.sort(SORT_BY_X);
        const min = points.shift()!;
        const max = points.pop()!;
        l1.start = min;
        l1.end = max;
        l2.start = min;
        l2.end = max;
        points.forEach((p) => {
            l1.intersections.add(p);
            l2.intersections.add(p);
        });
        return;
    }

    /* Sorting here avoids having to handle the edge cases for l2 as well. */
    if (l2_slope === Infinity || l2_slope === 0) {
        let temp = l1;
        l1 = l2;
        l2 = temp;
        const temp_slope = l1_slope;
        l1_slope = l2_slope;
        l2_slope = temp_slope;
    }

    /* L1 is Horizontal */
    if (l1_slope === 0) {
        /* L2 is Vertical */
        if (l2_slope === Infinity) {
            if (
                l2.start.x >= l1.start.x &&
                l2.start.x <= l1.end.x &&
                l1.start.y >= l2.start.y &&
                l1.start.y <= l2.end.y
            ) {
                const intersection = new Point(l2.start.x, l1.start.y);
                splitLines(l1, l2, intersection);
                return;
            }
            /* The lines dont intersect */
            return;
        }

        const b2 = l2.start.y - l2_slope * l2.start.x;
        const x2 = (l1.start.y - b2) / l2_slope;
        if (x2 <= l1.start.x || x2 >= l1.end.x) return;
        const lambda = (x2 - l2.start.x) / (l2.end.x - l2.start.x);
        /* Intersection is not in line segment */
        if (lambda < 0 || lambda > 1) return;
        const intersection = new Point(x2, l1.start.y);

        splitLines(l1, l2, intersection);
        return;
    }

    /* L1 is Vertical */
    if (l1_slope === Infinity) {
        /* L2 is Horizontal */
        if (l2_slope === 0) {
            if (
                l1.start.x >= l2.start.x &&
                l1.start.x <= l2.end.x &&
                l2.start.y >= l1.start.y &&
                l2.start.y <= l1.end.y
            ) {
                const intersection = new Point(l1.start.x, l2.start.y);
                splitLines(l1, l2, intersection);
                return;
            }
            /* The lines dont intersect */
            return;
        }

        const b2 = l2.start.y - l2_slope * l2.start.x;
        const y2 = l2_slope * l1.start.x + b2;
        if (y2 < l1.start.y || y2 > l1.end.y) return;
        /* Note: l1.start.x = x */
        const lambda = (l1.start.x - l2.start.x) / (l2.end.x - l2.start.x);
        /* Test if intersection is inside line segment */
        if (lambda < 0 || lambda > 1) return;

        const intersection = new Point(l1.start.x, y2);
        splitLines(l1, l2, intersection);
        return;
    }

    /* Regular case here */
    const b1 = l1.start.y - l1_slope * l1.start.x;
    const b2 = l2.start.y - l2_slope * l2.start.x;
    const x = (b2 - b1) / (l1_slope - l2_slope);
    const y = l1_slope * x + b1;

    /* Check if the lines intersect via parametric line segment representation */
    let lambdaX = (x - l1.start.x) / (l1.end.x - l1.start.x);
    let lambdaY = (y - l1.start.y) / (l1.end.y - l1.start.y);
    /* If Lambdas aren't equal, calculation is invalid i.o no intersection */
    if (Math.abs(lambdaX - lambdaY) > EPSILON) return;
    /* Test if intersection is inside line segment */
    if (lambdaX < 0 || lambdaX > 1) return;

    lambdaX = (x - l2.start.x) / (l2.end.x - l2.start.x);
    lambdaY = (y - l2.start.y) / (l2.end.y - l2.start.y);
    if (Math.abs(lambdaX - lambdaY) > EPSILON) return;
    /* Test if intersection is in line segment */
    if (lambdaX < 0 || lambdaX > 1) return;
    const intersection = new Point(x, y);
    splitLines(l1, l2, intersection);
    return;
}

/**
 *
 * @param l1 First line segment
 * @param l2 Second line segment
 * @param intersection Point on which both lines intersect
 * @returns List of new line segments
 * @warning This functino requires that the intersection point actually exists in both segments!
 */
function splitLines(l1: LineSegment, l2: LineSegment, intersection: Point) {
    /* Intersection is start or end point of line 1 -> we only split line 2 */
    if (intersection.equals(l1.start) || intersection.equals(l1.end)) {
        l2.intersections.add(intersection);
    }
    /* Intersection is start or end point of line 2 -> we only split line 1 */
    if (intersection.equals(l2.start) || intersection.equals(l2.end)) {
        l1.intersections.add(intersection);
    }

    /* Since we excluded both cases above, only case left is to split both lines */
    l1.intersections.add(intersection);
    l2.intersections.add(intersection);
}

export function sweepLine(lines: number[]): LineSegment[] {
    const sortedSegments: UniqueLineSegments = new UniqueLineSegments();

    let iterationCount = 0;

    /* Create line segments */
    for (let i = 0; i < lines.length; i += 4) {
        sortedSegments.add(
            new LineSegment(
                new Point(lines[i], lines[i + 1]),
                new Point(lines[i + 2], lines[i + 3])
            )
        );
    }
    if (sortedSegments.segments.length === 0) return [];

    const activeSegments: UniqueLineSegments = new UniqueLineSegments();
    let sweepPos = 0;
    let i = 0;
    const result: LineSegment[] = [];
    for (let segment of sortedSegments.segments) {
        sweepPos = segment.start.x;

        while (i < activeSegments.segments.length) {
            /* Remove all surpassed line segments */
            if (activeSegments.segments[i].end.x < sweepPos) {
                const res = activeSegments.segments.splice(i, 1);
                res.forEach((line) => {
                    result.push(...line.getSmallestLines());
                });
                continue;
            }

            if (iterationCount > ITERATION_LIMIT) break;
            splitOnIntersect(segment, activeSegments.segments[i]);
            iterationCount++;
            i++;
        }
        activeSegments.add(segment);
        i = 0;
    }

    if (iterationCount > ITERATION_LIMIT) {
        console.warn(`SweepLine: Ran over limit: ${iterationCount} iterations.`);
    }

    /* Add all leftover active segments */
    activeSegments.segments.forEach((line) => {
        result.push(...line.getSmallestLines());
    });

    return result;
}

/**
 * Boolean Matrix that only requires memory for cells that have been set.
 *
 * @note The trade-off for lower memory usage is higher cost for setting
 * and getting the contents of the matrix. So be sure to use it only when a lot of
 * cells will remain unset.
 */
export class SpaceEfficientAdjacencyMatrix {
    points: UniquePoints = new UniquePoints();
    cells: UniqueNumber = new UniqueNumber();
    size: number;

    /**
     * @param lines Lines of which to generate the AdjacencyMatrix.
     */
    constructor(lines: LineSegment[]) {
        /* Add all points to the matrix */
        lines.forEach((line) => {
            if (line.start.equals(line.end)) return;
            this.points.add(line.start);
            this.points.add(line.end);
        });

        /* Set matrix dimension */
        this.size = this.points.points.length;

        /* Build up connections between points */
        let index1 = -1;
        let index2 = -1;
        lines.forEach((line) => {
            index1 = this.points.indexOf(line.start);
            index2 = this.points.indexOf(line.end);
            this.setCell(index1, index2);
            this.setCell(index2, index1);
        });
    }

    setCell(row: number, col: number) {
        if (row > this.size || col > this.size) return;
        if (row === col) return; // invalid line
        this.cells.add(row * this.size + col);
    }

    unsetCell(row: number, col: number) {
        if (row > this.size || col > this.size) return;
        const index = this.cells.indexOf(row * this.size + col);
        if (index === -1) return;
        this.cells.points.splice(index, 1);
    }

    getCell(row: number, col: number): boolean {
        if (row > this.size || col > this.size) return false;
        const index = this.cells.indexOf(row * this.size + col);
        if (index === -1) return false;
        return true;
    }

    logMemorySavings() {
        const thisMemory = (this.cells.points.length * 56) / 8 / 1000;
        const regMemory = (this.size * this.size * 56) / 8 / 1000;
        const percent = thisMemory / regMemory;
        console.log(`Matrix: Memory footprint is ${thisMemory} kB.`);
        console.log(
            `        Using ${(percent * 100).toFixed(5)}% of the space of a regular Matrix.`
        );
    }

    decodeCell(cell: number): [number, number] {
        const row = Math.floor(cell / this.size);
        const col = cell - row * this.size;
        return [row, col];
    }

    getCellsAsRowCell(): [number, number][] {
        const res: [number, number][] = [];
        this.cells.points.forEach((cell) => {
            res.push(this.decodeCell(cell));
        });
        return res;
    }

    /**
     * Converts the matrix into a list of connected graphs.
     *
     * @warning This will remove all conntents of the matrix!
     */
    convertToConnectedGraph(): LineSegment[][] {
        const result: LineSegment[][] = [];
        result.push([]);
        if (this.cells.points.length === 0) return [];
        const cells = this.cells.points;
        const points = this.points.points;
        const size = this.size;
        let cell = cells.shift()!;
        let currentIndex = 0;
        let row = Math.floor(cell / size);
        let col = cell - row * size;
        let rangeMin = 0;
        let rangeMax = 0;
        let range: number[] = [];

        /* Since all connections appear twice we only store one -> [1, 2] and [2, 1] */
        if (row < col) {
            result[currentIndex].push(new LineSegment(points[row], points[col]));
        }
        const toVisit: UniqueNumber = new UniqueNumber();
        toVisit.add(col);
        while (cells.length > 0) {
            while (toVisit.points.length > 0) {
                row = toVisit.points.shift()!;
                rangeMin = row * size;
                rangeMax = rangeMin + size;
                range = this.cells.spliceRange(rangeMin, rangeMax);
                if (range.length === 0) {
                    continue;
                }
                range.forEach((c) => {
                    row = Math.floor(c / size);
                    col = c - row * size;
                    if (row === col) return;
                    toVisit.add(col);
                    if (row < col) {
                        result[currentIndex].push(
                            new LineSegment(points[row], points[col])
                        );
                    }
                });
            }
            if (cells.length === 0) break;
            toVisit.points.length = 0;
            /* Graphs with less than 3 Lines are irrelevant */
            if (result[currentIndex].length < 3) {
                result[currentIndex].length = 0;
            } else {
                currentIndex++;
                result.push([]);
            }
            cell = cells.shift()!;
            row = Math.floor(cell / size);
            col = cell - row * size;
            if (row < col) {
                result[currentIndex].push(new LineSegment(points[row], points[col]));
            }
            toVisit.add(col);
        }

        /* Check last graph as well */
        if (result[currentIndex].length < 3) {
            result.pop();
        }

        return result;
    }
}
