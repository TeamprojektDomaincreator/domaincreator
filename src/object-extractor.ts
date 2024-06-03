import { findCycles } from './cycles';
import {LineSegment, Point, sweepLine} from './line-tools';
import { findOutlineOfConnectedCyclesLines } from './outline';

/**
 * Boolean Matrix that only requires memory for cells that have been set.
 *
 * @note The trade-off for lower memory usage is higher cost for setting
 * and getting the contents of the matrix. So be sure to use it only when a lot of
 * cells will remain unset.
 */
export class SpaceEfficientMatrix {
    cells: Set<number> = new Set();
    size: number;

    /**
     * @param size Dimension of the Matrix
     */
    constructor(size: number) {
        this.size = size;
    }

    setCell(row: number, col: number) {
        if (row > this.size || col > this.size) return;
        const rowS = Math.min(row, col);
        const colS = Math.max(row, col);
        this.cells.add(rowS* this.size + colS);
    }

    unsetCell(row: number, col: number) {
        if (row > this.size || col > this.size) return;
        this.cells.delete(row * this.size + col);
    }

    getCell(row: number, col: number): boolean {
        if (row > this.size || col > this.size) return false;
        const rowS = Math.min(row, col);
        const colS = Math.max(row, col);
        return this.cells.has(rowS* this.size + colS);
    }

    logMemorySavings() {
        const thisMemory = (((this.cells.size * 56) / 8) / 1000);
        const regMemory = (((this.size * this.size * 56) / 8) / 1000);
        const percent = thisMemory / regMemory;
        console.log(`Matrix: Memory footprint is ${thisMemory} kB.`)
        console.log(`        Using ${((percent) * 100).toFixed(5)}% of the space of a regular Matrix.`)
    }

    decodeCell(cell: number): [number, number] {
        const row = Math.floor(cell / this.size);
        const col = cell - (row * this.size);
        return [row, col];
    }


    getAllConnectedGraphs(points: Point[]): LineSegment[][]{
        let time = performance.now();
        const arr = Array.from(this.cells);
        if (arr[0] === 0) arr.shift();
        const res: LineSegment[][] = [];
        const sets: Set<number>[] = [];
        let cell: number | undefined;
        let currentIndex = -1;
        let totalLoopCount = 0;
        while (arr.length > 0) {
            cell = arr.shift();
            if (!cell) break;
            let lookFor: Set<number> = new Set();
            currentIndex++;
            res.push([]);
            const row = Math.floor(cell / this.size);
            const col = cell - (row * this.size);
            res[currentIndex].push(new LineSegment(points[row], points[col]));
            lookFor.add(row).add(col);
            const skipped: number[] = [];
            let found = false;
            do {
                let i = 0;
                found = false;
                while (i < arr.length) {
                    totalLoopCount++;
                    const row2 = Math.floor(arr[i] / this.size);
                    const col2 = arr[i] - (row2 * this.size);
                    if (lookFor.has(row2) || lookFor.has(col2)) {
                        res[currentIndex].push(new LineSegment(points[row2], points[col2]));
                        lookFor.add(row2).add(col2);
                        arr.splice(i, 1);
                        found = true;
                        continue;
                    }
                    i++;
                }
            } while (found);
        }
        time = performance.now() - time;
        console.log(`Looped over ${totalLoopCount} elements, for ${points.length} amount of points. This took: ${time} ms`)

        // @todo: try to merge all found graphs

        return res;
    }
}

export class UniquePoints {
    points: Point[] = [];

    addPoint(p: Point) {
        if (this.points.length === 0) {
            this.points.push(p);
            return;
        }

        let lower = 0;
        let upper = this.points.length - 1;
        let middle = 0;

        while (lower <= upper) {
            middle = Math.floor((upper + lower) / 2);
            const currentPoint = this.points[middle];

            if (currentPoint.equals(p)) {
                return; // Point already exists, do not add
            }

            if (currentPoint.x < p.x || (currentPoint.x === p.x && currentPoint.y < p.y)) {
                lower = middle + 1;
            } else {
                upper = middle - 1;
            }
        }

        // Insert the point in the correct position
        this.points.splice(lower, 0, p);
    }

    indexOf(p: Point): number {
        let lower = 0;
        let upper = this.points.length - 1;
        let middle = 0;

        while (lower <= upper) {
            middle = Math.floor((upper + lower) / 2);
            const currentPoint = this.points[middle];

            if (currentPoint.equals(p)) {
                return middle;
            }

            if (currentPoint.x < p.x || (currentPoint.x === p.x && currentPoint.y < p.y)) {
                lower = middle + 1;
            } else {
                upper = middle - 1;
            }
        }

        return -1; // Point not found
    }

    getPointsSortedByY(): Point[] {
        return this.points.sort((a, b) => {
            if (a.y < b.y) {
                return -1;
            }
            if (a.y > b.y) {
                return 1;
            }
            // If y values are equal, sort by x
            if (a.x < b.x) {
                return -1;
            }
            if (a.x > b.x) {
                return 1;
            }
            return 0;
        });
    }
}

