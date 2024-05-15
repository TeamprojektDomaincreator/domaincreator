class Matrix {
  maxSize;
  currentSize;

  cells: Int8Array = new Int8Array(0);

  /**
   *
   * @param size Worst case size. (No lines match)
   */
  constructor(size: number) {
    this.maxSize = size;
    this.currentSize = size / 2 + 1; // @todo: Tune later
    this.cells = new Int8Array(this.currentSize * this.currentSize);
  }

  setCell(row: number, col: number) {
    if (row > this.maxSize || col > this.maxSize) return;
    if (row > this.currentSize || col > this.currentSize) {
      this.increaseSize();
    }
    this.cells[row * this.currentSize + col] = 1;
  }

  /**
   * Gets contents of cell
   *
   * @param row
   * @param col
   * @returns -1 If row or col is invalid.
   */
  getCell(row: number, col: number): number {
    if (row > this.currentSize || col > this.currentSize) return -1;
    return this.cells[row * this.currentSize + col];
  }

  /**
   * @todo: Change to not maxsize
   */
  increaseSize() {
    const newCells = new Int8Array(this.maxSize * this.maxSize);
    let row = 0;
    let col = 0;
    for (let i = 0; i < this.cells.length; i++) {
      newCells[row * this.maxSize + col] = this.cells[i];
      col = i % this.currentSize;
      if (i % this.currentSize === 0) row++;
    }
    this.currentSize = this.maxSize;
    this.cells = newCells;
  }

  print() {
    let printstring: string = "    ";
    for (let i = 0; i < this.currentSize; i++) {
      printstring += String(i) + " ";
    }
    console.log(printstring + "\n");
    printstring = "";
    let count = 0;
    for (let i = 0; i < this.cells.length; i++) {
      if (i % this.currentSize === 0) {
        console.log(printstring + "\n");
        printstring = String(count) + "   ";
        count++;
      }
      printstring += String(this.cells[i]) + " ";
    }
    console.log(printstring + "\n");
  }
}
class Vertex {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  equals(vertex: Vertex): boolean {
    return this.x === vertex.x && this.y === vertex.y;
  }

  toString(): string {
    return `X: ${this.x} | Y: ${this.y}`;
  }

  toLinePoint() {
    return [this.x, this.y];
  }
}

export class Graph {
  key: Vertex;
  allVertices: Vertex[];
  allEdges: [Vertex, Vertex][];

  constructor(
    key: Vertex,
    allVertices: Vertex[],
    allEdges: [Vertex, Vertex][]
  ) {
    this.key = key;
    this.allVertices = allVertices;
    this.allEdges = allEdges;
  }

  toAdjacencyMatrix(): AdjacencyMatrix {
    let lines = this.allEdges
      .map(([vertex1, vertex2]) => [
        ...vertex1.toLinePoint(),
        ...vertex2.toLinePoint(),
      ])
      .flat();
    let matrix = new AdjacencyMatrix(lines.length / 2);
    matrix.addLines(lines);
    return matrix;
  }
}

export class AdjacencyMatrix {
  vertecies: Vertex[] = [];
  matrix: Matrix;
  allCycles: Vertex[][] = [];

  constructor(size: number) {
    this.matrix = new Matrix(size);
  }

  addLines(lines: number[]) {
    for (let i = 0; i < lines.length; i += 4) {
      const start = new Vertex(lines[i], lines[i + 1]);
      const end = new Vertex(lines[i + 2], lines[i + 3]);
      let start_index = this.indexOf(start);
      let end_index = this.indexOf(end);
      if (start_index === -1) {
        start_index = this.vertecies.push(start) - 1;
      }

      if (end_index === -1) {
        end_index = this.vertecies.push(end) - 1;
      }

      this.matrix.setCell(start_index, end_index);
      this.matrix.setCell(end_index, start_index); // @todo: Remove unnecessary step, this can be assumed + shrink matrix by half
    }
    this.matrix.print();
    for (let i = 0; i < this.vertecies.length; i++) {
      console.log(
        `Index ${i} = X: ${this.vertecies[i].x} | Y: ${this.vertecies[i].y}`
      );
    }
  }

