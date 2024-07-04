import {
    LineSegment,
    Point,
    SpaceEfficientAdjacencyMatrix,
    UniquePoints,
} from './line-tools';
import {AdjacencyMatrix} from './utils';

/**
 * Interface for connected cycles.
 * @interface
 * @property {LineSegment[][]} cycles - An array of cycles, where each cycle is an array of line segments.
 */
interface ConnectedCycle {
    cycles: LineSegment[][];
}

/**
 * Finds all cycles in a given graph.
 * @function findCycles
 * @param {LineSegment[]} graph - An array of line segments representing the graph.
 * @returns {ConnectedCycle[]} - An array of connected cycles found in the graph.
 */
export function findCycles(graph: LineSegment[]): ConnectedCycle[] {
    const uniquePoints = new UniquePoints();
    graph.forEach((line) => {
        uniquePoints.add(line.start);
        uniquePoints.add(line.end);
    });

    const matrix = new AdjacencyMatrix(uniquePoints.points);

    graph.forEach((line) => {
        matrix.addEdge(line.start, line.end);
    });

    const allCycles: LineSegment[][] = [];

    const stack: Point[] = [];
    const visited: boolean[] = new Array(matrix.points.length).fill(false);

    for (let i = 0; i < matrix.points.length; i++) {
        if (!visited[i]) {
            _dfsForCycle(i, visited, -1, stack, allCycles, matrix.points, matrix);
        }
    }

    const conCycles = connectedCyclesViaGraph(allCycles);

    return conCycles;
}

function connectedCyclesViaGraph(cycle: LineSegment[][]) {
    const matrix: SpaceEfficientAdjacencyMatrix = new SpaceEfficientAdjacencyMatrix(
        cycle.flat()
    );
    const connect = matrix.convertToConnectedGraph();
    const res: ConnectedCycle[] = [];
    connect.forEach((cc, index) => {
        res.push({cycles: [cc]});
    });
    return res;
}

/**
 * Performs a Depth-First Search (DFS) to find cycles in the graph.
 * @function _dfsForCycle
 * @param {number} vertexIndex - The index of the vertex to start the DFS from.
 * @param {boolean[]} visited - An array indicating whether each vertex has been visited.
 * @param {number} parentIndex - The index of the parent vertex.
 * @param {Point[]} stack - A stack used for the DFS.
 * @private
 */
function _dfsForCycle(
    vertexIndex: number,
    visited: boolean[],
    parentIndex: number,
    stack: Point[],
    allCycles: LineSegment[][],
    points: Point[],
    matrix: AdjacencyMatrix
) {
    visited[vertexIndex] = true;
    stack.push(points[vertexIndex]);

    for (let i = 0; i < points.length; i++) {
        if (matrix.getCellByIndex(vertexIndex, i)) {
            if (!visited[i]) {
                _dfsForCycle(i, visited, vertexIndex, stack, allCycles, points, matrix);
            } else if (i !== parentIndex) {
                // Cycle detected
                let cycleStartIndex = stack.indexOf(points[i]);
                let cycle = stack.slice(cycleStartIndex);
                if (cycle.length > 2) {
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
