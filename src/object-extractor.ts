class Matrix {

    size;

    cells: number[] = [];

    /**
     * 
     * @param size Worst case size. (No lines match)
     */
    constructor(size: number) {
        this.size = size;
    }

    setCell(row: number, col: number) {
        if (row > this.size || col > this.size) return;
        if (row > col) {
            const temp = row;
            row = col;
            col = temp;
        }
        this.cells.push(row * this.size + col)
    }

    /**
     * Gets contents of cell
     * 
     * @param row 
     * @param col 
     * @returns -1 If row or col is invalid.
     */
    getCell(row: number, col: number): number{
        if (row > this.size || col > this.size) return -1;
        if (row > col) {
            const temp = row;
            row = col;
            col = temp;
        }
        return this.cells.indexOf(row * this.size + col) === -1 ? 0 : 1
    }

    print(){
        let printstring: string = "    ";
        for (let i = 0; i < this.size; i++) {
            printstring += String(i) + " ";
        }
        console.log(printstring+"\n");
        printstring = "";
        let count = 0;
        let res = 0;
        for(let i = 0; i < this.size * this.size; i++) {
            if(i % this.size === 0) {
                console.log(printstring+"\n");
                printstring = String(count) +"   ";
                count++;
            }
            res = this.cells.indexOf(i) === -1 ? 0 : 1;
            printstring += String(res + " ");
        }
                console.log(printstring+"\n");
    }
}
class Vertex {
    x: number;
    y: number;

    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }
    equals(vertex: Vertex): boolean{
        return this.x === vertex.x && this.y === vertex.y;
    }
}

export class AdjacencyMatrix{

    vertecies: Vertex[] = [];
    matrix: Matrix;

    constructor(size: number){
        this.matrix = new Matrix(size);
    }

    addLines(lines: number[]) {
        let time = performance.now();
        for (let i = 0; i < lines.length; i+=4) {
            const start = new Vertex(lines[i], lines[i+1]);
            const end = new Vertex(lines[i+2], lines[i+3]);
            let start_index = this.indexOf(start);
            let end_index = this.indexOf(end);
            if (start_index === -1) {
                start_index = this.vertecies.push(start) - 1;
            }

            if (end_index === -1) {
                end_index = this.vertecies.push(end) - 1;
            }

            this.matrix.setCell(start_index, end_index);
        }
        time = performance.now() - time;
        console.log(time)
        console.log(((this.matrix.cells.length * 64) / 8) / 1024);
        this.matrix.print();
        for (let i = 0; i < this.vertecies.length; i++) {
            console.log(`Index ${i} = X: ${this.vertecies[i].x} | Y: ${this.vertecies[i].y}`);
        }
    }

    indexOf(vertex: Vertex): number {
        for (let i = this.vertecies.length - 1; i >= 0; i--) {
            if (this.vertecies[i].equals(vertex)) return i;
        }
        return -1;
    }
}