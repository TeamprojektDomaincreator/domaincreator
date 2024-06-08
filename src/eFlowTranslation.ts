import { Point, UnorderdLineSegment } from './line-tools';

export function toEflowFormat(
    cycles: UnorderdLineSegment[][],
    outline: UnorderdLineSegment[]
) {
    const cyclesWithOutline = [outline, ...cycles];
    const cyclesEflowIndices: number[][][] = cyclesWithOutline.map(() => []);
    
    cyclesWithOutline.forEach((cycle, index) => {
        const [segmentPoints, pointOrder] = toEflowPoly(cycle, index);
        cyclesEflowIndices[index].push(segmentPoints, pointOrder);
    });

    const eFlowHoles: EFlowHole[] = cyclesEflowIndices.map(([segmentPoints, _]) => {
        const eFlowHole: EFlowHole = {
            corners: [],
            closed: true,
        };
        for (let index = 0; index < segmentPoints.length; index += 2) {
            eFlowHole.corners.push(
                {
                    id: Math.random().toString(23).slice(2),
                    x: segmentPoints[index] / 100,
                    y: segmentPoints[index + 1] / 100,
                },
            );
        }
        return eFlowHole
    });

    const [segmentPoints, pointOrder] = cyclesEflowIndices.reduce(
        (acc, [segmentPoints, pointOrder]) => {
            acc[0].push(...segmentPoints);
            acc[1].push(...pointOrder);
            return acc;
        }
    );

    const holes = simpleFindPointInPolygon(cycles);

    base.Domainpolygon.segmentPoints = segmentPoints.map((point) => point / 100);

    base.Domainpolygon.numberPoints = segmentPoints.length / 2;

    base.Domainpolygon.numberSegments = segmentPoints.length / 2;

    base.Domainpolygon.pointOrder = pointOrder;

    base.Domainpolygon.holes = holes;

    base.PolygonCorners = eFlowHoles[0];  
    
    base.HoleCorners = eFlowHoles.slice(1);

    base.Domainpolygon.numberHoles = holes.length;

    // should return base and the Components to display also the Convex Hull Outline in the ui
    return {base: base, cyclesWithOutline: cyclesWithOutline};
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
        .map(({ start, end }) => {
            return [points.indexOf(start) + currIndex, points.indexOf(end) + currIndex];
        })
        .flat();

    return [segmentPoints, pointOrder];
}

interface Hole {
    x: number;
    y: number;
}

interface EFlowHole {
    corners: Corner[];
    closed: true;
}

interface Corner {
    id: string;
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
    PolygonCorners: {
        corners: [] as Corner[],
        closed: true
    },
    HoleCorners: [] as EFlowHole[],
    BackgroundImagePosition: {
        name: "default",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
    }
};
