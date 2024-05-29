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

class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    equals(p: Point): boolean {
        return this.x === p.x && this.y === p.y;
    }
}


class LineSegment {
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
function splitOnIntersect(l1: LineSegment, l2: LineSegment): LineSegment[] | undefined {
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

    /* At least one of the segments is a point, i.o invalid */
    if (Number.isNaN(l1_slope) || Number.isNaN(l2_slope)) return;

    /* Lines are parallel or overlap */
    if (l1_slope === l2_slope) {
        if (l1_slope === 0) {
            if (l1.start.y !== l2.start.y) return;
            if (l1.end.x <= l2.start.x || l2.end.x <= l1.start.x) return;
            const res: LineSegment[] = [];
            const points: Point[] = [l1.start, l1.end];
            if (!l2.start.equals(l1.start) && !l2.start.equals(l1.end))
                points.push(l2.start);
            if (!l2.end.equals(l1.start) && !l2.end.equals(l1.end)) points.push(l2.end);
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
            if (!l2.end.equals(l1.start) && !l2.end.equals(l1.end)) points.push(l2.end);
            points.sort(SORT_BY_Y);
            for (let i = 0; i < points.length - 1; i++) {
                res.push(new LineSegment(points[i], points[i + 1]));
            }
            return res;
        }

        /* Test if line segments are on the same line */
        const b1 = l1.start.y - l1_slope * l1.start.x;
        if (l2.start.y !== l1_slope * l2.start.x + b1) return;

        /* Test if line segments are disjunct */
        if (l1.end.x < l2.start.x && l2.end.x < l1.start.x) return; // @todo: Brain through this to check if it actaully works
        
        /* Since we know that lines intersect, we just take all points, remove duplicates and connect them in sorted order */
        const res: LineSegment[] = [];
        const points: Point[] = [l1.start, l1.end];
        if (!l2.start.equals(l1.start) && !l2.start.equals(l1.end)) points.push(l2.start);
        if (!l2.end.equals(l1.start) && !l2.end.equals(l1.end)) points.push(l2.end);
        points.sort(SORT_BY_X);
        for (let i = 0; i < points.length - 1; i++) {
            res.push(new LineSegment(points[i], points[i + 1]));
        }
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
        if (intersection.x < l1.start.x || intersection.x > l1.end.x) return;
        const lambda = (intersection.x - l2.start.x) / (l2.end.x - l2.start.x);
        /* Intersection is not in line segment */
        if (lambda < 0 || lambda > 1) return;

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

        return splitLines(l1, l2, intersection);
    }

    /* Regular case here */
    const b1 = l1.start.y - l1_slope * l1.start.x;
    const b2 = l2.start.y - l2_slope * l2.start.x;
    const x = (b2 - b1) / (l1_slope - l2_slope);
    const y = l1_slope * x + b1;
    const intersection = new Point(x, y);
    const lambda = (intersection.x - l2.start.x) / (l2.end.x - l2.start.x);
    /* Test if intersection is in line segment */
    if (lambda < 0 || lambda > 1) return;

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
function splitLines(l1: LineSegment, l2: LineSegment, intersection: Point): LineSegment[] {
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
function sweepLine(lines: number[]): number[] {
    const sortedSegments: LineSegment[] = [];

    for (let i = 0; i < lines.length; i+=4) {
        sortedSegments.push(new LineSegment(new Point(lines[i], lines[i+1]), new Point(lines[i+2], lines[i+3])));
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
        sweepPos = segment.start.x;
        let wasAdded = false;
        /* Remove all surpassed line segments */
        for (const activeSegment of activeSegments) {
            if(activeSegment.end.x < sweepPos) {
                activeSegments.delete(activeSegment);
                result.push(activeSegment.start.x, activeSegment.start.y, activeSegment.end.x, activeSegment.end.y);
            }
        }
        const addQueue: LineSegment[] = [];
        const removeQueue: LineSegment[] = [];
        for (const activeSegment of activeSegments) {
            const split = splitOnIntersect(segment, activeSegment);
            if (!split) continue;
            removeQueue.push(activeSegment);
            split.forEach((s: LineSegment) => {
                addQueue.push(s);
            })
            wasAdded = true;
        }
        removeQueue.forEach((line: LineSegment) => {
            activeSegments.delete(line);
        })
        addQueue.forEach((line: LineSegment) => {
            activeSegments.add(line);
        })
        if (!wasAdded) activeSegments.add(segment);
    }

    /* Add all leftovers */
    activeSegments.forEach((line: LineSegment) => {
        result.push(line.start.x, line.start.y, line.end.x, line.end.y);
    })

    return result;
}

function bruteForce(lines: number[]): number[] {
    const segments: LineSegment[] = [];

    for (let i = 0; i < lines.length; i+=4) {
        segments.push(new LineSegment(new Point(lines[i], lines[i+1]), new Point(lines[i+2], lines[i+3])));
    }
    if (segments.length === 0) return [];

    const result: Set<LineSegment> = new Set();

    for(const s1 of segments) {
        for (const s2 of segments) {
            const split = splitOnIntersect(s1, s2);
            if (!split) continue;
            split.forEach((s) => {
                result.add(s);
            })

        }
    }
    const hmm: number [] = [];
    result.forEach((line: LineSegment) => {
        hmm.push(line.start.x, line.start.y, line.end.x, line.end.y);
    })
    return hmm;

}

export class ObjectExtractor {
    unprocessedLines: number[] = [];

    addLines(lines: number[]) {
        // Use push.apply to add all elements at once
        Array.prototype.push.apply(this.unprocessedLines, lines);
    }

    extract(): number[] {
        let time = performance.now();
        const res = sweepLine(this.unprocessedLines);
        time = performance.now() - time;
        console.log(`Took ${time} ms to split lines`)
        return res;
    }

}
