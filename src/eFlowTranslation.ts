import {LineSegment, Point, UniquePoints, UnorderdLineSegment} from './line-tools';

export function toEflowFormat(
    cycles: UnorderdLineSegment[][],
    minPoint: Float32Array,
    maxPoint: Float32Array
) {
    const outerPoints = [
        [minPoint[0] - 1000, minPoint[1] - 1000],
        [maxPoint[0] + 1000, minPoint[1] - 1000],
        [maxPoint[0] + 1000, maxPoint[1] + 1000],
        [minPoint[0] - 1000, maxPoint[1] + 1000],
    ];

    const holes = simpleFindPointInPolygon(cycles);

    const cyclesEflowIndices: number[][][] = cycles.map(() => []);
    let currIndex = 4;
    cycles.forEach((cycle, index) => {
        const [segmentPoints, pointOrder] = toEflowPoly(cycle, currIndex);
        cyclesEflowIndices[index].push(segmentPoints, pointOrder);
        currIndex += segmentPoints.length / 2;
    });
    const [segmentPointsInner, pointOrderInner] = cyclesEflowIndices.reduce(
        (acc, [segmentPoints, pointOrder]) => {
            acc[0].push(...segmentPoints);
            acc[1].push(...pointOrder);
            return acc;
        }
    );

    const segmentPoints = [...outerPoints.flat(), ...segmentPointsInner];
    const pointOrder = [0, 1, 1, 2, 2, 3, 3, 0, ...pointOrderInner];

    base.Domainpolygon.segmentPoints = segmentPoints;

    base.Domainpolygon.numberPoints = segmentPoints.length / 2;

    base.Domainpolygon.numberSegments = segmentPoints.length / 2;

    base.Domainpolygon.pointOrder = pointOrder;

    base.Domainpolygon.holes = holes;

    base.Domainpolygon.numberHoles = holes.length;

    // just for pFlow testing not nessary for eFlow
    const Exit = {
        xr: outerPoints[0][0],
        yr: outerPoints[0][1],
        xl: outerPoints[1][0],
        yl: outerPoints[1][1],
        weight: 1,
    };

    base.Exit[0] = Exit;

    // should return base and the Components to display also the Convex Hull Outline in the ui
    return base;
}

function simpleFindPointInPolygon(cycles: UnorderdLineSegment[][]) {
    return cycles.flatMap((cycle) => ({
        x: cycle[0].start.x,
        y: cycle[0].start.y,
    }));
}

function toEflowPoly(lines: UnorderdLineSegment[], currIndex: number) {
    const points: Point[] = [];
    lines.forEach((line) => {
        if (!points.includes(line.start)) points.push(line.start);
        if (!points.includes(line.end)) points.push(line.end);
    });

    const segmentPoints = points.map((p) => [p.x, p.y]).flat();
    const pointOrder = lines
        .map(({start, end}) => {
            return [points.indexOf(start) + currIndex, points.indexOf(end) + currIndex];
        })
        .flat();

    return [segmentPoints, pointOrder];
}

interface Hole {
    x: number;
    y: number;
}

const base = {
    name: 'Video2',
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
        decompositionLevel: 'medium',
        localRefinement: 0,
        localMarkMethod: 0,
        globalRefinement: 0,
    },
    Domainpolygon: {
        numberPoints: 0,
        segmentPoints: [] as number[],
        numberSegments: 0,
        pointOrder: [] as number[],
        numberHoles: 1,
        holes: [] as Hole[],
    },
    Grid: {},
};
