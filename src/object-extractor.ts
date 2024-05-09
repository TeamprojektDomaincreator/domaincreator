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
        this.currentSize = size / 2 + 1 // @todo: Tune later 
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
    getCell(row: number, col: number): number{
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
        this.cells = newCells
    }

    print(){
        let printstring: string = "    ";
        for (let i = 0; i < this.currentSize; i++) {
            printstring += String(i) + " ";
        }
        console.log(printstring+"\n");
        printstring = "";
        let count = 0;
        for(let i = 0; i < this.cells.length; i++) {
            if(i % this.currentSize === 0) {
                console.log(printstring+"\n");
                printstring = String(count) +"   ";
                count++;
            }
            printstring += String(this.cells[i]) + " ";
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
            this.matrix.setCell(end_index, start_index); // @todo: Remove unnecessary step, this can be assumed + shrink matrix by half
        }
        this.matrix.print();
        for (let i = 0; i < this.vertecies.length; i++) {
            console.log(`Index ${i} = X: ${this.vertecies[i].x} | Y: ${this.vertecies[i].y}`);
        }
    }

    indexOf(vertex: Vertex): number {
        for (let i = 0; i < this.vertecies.length; i++) {
            if (this.vertecies[i].equals(vertex)) return i;
        }
        return -1;
    }
}