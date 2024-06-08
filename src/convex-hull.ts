// JavaScript program to find convex hull of a set of
// points. Refer
// https://www.geeksforgeeks.org/orientation-3-ordered-points/
// for explanation of orientation()

import { Point, UniquePoints, UnorderdLineSegment } from "./line-tools";
import { createLinesFromPoints } from "./utils";


// A global point needed for sorting points with reference
// to the first point
let p0
	= new Point(0, 0);

// A utility function to find next to top in a stack
function nextToTop(S: Point[]) { return S[S.length - 2]; }

// A utility function to return square of distance
// between p1 and p2
function distSq(p1: Point, p2: Point) {
	return ((p1.x - p2.x) * (p1.x - p2.x)
		+ (p1.y - p2.y) * (p1.y - p2.y));
}

// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are collinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function orientation(p: Point, q: Point, r: Point) {
	let val = ((q.y - p.y) * (r.x - q.x)
		- (q.x - p.x) * (r.y - q.y));
	if (val == 0)
		return 0; // collinear
	else if (val > 0)
		return 1; // clock wise
	else
		return 2; // counterclock wise
}

// A function used by cmp_to_key function to sort an array
// of points with respect to the first point
function compare(p1: Point, p2: Point) {

	// Find orientation
	let o = orientation(p0, p1, p2);
	if (o == 0) {
		if (distSq(p0, p2) >= distSq(p0, p1))
			return -1;
		else
			return 1;
	}
	else {
		if (o == 2)
			return -1;
		else
			return 1;
	}
}

// Prints convex hull of a set of n points.
export function convexHull(outlines: UnorderdLineSegment[][]): UnorderdLineSegment[] {
	const uniquePoints = new UniquePoints();
	outlines.forEach((outline) => {
		outline.forEach((line) => {
			uniquePoints.add(line.start);
			uniquePoints.add(line.end);
		});
	});

	const points = uniquePoints.points;
	// Find the bottommost point
	const n = points.length;
	let ymin = points[0].y;
	let min = 0;
	for (var i = 1; i < n; i++) {
		let y = points[i].y;

		// Pick the bottom-most or choose the left
		// most point in case of tie
		if ((y < ymin)
			|| ((ymin == y)
				&& (points[i].x < points[min].x))) {
			ymin = points[i].y;
			min = i;
		}
	}

	// Place the bottom-most point at first position
	points[0], points[min] = points[min], points[0];

	// Sort n-1 points with respect to the first point.
	// A point p1 comes before p2 in sorted output if p2
	// has larger polar angle (in counterclockwise
	// direction) than p1
	points.sort(compare);

	// Create an empty stack and push first three points
	// to it.
	let S = [];
	S.push(points[0]);
	S.push(points[1]);
	S.push(points[2]);

	// Process remaining n-3 points
	for (var i = 3; i < n; i++) {
		// Keep removing top while the angle formed by
		// points next-to-top, top, and points[i] makes
		// a non-left turn
		while (true) {
			if (S.length < 2)
				break;
			const orient = orientation(nextToTop(S), S[S.length - 1], points[i]);
			if (orient >= 2 || orient === 0)
				break;
			S.pop();
		}

		S.push(points[i]);
	}

	return createLinesFromPoints([...S.reverse()]);
}