  indexOf(vertex: Vertex): number {
    for (let i = 0; i < this.vertecies.length; i++) {
      if (this.vertecies[i].equals(vertex)) return i;
    }
    return -1;
  }

  _getEdges(): [Vertex, Vertex][] {
    const edges: [Vertex, Vertex][] = [];
    for (let i = 0; i < this.vertecies.length; i++) {
      for (let j = i; j < this.vertecies.length; j++) {
        if (this.matrix.getCell(i, j)) {
          edges.push([this.vertecies[i], this.vertecies[j]]);
        }
      }
    }
    return edges;
  }

  getConnectedComponents() {
    let edges = this._getEdges();
    let n = this.vertecies.length;

    // Initialize parent array for each node
    let parent: Map<Vertex, Vertex> = new Map();
    for (let vertex of this.vertecies) {
      parent.set(vertex, vertex);
    }

    for (let [vertex1, vertex2] of edges) {
      parent.set(this._merge(parent, vertex1), this._merge(parent, vertex2));
    }

    // Count the number of nodes with self as parent, which are the roots of connected components
    let ans = 0;
    for (let vertex of this.vertecies) {
      if (parent.get(vertex) === vertex) {
        ans++;
      }
    }

    // Find the parent of each node again, and group nodes with the same parent
    for (let vertex of this.vertecies) {
      parent.set(vertex, this._merge(parent, parent.get(vertex)!));
    }

    let m: Map<Vertex, Vertex[]> = new Map();
    for (let vertex of this.vertecies) {
      let root = parent.get(vertex)!;
      if (!m.has(root)) {
        m.set(root, []);
      }
      m.get(root)!.push(vertex);
    }

    // Print the nodes in each connected component
    console.log("Following are connected components:");
    for (let [key, value] of m) {
      console.log(value.join(" ; "));
    }

    // Return the number of connected components
    return m;
  }

  _merge(parent: Map<Vertex, Vertex>, vertex: Vertex): Vertex {
    if (parent.get(vertex) !== vertex) {
      parent.set(vertex, this._merge(parent, parent.get(vertex)!));
    }
    return parent.get(vertex)!;
  }

  _getGraphsArrayWithStartAndAllEdges() {
    let edges = this._getEdges();
    let graphs = this.getConnectedComponents();
    let graphsArray: Graph[] = [];
    for (let [key, value] of graphs) {
      graphsArray.push(new Graph(key, value, []));
    }
    for (let graph of graphsArray) {
      for (let [vertex1, vertex2] of edges) {
        if (
          graph.allVertices.includes(vertex1) &&
          graph.allVertices.includes(vertex2)
        ) {
          graph.allEdges.push([vertex1, vertex2]);
        }
      }
    }
    console.log("graphsArray: ", graphsArray);
    return graphsArray;
  }

  _findCycles() {
    let visited: boolean[] = new Array(this.vertecies.length).fill(false);
    let stack: Vertex[] = [];
    for (let i = 0; i < this.vertecies.length; i++) {
      if (!visited[i]) {
        this._dfsForCycle(i, visited, -1, stack);
      }
    }
  }

  _dfsForCycle(
    vertexIndex: number,
    visited: boolean[],
    parentIndex: number,
    stack: Vertex[]
  ) {
    visited[vertexIndex] = true;
    stack.push(this.vertecies[vertexIndex]);

    for (let i = 0; i < this.vertecies.length; i++) {
      if (this.matrix.getCell(vertexIndex, i)) {
        if (!visited[i]) {
          this._dfsForCycle(i, visited, vertexIndex, stack);
        } else if (i !== parentIndex) {
          // Cycle detected
          let cycleStartIndex = stack.indexOf(this.vertecies[i]);
          let cycle = stack.slice(cycleStartIndex);
          if (cycle.length > 2) {
            console.log(
              `Cycle detected: ${cycle
                .map((vertex) => vertex.toString())
                .join(" -> ")}`
            );
            this.allCycles.push(cycle);
          }
        }
      }
    }
    stack.pop();
  }
}
