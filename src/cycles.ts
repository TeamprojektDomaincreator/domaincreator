import { LineSegment, Point } from "./line-tools";
import { UniquePoints, SpaceEfficientMatrix } from "./object-extractor";

export function findCycles(graph: LineSegment[]): LineSegment[][] {
  let points: UniquePoints = new UniquePoints();
  for (let line of graph) {
    points.addPoint(line.start);
    points.addPoint(line.end);
  }
  const matrix = new SpaceEfficientMatrix(points.points.length);
  for (let line of graph) {
    const index1 = points.indexOf(line.start);
    const index2 = points.indexOf(line.end);
    if (index1 === -1 || index2 === -1) continue;
    matrix.setCell(index1, index2);
    matrix.setCell(index2, index1);
  }

  let allCycles: LineSegment[][] = [];
  let stack: Point[] = [];
  let visited: boolean[] = new Array(points.points.length).fill(false);

  for (let i = 0; i < points.points.length; i++) {
    if (!visited[i]) {
      _dfsForCycle(i, visited, -1, stack, allCycles, points.points, matrix);
    }
  }
  return allCycles;
}

function _dfsForCycle(
  vertexIndex: number,
  visited: boolean[],
  parentIndex: number,
  stack: Point[],
  allCycles: LineSegment[][],
  points: Point[],
  matrix: SpaceEfficientMatrix
) {
  visited[vertexIndex] = true;
  stack.push(points[vertexIndex]);

  for (let i = 0; i < points.length; i++) {
    if (matrix.getCell(vertexIndex, i)) {
      if (!visited[i]) {
        _dfsForCycle(i, visited, vertexIndex, stack, allCycles, points, matrix);
      } else if (i !== parentIndex) {
        // Cycle detected
        let cycleStartIndex = stack.indexOf(points[i]);
        let cycle = stack.slice(cycleStartIndex);
        if (cycle.length > 2) {
          console.log(
            `Cycle detected: ${cycle
              .map((vertex) => vertex.toString())
              .join(" -> ")}`
          );
          let cycleGraph: LineSegment[] = [];
          for (let j = 0; j < cycle.length - 1; j++) {
            cycleGraph.push(new LineSegment(cycle[j], cycle[j + 1]));
          }
          // Connect the last vertex to the first to complete the cycle
          cycleGraph.push(new LineSegment(cycle[cycle.length - 1], cycle[0]));

          allCycles.push(cycleGraph);
        }
      }
    }
  }
    stack.pop();
}
