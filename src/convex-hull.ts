import { Point, UniquePoints, UnorderdLineSegment } from "./line-tools";
import { AdjacencyMatrix, createLinesFromPoints } from "./utils";

/**
 * Finds the convex hull of all connected cycles.
 * When running into an edge case try to set mergeWithTouchingCycles to false.
 * @param outlines
 * @param mergeWithTouchingCycles If true, the convex hull will be merged with any of the touching cycles.
 * @returns return remaining outlines and the convex hull
 */
export function convexHull(
  outlines: UnorderdLineSegment[][],
  mergeWithTouchingCycles: boolean = true
): {
  hull: UnorderdLineSegment[];
  remainingOutlines: UnorderdLineSegment[][];
} {
  // Get all Unique points from the outlines
  const uniquePoints = new UniquePoints();
  outlines.forEach((outline) => {
    outline.forEach((line) => {
      uniquePoints.add(line.start);
      uniquePoints.add(line.end);
    });
  });

  // Sort the points by y-coordinate to get the first two points
  const points = uniquePoints.getPointsSortedByY();
  const pointsOfRawConvexHull: Point[] = [];
  pointsOfRawConvexHull.push(points[0]);
  pointsOfRawConvexHull.push(points[1]);

  // Find all points of the initial convex hull
  let nextPoint;
  while (!nextPoint?.equals(pointsOfRawConvexHull[0])) {
    const neighbors = points.filter(
      (point) =>
        !pointsOfRawConvexHull[pointsOfRawConvexHull.length - 2].equals(
          point
        ) &&
        !pointsOfRawConvexHull[pointsOfRawConvexHull.length - 1].equals(point)
    );
    if (!neighbors || neighbors?.length <= 0) {
      break;
    }

    nextPoint = findPointWithBiggestClockwiseAngle(
      pointsOfRawConvexHull[pointsOfRawConvexHull.length - 2],
      pointsOfRawConvexHull[pointsOfRawConvexHull.length - 1],
      neighbors
    );

    pointsOfRawConvexHull.push(nextPoint);
  }

  // create the initial hull
  const rawHull = createLinesFromPoints([...pointsOfRawConvexHull]);
  if (!mergeWithTouchingCycles) {
    return {
      hull: rawHull,
      remainingOutlines: outlines,
    };
  }
  
  // Check which outlines are touching the hull
  const touchingOutlines: UnorderdLineSegment[][] = [[]];
  const remainingOutlines: UnorderdLineSegment[][] = [];
  outlines.forEach((outline) => {
    var touchesHull: boolean = false;
    outline.forEach((line) => {
      if (includesObject(rawHull, line)) {
        touchingOutlines.push(outline);
        touchesHull = true;
        return;
      }
    });

    if (!touchesHull) {
      remainingOutlines.push(outline);
    }
  });

  // Merge the hull with the touching outlines
  const convexHullMergedWithTouchingOutlinesUnsorted =
    mergeAndRemoveMatchingElements(rawHull, touchingOutlines);

  // If there is only one outline, it is the convex hull
  if (convexHullMergedWithTouchingOutlinesUnsorted.length === 0) {
    return {
      hull: rawHull,
      remainingOutlines: remainingOutlines,
    };
  }

  // Sort lines to create a polygon from the lines
  // Extract all unique points from the lines
  const uniqueConvexHullPoints = new UniquePoints();
  convexHullMergedWithTouchingOutlinesUnsorted.forEach((line) => {
    uniqueConvexHullPoints.add(line.start);
    uniqueConvexHullPoints.add(line.end);
  });

  const sortedPoints = uniqueConvexHullPoints.getPointsSortedByY();
  const adjacencyMatrix: AdjacencyMatrix = new AdjacencyMatrix(sortedPoints);

  convexHullMergedWithTouchingOutlinesUnsorted.forEach((line) => {
    adjacencyMatrix.addEdge(line.start, line.end);
  });

  // Find any Startpoint and any neighbour to start with
  const pointsResult: Point[] = [];
  pointsResult.push(sortedPoints[0]);
  pointsResult.push(adjacencyMatrix.getNeighbors(adjacencyMatrix.points[0])[0]);

  // Find next neighbour to ensure the order of the points / lines is correct
  let next = pointsResult[1];
  while (!next?.equals(pointsResult[0])) {
    next = adjacencyMatrix
      .getNeighbors(pointsResult[pointsResult.length - 1])
      .find(
        (point) =>
          !pointsResult[pointsResult.length - 2].equals(point) &&
          !pointsResult[pointsResult.length - 1].equals(point)
      )!;
    pointsResult.push(next!);
  }
  // Create the final hull polygon from sorted lines
  return {
    hull: createLinesFromPoints(pointsResult),
    remainingOutlines: remainingOutlines,
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
      const dist1 = Math.sqrt(
        (point.x - startPoint.x) ** 2 + (point.y - startPoint.y) ** 2
      );
      const dist2 = Math.sqrt(
        (maxPoint.x - startPoint.x) ** 2 + (maxPoint.y - startPoint.y) ** 2
      );
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

function mergeAndRemoveMatchingElements(
  convexHull: UnorderdLineSegment[],
  touchingOutlines: UnorderdLineSegment[][]
): UnorderdLineSegment[] {
  const matchingElements: UnorderdLineSegment[] = [];

  for (const convexHullLine of convexHull) {
    let didHit = false;
    for (const touchingOutlineLine of touchingOutlines) {
      if (includesObject(touchingOutlineLine, convexHullLine)) {
        for (const line of touchingOutlineLine) {
          if (
            !includesObject(matchingElements, line) &&
            !includesObject(convexHull, line)
          ) {
            matchingElements.push(line);
          }
        }
        didHit = true;
        break;
      }
    }
    if (!didHit) {
      matchingElements.push(convexHullLine);
    }
  }

  return matchingElements;
}

function includesObject(arr: object[], obj: object): boolean {
  return arr.some((arrObj) => JSON.stringify(arrObj) === JSON.stringify(obj));
}
