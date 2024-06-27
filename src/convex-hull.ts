import { Point, UniquePoints, UnorderdLineSegment } from "./line-tools";
import { findOutlineOfConnectedCyclesLines } from "./outline";
import { createLinesFromPoints } from "./utils";

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