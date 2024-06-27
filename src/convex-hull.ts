// JavaScript program to find convex hull of a set of
// points. Refer
// https://www.geeksforgeeks.org/orientation-3-ordered-points/
// for explanation of orientation()

import { Point, UniquePoints, UnorderdLineSegment } from "./line-tools";
import { findOutlineOfConnectedCyclesLines } from "./outline";
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

/**
 * 
 * @param outlines 
 * @returns return remaining outlines and the convex hull 
 */
export function convexHull(outlines: UnorderdLineSegment[][]): {
	hull: UnorderdLineSegment[],
	remainingOutlines: UnorderdLineSegment[][]
} {
	const uniquePoints = new UniquePoints();
	outlines.forEach((outline) => {
		outline.forEach((line) => {
			uniquePoints.add(line.start);
			uniquePoints.add(line.end);
		});
	});

	const points = uniquePoints.getPointsSortedByY();
	const res: Point[] = [];
	res.push(points[0]);
	res.push(points[1]);

	let nextPoint;

	while (!nextPoint?.equals(res[0])) {
		const neighbors = points.filter(
			(point) => !res[res.length - 2].equals(point) || !res[res.length - 1].equals(point)
		);
		if (!neighbors) {
			break;
		}

		nextPoint = findPointWithBiggestClockwiseAngle(res[res.length - 2], res[res.length - 1], neighbors);

		res.push(nextPoint);
	}

	const rawHull = createLinesFromPoints([...res]);
	const result: UnorderdLineSegment[] = [];
	const remainingOutlines: UnorderdLineSegment[][] = [];
	
	outlines.forEach((outline) => {
		var touchesHull: boolean = false;
		outline.forEach((line) => {
			if (includesObject(rawHull, line)) {
				result.push(...outline);
				touchesHull = true;
				return;
			}

		})

		if (!touchesHull) {
			remainingOutlines.push(outline);
		}
	});

	return {
		hull: findOutlineOfConnectedCyclesLines([mergeAndRemoveMatchingElements(result, rawHull)]),
		remainingOutlines: remainingOutlines
	};
}


/**
 * Finds the point with the biggest clockwise angle.
 * @function findPointWithBiggestClockwiseAngle
 * @param {Point} firstPoint - The first point.
 * @param {Point} startPoint - The start point.
 * @param {Point[]} neighbors - An array of neighboring points.
 * @returns {Point} - The point with the biggest clockwise angle.
 */
function findPointWithBiggestClockwiseAngle(
	firstPoint: Point,
	startPoint: Point,
	neighbors: Point[]
): Point {
	let maxAngle = 0;
	let maxPoint = neighbors[0];

	for (let point of neighbors) {
		const angle = calculateAngle(firstPoint, startPoint, point);
		if (angle > maxAngle) {
			maxAngle = angle;
			maxPoint = point;
		} else if (angle === maxAngle) {
			const dist1 = Math.sqrt((point.x - startPoint.x) ** 2 + (point.y - startPoint.y) ** 2);
			const dist2 = Math.sqrt((maxPoint.x - startPoint.x) ** 2 + (maxPoint.y - startPoint.y) ** 2);
			if (dist1 < dist2) {
				maxPoint = point;
			}
		}
	}

	return maxPoint;
}

/**
 * Calculates the angle between three points.
 * @function calculateAngle
 * @param {Point} p1 - The first point.
 * @param {Point} p2 - The second point.
 * @param {Point} p3 - The third point.
 * @returns {number} - The calculated angle.
 */
function calculateAngle(p1: Point, p2: Point, p3: Point): number {
	const u = [p1.x - p2.x, p1.y - p2.y];
	const v = [p3.x - p2.x, p3.y - p2.y];

	const dotProduct = u[0] * v[0] + u[1] * v[1]; // skalar

	const det = u[0] * v[1] - u[1] * v[0];

	const angle = Math.atan2(det, dotProduct) * (180 / Math.PI);

	let resAngle;
	if (angle > 0) {
		resAngle = 360 - angle;
	} else if (angle < 0) {
		resAngle = angle * -1;
	} else {
		resAngle = angle;
	}

	return resAngle;
}


function mergeAndRemoveMatchingElements(convexHull: UnorderdLineSegment[], result: UnorderdLineSegment[]): UnorderdLineSegment[] {
	const matchingElements = new Set<UnorderdLineSegment>();

	for (const element1 of convexHull) {
		for (const element2 of result) {
			if (element1.equals(element2)) {
				matchingElements.add(element1);
			}
		}
	}

	const filterMatching = (element: UnorderdLineSegment) => !includesObject([...matchingElements], element);

	const filteredList1 = convexHull.filter(filterMatching);
	const filteredList2 = result.filter(filterMatching);

	const mergedList = [...filteredList1, ...filteredList2];

	return mergedList;
}

function includesObject(arr: object[], obj: object): boolean {
	return arr.some(arrObj => JSON.stringify(arrObj) === JSON.stringify(obj));
}