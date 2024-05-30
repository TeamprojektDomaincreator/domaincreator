import {Point, sweepLine} from './line-tools';

/**
 * Boolean Matrix that only requires memory for cells that have been set.
 *
 * @note The trade-off for lower memory usage is higher cost for setting
 * and getting the contents of the matrix. So be sure to use it only when a lot of
 * cells will remain unset.
 */
class SpaceEfficientMatrix {
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
        this.cells.add(row * this.size + col);
    }

    unsetCell(row: number, col: number) {
        if (row > this.size || col > this.size) return;
        this.cells.delete(row * this.size + col);
    }

    getCell(row: number, col: number): boolean {
        if (row > this.size || col > this.size) return false;
        return this.cells.has(row * this.size + col);
    }

    logMemorySavings() {
        const thisMemory = (((this.cells.size * 56) / 8) / 1000);
        const regMemory = (((this.size * this.size * 56) / 8) / 1000);
        const percent = thisMemory / regMemory;
        console.log(`Matrix: Memory footprint is ${thisMemory} kB.`)
        console.log(`        Using ${((percent) * 100).toFixed(5)}% of the space of a regular Matrix.`)
    }
}

/**
 * Sorted unique points
 */
class UniquePoints {
    points: Point[] = [];

    addPoint(p: Point) {
        if (this.points.length === 0) {
            this.points.push(p);
            return;
        }

        let lower = 0;
        let upper = this.points.length -1;
        let middle = 0;


        while(true) {
            middle = Math.ceil((upper + lower) / 2);
            if (upper - lower < 2) {
                if (this.points[middle].equals(p)) return;
                if( this.points[middle].x < p.x ) middle += 1;
                else if (this.points[middle].x === p.x && this.points[middle].y < p.y) middle += 1;
                this.points.splice(middle, 0, p);
                break;
            }
            if (this.points[middle].x < p.x) {
                lower = middle;
                continue;
            }
            if (this.points[middle].x > p.x) {
                upper = middle;
                continue;
            }
            if (this.points[middle].y < p.y) {
                lower = middle;
                continue;
            }
            if (this.points[middle].y > p.y) {
                upper = middle;
                continue;
            }
            if (this.points[middle].equals(p)) return;
            this.points.splice(middle, 0, p);
            break;

        }
    }

    indexOf(p: Point): number {
        let lower = 0;
        let upper = this.points.length -1;
        let middle = 0;

        while(true) {
            middle = Math.ceil((upper + lower) / 2);
            if (this.points[middle].equals(p)) return middle;
            if (upper - lower < 2) return -1; 
            if (this.points[middle].x < p.x) {
                lower = middle;
                continue;
            }
            if (this.points[middle].x > p.x) {
                upper = middle;
                continue;
            }
            if (this.points[middle].y < p.y) {
                lower = middle;
                continue;
            }
            if (this.points[middle].y > p.y) {
                upper = middle;
                continue;
            }
            if (this.points[middle].equals(p)) return middle;
            return -1;
        }
    }
}

export class ObjectExtractor {
    unprocessedLines: number[] = [];
    points: UniquePoints = new UniquePoints();

    addLines(lines: number[]) {
        // Use push.apply to add all elements at once
        Array.prototype.push.apply(this.unprocessedLines, lines);
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