export class ObjectExtractor {
    unprocessedLines: number[] = [];
    points: UniquePoints = new UniquePoints();

    addLines(lines: number[]) {
        // Use push.apply to add all elements at once
        Array.prototype.push.apply(this.unprocessedLines, lines);
    }

    extract2(): number[][] {
        const res = sweepLine(this.unprocessedLines);
        for (let i = 0; i < res.length; i += 4) {
            const start = new Point(res[i], res[i + 1]);
            const end = new Point(res[i + 2], res[i + 3]);
            this.points.addPoint(start);
            this.points.addPoint(end);
        }
        const matrix = new SpaceEfficientMatrix(this.points.points.length);
        for (let i = 0; i < res.length; i += 4) {
            const start = new Point(res[i], res[i + 1]);
            const end = new Point(res[i + 2], res[i + 3]);
            const index1 = this.points.indexOf(start);
            const index2 = this.points.indexOf(end);
            if (index1 === -1 || index2 === -1) continue;
            matrix.setCell(index1, index2);
            matrix.setCell(index2, index1);
        }
        const indices = matrix.getAllConnectedGraphs(this.points.points);
        const allCycles: LineSegment[][] = [];
        indices.forEach((i) => {
            const cycle = findCycles(i);
            cycle.forEach((c) => {
                allCycles.push(c);
            })

            console.log('allCycles: ', allCycles);
        })

        const outlines = findOutlineOfConnectedCyclesLines(allCycles)
        
        const res3 = outlines.map((o) => {
            return [o.start.x, o.start.y, o.end.x, o.end.y];
        })




        const res2: number[][] = [];
        let index = -1;
        indices.forEach((i) => {
            res2.push([]);
            index++;
            for (const s of i) {
                res2[index].push(s.start.x, s.start.y, s.end.x, s.end.y);
            }
        })
        matrix.logMemorySavings();
        return res3;

    }

    extract(): number[] {
        let time = performance.now();
        const res = sweepLine(this.unprocessedLines);
        time = performance.now() - time;
        console.log(`SweepLine: Took ${time} ms to split all intersecting lines.`);
        time = performance.now();
        for (let i = 0; i < res.length; i += 4) {
            const start = new Point(res[i], res[i + 1]);
            const end = new Point(res[i + 2], res[i + 3]);
            this.points.addPoint(start);
            this.points.addPoint(end);
        }
        const matrix = new SpaceEfficientMatrix(this.points.points.length);
        for (let i = 0; i < res.length; i += 4) {
            const start = new Point(res[i], res[i + 1]);
            const end = new Point(res[i + 2], res[i + 3]);
            const index1 = this.points.indexOf(start);
            const index2 = this.points.indexOf(end);
            if (index1 === -1 || index2 === -1) continue;
            matrix.setCell(index1, index2);
            matrix.setCell(index2, index1);
        }
        time = performance.now() - time;
        console.log(`Matrix: Took ${time} ms to construct adjecancy matrix`);
        matrix.logMemorySavings();
        return res;
    }
}


function linesToEflowFormat(lines: LineSegment[], points: Point[]) {
    const base = {
        name: "Video2",
        Scenario: {
          charLength: 34,
          charDensity: 8,
          charVelocity: 1.34,
          startPersons: 100,
          randPersons: 1,
          maxTime: 20,
        },
        Fundamentaldiagramm: 5,
        Infection: {
          percentInfected: 0.05,
          criticalDistance: 0.5,
          infectionRate: 65,
          percentRemoved: 0.1,
          resistanceTime: 1,
          moveMode: 0,
        },
        Agents: 1,
        Measurementstations: [],
        Entrance: [],
        Exit: [] as any[],
        Attractors: [],
        SubdomainsFD: [],
        SubdomainsRhoInit: [],
        Refinement: {
          decompositionLevel: "medium",
          localRefinement: 0,
          localMarkMethod: 0,
          globalRefinement: 0,
        },
        Domainpolygon: {
          numberPoints: 0,
          segmentPoints: [] as number[],
          numberSegments: 0,
          pointOrder: [] as number[],
          numberHoles: 0,
          holes: [],
        },
        Grid: {},
      };
    
        const numberPoints = points.length;
        const numberSegments = points.length;
    
        const segmentPoints = points
          .map((p) => p.toLinePoint())
          .flat();
    
        const pointOrder = lines.map(({start, end}) => {
          return [
            points.indexOf(start),
            points.indexOf(end),
          ];
        }).flat();
    
        // just for testing
        const Exit = lines.map(({start, end}, index) => {
            if (index === 0) {
                return {
                    xr: start.x,
                    yr: start.y,
                    xl: end.x,
                    yl: end.y,
                    weight: 1,
                }
            }
        } )[0];
    
        console.log("segmentPoints: ", segmentPoints);
        console.log("pointOrder: ", pointOrder);
    
        base.Domainpolygon.numberPoints = numberPoints;
    
        base.Domainpolygon.segmentPoints = segmentPoints;
    
        base.Domainpolygon.numberSegments = numberSegments;
    
        base.Domainpolygon.pointOrder = pointOrder;
    
        base.Exit[0] = Exit; // just for testing
    
        return base;
}