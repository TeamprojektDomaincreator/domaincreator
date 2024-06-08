/**
 * Module for finding the outline of connected cycles in a graph.
 * @module outline
 * @see module:line-tools
 */

import {
    LineSegment,
    Point,
    SpaceEfficientAdjacencyMatrix,
    UnorderdLineSegment,
} from './line-tools';
import {createLinesFromPoints} from './utils';

/**
 * Finds the outline of connected cycles in a graph.
 * @function findOutlineOfConnectedCyclesLines
 * @param {LineSegment[][]} cycles - An array of cycles, where each cycle is an array of line segments.
 * @returns {UnorderdLineSegment[]} - An array of unordered line segments representing the outline of the connected cycles.
 */
export function findOutlineOfConnectedCyclesLines(cycles: LineSegment[][]) {
    const cyclesFlat = cycles.flat();
    return hull(cyclesFlat);
}

/**
 * Finds the convex hull of a set of lines.
 * @function hull
 * @param {LineSegment[]} lines - An array of line segments.
 * @returns {UnorderdLineSegment[]} - An array of unordered line segments representing the convex hull.
 * @private
 */
function hull(lines: LineSegment[]): UnorderdLineSegment[] {
    const res: Point[] = [];
    const linesSorted = sortLinesByStartPoint(lines);
    const efficientMatrix = new SpaceEfficientAdjacencyMatrix(linesSorted);
    const points = efficientMatrix.points;

    const sortedPoints = points.getPointsSortedByY();

    const matrix = new AdjacencyMatrix(sortedPoints);

    for (let line of linesSorted) {
        matrix.addEdge(line.start, line.end);
    }

    res.push(sortedPoints[0]);
    res.push(sortedPoints[1]);

    let nextPoint;
    while (!nextPoint?.equals(res[0])) {
        const neighbors = matrix.getNeighbors(res[res.length - 1]);
        if (!neighbors) {
            break;
        }
        const fNeighbors = neighbors.filter((point) => !res.includes(point));
        if (fNeighbors.length === 0) {
            break;
        }

        nextPoint = findPointWithBiggestClockwiseAngle(
            res[res.length - 2],
            res[res.length - 1],
            fNeighbors
        );
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
    let maxAngle = Infinity;
    let maxPoint = neighbors[0];

    for (let point of neighbors) {
        const angle = calculateAngle(firstPoint, startPoint, point);
        if (angle <= maxAngle) {
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
    const v1 = [p2.x - p1.x, p2.y - p1.y];
    const v2 = [p3.x - p2.x, p3.y - p2.y];

    const dotProduct = v1[0] * v2[0] + v1[1] * v2[1]; // scalar
    const det = v1[0] * v2[1] - v1[1] * v2[0];

    const angle = Math.atan2(det, dotProduct);

    return angle;
}

/**
 * Class representing an adjacency matrix for a graph.
 * @class
 */
class AdjacencyMatrix {
    points: Point[];

    matrix: boolean[][];
    constructor(points: Point[]) {
        this.points = points;
        this.matrix = new Array(points.length)
            .fill(null)
            .map(() => new Array(points.length).fill(false));
    }

    /**
     * Adds an edge between two points in the graph.
     * @param {Point} p1 - The first point.
     * @param {Point} p2 - The second point.
     */
    addEdge(p1: Point, p2: Point) {
        const i1 = this.points.indexOf(p1);
        const i2 = this.points.indexOf(p2);
        this.matrix[i1][i2] = true;
        this.matrix[i2][i1] = true;
    }

    /**
     * Gets the neighboring points of a given point.
     * @param {Point} point - The point to get the neighbors of.
     * @returns {Point[]} - An array of neighboring points.
     */
    getNeighbors(point: Point): Point[] {
        const index = this.points.indexOf(point);
        const neighbors = [];
        for (let i = 0; i < this.points.length; i++) {
            if (this.matrix[index][i]) {
                neighbors.push(this.points[i]);
            }
        }

        return neighbors;
    }
}
