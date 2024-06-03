import { LineSegment, Point } from "./line-tools";
import { UniquePoints } from "./object-extractor";

let p0 = new Point(0, 0);

export function findOutlineOfConnectedCyclesLines(cycles: LineSegment[][]) {
  console.log("Cycles: ", cycles);

  const cyclesFlat = cycles.flat();
  console.log("CyclesFlat: ", [...cyclesFlat]);
  return hull(cyclesFlat);
}

function hull(lines: LineSegment[]): LineSegment[] {
  const res: Point[] = [];
  const linesSorted = sortLinesByStartPoint(lines);
  const points: UniquePoints = new UniquePoints();

  for (let line of linesSorted) {
    points.addPoint(line.start);
    points.addPoint(line.end);
  }
  const sortedPoints = points.getPointsSortedByY();

  const matrix = new AdjacencyMatrix(sortedPoints);

  for (let line of linesSorted) {
    matrix.addEdge(line.start, line.end);
  }

  matrix.print();

  let firstLine = linesSorted[0];
  res.push(sortedPoints[0]);
  res.push(sortedPoints[1]);
  linesSorted.splice(0, 1);

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

    console.log("log data:", {
      firstPoint: res[res.length - 2],
      startPoint: res[res.length - 1],
      fNeighbors,
      res,
    });
    nextPoint = findPointWithBiggestClockwiseAngle(
      res[res.length - 2],
      res[res.length - 1],
      fNeighbors
    );
    res.push(nextPoint);
  }

  console.log("res: ", res);
  console.log("lines: ", lines);

  return createLinesFromPoints(res);
}


function createLinesFromPoints(points: Point[]): LineSegment[] {
  let lines: LineSegment[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    lines.push(new LineSegment(points[i], points[i + 1]));
  }

  // Connect the last point to the first to close the shape
  lines.push(new LineSegment(points[points.length - 1], points[0]));

  return lines;
}

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

function findPointWithBiggestClockwiseAngle(
  firstPoint: Point,
  startPoint: Point,
  neighbors: Point[]
): Point {
  let maxAngle = -Infinity;
  let maxPoint = neighbors[0];
  const testAngles = [];

  for (let point of neighbors) {
    const angle = calculateAngle(firstPoint, startPoint, point);
    testAngles.push({ point, angle });

    if (angle >= maxAngle) {
      maxAngle = angle;
      maxPoint = point;
    }
  }

  console.log("testAngles: ", testAngles);

  return maxPoint;
}

function calculateAngle(p1: Point, p2: Point, p3: Point): number {
  const v1 = [p2.x - p1.x, p2.y - p1.y];
  const v2 = [p1.x - p2.x, p3.y - p2.y];

  const dotProduct = v1[0] * v2[0] + v1[1] * v2[1];
  const det = v1[0] * v2[1] - v1[1] * v2[0];

  return Math.atan2(det, dotProduct);
}

class AdjacencyMatrix {
  matrix: number[][];
  points: Point[];
  constructor(points: Point[]) {
    this.points = points;
    if (points.length <= 0) {
      throw new Error("Number of vertices must be positive");
    }

    // Create a 2D array to represent the matrix
    this.matrix = new Array(points.length)
      .fill(null)
      .map(() => new Array(points.length).fill(0));
  }

  // Add an edge between two vertices
  addEdge(p1: Point, p2: Point) {
    this.validateVertex(p1);
    this.validateVertex(p2);

    this.matrix[this.points.indexOf(p1)][this.points.indexOf(p2)] = 1; // Mark 1 for undirected graph
    this.matrix[this.points.indexOf(p2)][this.points.indexOf(p1)] = 1; // Mark 1 for undirected graph
    // Add for directed graph (if needed)
    // this.matrix[vertex2][vertex1] = 1;
  }

  // Check if there's an edge between two vertices
  hasEdge(p1: Point, p2: Point) {
    this.validateVertex(p1);
    this.validateVertex(p2);

    return this.matrix[this.points.indexOf(p1)][this.points.indexOf(p2)] === 1;
  }

  deleteEdge(p1: Point, p2: Point) {
    this.validateVertex(p1);
    this.validateVertex(p2);

    this.matrix[this.points.indexOf(p1)][this.points.indexOf(p2)] = 0;
    this.matrix[this.points.indexOf(p2)][this.points.indexOf(p1)] = 0;
  }

  // Get the list of adjacent vertices for a specific vertex
  getNeighbors(p: Point) {
    this.validateVertex(p);

    const neighbors: Point[] = [];
    for (let i = 0; i < this.matrix.length; i++) {
      if (this.matrix[this.points.indexOf(p)][i] === 1) {
        neighbors.push(this.points[i]);
      }
    }
    return neighbors;
  }

  // Validate vertex index
  validateVertex(p: Point) {
    if (this.points.indexOf(p) === -1) {
      console.log("Invalid vertex index");
    }
  }

  // Print the matrix
  print() {
    for (let i = 0; i < this.matrix.length; i++) {
      console.log(this.matrix[i].join(" "));
    }
  }
}
