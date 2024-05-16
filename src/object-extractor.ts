
export class ObjectExtracor {
    unprocessedLines: number[] = [];

    addLines(lines: number[]) {
        for (let i = 0; i < lines.length; i++) {
            this.unprocessedLines.push(lines[i]);
        }
    }

    extract(): number[] {
        const splitLines = this.splitLines();
        return splitLines;
    }

    splitLines(): number[] {
        const processedLines: number[] = [];
        const lineRef = this.unprocessedLines;
        for (let i = 0; i < lineRef.length; i+=4) {
            let wasSplit = false;
            const startx = lineRef[i];
            const starty = lineRef[i+1];
            const endx = lineRef[i+2];
            const endy = lineRef[i+3];

            for (let j = i; j < lineRef.length; j+=4) {
                const res = this.checkLineLineIntersec(startx, starty, endx, endy, lineRef[j], lineRef[j+1], lineRef[j+2], lineRef[j+3]);
                if (!res) continue;
                processedLines.push(startx);
                processedLines.push(starty);

                processedLines.push(res[0]);
                processedLines.push(res[1]);
                processedLines.push(endx);
                processedLines.push(endy);
                processedLines.push(res[0]);
                processedLines.push(res[1]);


                processedLines.push(lineRef[j]);
                processedLines.push(lineRef[j+1]);
                processedLines.push(res[0]);
                processedLines.push(res[1]);
                processedLines.push(lineRef[j+2]);
                processedLines.push(lineRef[j+3]);
                processedLines.push(res[0]);
                processedLines.push(res[1]);
                wasSplit = true;
            }
            if (!wasSplit) {
                processedLines.push(startx);
                processedLines.push(starty);
                processedLines.push(endx);
                processedLines.push(endy);
            }
        }

        return processedLines;
    }

    checkLineLineIntersec(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
        x4: number,
        y4: number
    ): undefined | Float32Array {
        /* Check if lines match on point for point */
        if (
            (x1 === x3 && y1 === y3) ||
            (x1 === x4 && y1 === y4) ||
            (x2 === x3 && y2 === y3) ||
            (x2 === x4 && y2 === y4)
        )
            return;
        // Calculate the direction vectors of the segments
        const dA = {x: x2 - x1, y: y2 - y1};
        const dB = {x: x4 - x3, y: y4 - y3};

        // Calculate the denominator of the t1 and t2 equations
        const denominator = dA.x * dB.y - dA.y * dB.x;

        // If the denominator is zero, the lines are parallel
        if (denominator === 0) {
            return;
        }

        // Calculate the numerator of the t1 equation
        const numerator1 = (x3 - x1) * dB.y - (y3 - y1) * dB.x;
        // Calculate the numerator of the t2 equation
        const numerator2 = (x3 - x1) * dA.y - (y3 - y1) * dA.x;

        // Calculate t1 and t2
        const t1 = numerator1 / denominator;
        const t2 = numerator2 / denominator;

        // Check if t1 and t2 are within the valid range [0, 1]
        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
            // Calculate the intersection point
            const x = x1 + t1 * dA.x;
            const y = y1 + t1 * dA.y;
            return new Float32Array([x, y]);
        }

        // If t1 or t2 are not within the valid range, there is no intersection
        return;
    }

    checkPointLineIntersec(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
        x4: number,
        y4: number
    ): undefined | Float32Array {
        return;
    }

    _indexOf(x: number, y: number): number {
        for (let i = 0; i < this.vertecies.length; i += 2) {
            if (x === this.vertecies[i] && y === this.vertecies[i + 1]) return i;
        }
        return -1;
    }
}
