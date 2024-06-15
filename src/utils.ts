import {Point, UnorderdLineSegment} from './line-tools';

/**
 * This module provides utility functions for working with points and line segments.
 * @module utils
 */

/**
 * Creates unordered line segments from an array of points.
 * The function connects each point to the next one in the array, and the last point back to the first one.
 * This can be used to create a closed shape from a list of points.
 *
 * @function createLinesFromPoints
 * @param {Point[]} points - An array of points.
 * @returns {UnorderdLineSegment[]} - An array of unordered line segments created from the points.
 */
export function createLinesFromPoints(points: Point[]): UnorderdLineSegment[] {
    let lines: UnorderdLineSegment[] = [];

    for (let i = 0; i < points.length - 1; i++) {
        lines.push(new UnorderdLineSegment(points[i], points[i + 1]));
    }

    // Connect the last point to the first to close the shape
    lines.push(new UnorderdLineSegment(points[points.length - 1], points[0]));

    return lines;
}


/**
 * Class representing an adjacency matrix for a graph.
 * @class
 */
export class AdjacencyMatrix {
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

    removeEdge(p1: Point, p2: Point) {
        const i1 = this.points.indexOf(p1);
        const i2 = this.points.indexOf(p2);
        this.matrix[i1][i2] = false;
        this.matrix[i2][i1] = false;
    }

    /**
     * Gets the neighboring points of a given point.
     * @param {Point} point - The point to get the neighbors of.
     * @returns {Point[]} - An array of neighboring points.
     */
    getNeighbors(point: Point): Point[] {
        const index = this.points.indexOf(point);
        if (index === -1) {
            console.error('Point not found in matrix');
            return [];
        }
        const neighbors = [];
        for (let i = 0; i < this.points.length; i++) {
            if (this.matrix[index][i]) {
                neighbors.push(this.points[i]);
            }
        }

        return neighbors;
    }
}
