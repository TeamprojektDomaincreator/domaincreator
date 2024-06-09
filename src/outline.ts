/**
 * Module for finding the outline of connected cycles in a graph.
 * @module outline
 * @see module:line-tools
 */

import {
    LineSegment,
    Point,
    SpaceEfficientAdjacencyMatrix,
    UniquePoints,
    UnorderdLineSegment,
} from './line-tools';
import {createLinesFromPoints, AdjacencyMatrix } from './utils';

/**
 * Finds the outline of connected cycles in a graph.
 * @function findOutlineOfConnectedCyclesLines
 * @param {UnorderdLineSegment[][]} cycles - An array of cycles, where each cycle is an array of line segments.
 * @returns {UnorderdLineSegment[]} - An array of unordered line segments representing the outline of the connected cycles.
 */
export function findOutlineOfConnectedCyclesLines(cycles: UnorderdLineSegment[][]) {
    const cyclesFlat = cycles.flat();
    return hull(cyclesFlat);
}

/**
 * Finds the convex hull of a set of lines.
 * @function hull
 * @param {UnorderdLineSegment[]} lines - An array of line segments.
 * @returns {UnorderdLineSegment[]} - An array of unordered line segments representing the convex hull.
 * @private
 */
function hull(lines: UnorderdLineSegment[]): UnorderdLineSegment[] {
    const res: Point[] = [];

    const uniquePoints = new UniquePoints();
    lines.forEach((line) => {
        uniquePoints.add(line.start);
        uniquePoints.add(line.end);
    });

    const sortedPoints = uniquePoints.getPointsSortedByY();

    const matrix = new AdjacencyMatrix(sortedPoints);

    for (let line of lines) {
        matrix.addEdge(line.start, line.end);
    }

    const neighborOfFirst = matrix.getNeighbors(sortedPoints[0]);

    const uniquePoints2 = new UniquePoints();
    neighborOfFirst.forEach((point) => {
        uniquePoints2.add(point);
    });

    res.push(sortedPoints[0]);
    res.push(sortedPoints[1]);

    let nextPoint;
    while (!nextPoint?.equals(res[0])) {
        const neighbors = matrix.getNeighbors(res[res.length - 1]);
        if (!neighbors) {
            break;
        }
        // not sure if String is needed here
        const fNeighbors = neighbors.filter(
            (point) => !res[res.length - 2].equals(point) || !res[res.length - 1].equals(point)
        );
        if (fNeighbors.length === 0) {
            break;
        }
        console.log('logData: ', {
            res: [...res],
            firstPoint: res[res.length - 2],
            startPoint: res[res.length - 1],
            fNeighbors: fNeighbors,
            unfilterdNeighbors: neighbors,
        });

        const nextPointsAngles = fNeighbors.map((point) =>
            calculateAngle(res[res.length - 2], res[res.length - 1], point)
        );
        console.log(
            'nextPoints: ',
            nextPointsAngles.map((angle, index) => ({
                point: fNeighbors[index],
                angle,
            }))
        );

        nextPoint = findPointWithBiggestClockwiseAngle(
            res[res.length - 2],
            res[res.length - 1],
            fNeighbors
        );
        matrix.removeEdge(res[res.length - 1], nextPoint);

        res.push(nextPoint);
    }

    return createLinesFromPoints(res);
}

/**
 * Sorts an array of line segments by the start point of each line.
 * The primary sorting criterion is the y-coordinate of the start point.
 * If two lines have the same y-coordinate for the start point, the x-coordinate is used.
 *
 * @function sortLinesByStartPoint
 * @param {LineSegment[]} lines - An array of line segments to be sorted.
 * @returns {LineSegment[]} - A new array of line segments sorted by the start point.
 */
function sortLinesByStartPoint(lines: LineSegment[]): LineSegment[] {
    let sortedLines = [...lines]; // Create a new array to avoid modifying the original array

    sortedLines.sort((line1, line2) => {
        if (line1.start.y !== line2.start.y) {
            return line1.start.y - line2.start.y;
        } else {
            return line1.start.x - line2.start.x;
        }
    });

    return sortedLines;
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
        if (angle >= maxAngle) {
            maxAngle = angle;
            maxPoint = point;
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
