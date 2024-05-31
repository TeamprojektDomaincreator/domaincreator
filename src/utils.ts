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
