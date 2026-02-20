import { Point3D } from './types';

const svgCommandSetToPoints = (commandSet: any, curveStepCount: number): Point3D[] => {
    let p: Point3D = [0, 0, 0];
    let p0: Point3D;
    let p1: Point3D;
    let p2: Point3D;
    let p3: Point3D;
    let points: Point3D[] = [];

    for (let c of commandSet) {
        const commandType: string = c.type;
        let pcp: Point3D = [0, 0, 0];
        const cx = c.x || 0;
        const cx1 = c.x1 || 0;
        const cx2 = c.x2 || 0;
        const cy = c.y || 0;
        const cy1 = c.y1 || 0;
        const cy2 = c.y2 || 0;

        switch (commandType) {
            case 'M':
                p = [cx, cy, 0];
                break;
            case 'L':
                points.push(p);
                p = [cx, cy, 0];
                break;
            case 'H':
                points.push(p);
                p = [cx, p[1], 0];
                break;
            case 'V':
                points.push(p);
                p = [p[0], cy, 0];
                break;
            case 'C':
                p0 = p;
                p1 = [cx1, cy1, 0];
                p2 = [cx2, cy2, 0];
                p3 = [cx, cy, 0];
                for (let t = 0; t < 1; t += 1 / curveStepCount) {
                    points.push(p);
                    p = [
                        (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t ** 2 * p2[0] + t ** 3 * p3[0],
                        (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t ** 2 * p2[1] + t ** 3 * p3[1],
                        0,
                    ];
                }
                pcp = p2;
                break;
            case 'S':
                p0 = p;
                p2 = [cx2, cy2, 0];
                p3 = [cx, cy, 0];
                p1 = [
                    -pcp[0] + p[0] + p[0],
                    -pcp[1] + p[1] + p[1],
                    0,
                ];
                for (let t = 0; t < 1; t += 1 / curveStepCount) {
                    points.push(p);
                    p = [
                        (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t ** 2 * p2[0] + t ** 3 * p3[0],
                        (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t ** 2 * p2[1] + t ** 3 * p3[1],
                        0,
                    ];
                }
                pcp = p2;
                break;
            case 'Q':
                p0 = p;
                p1 = [cx1, cy1, 0];
                p2 = [cx, cy, 0];
                for (let t = 0; t < 1; t += 1 / curveStepCount) {
                    points.push(p);
                    p = [
                        p1[0] + (1 - t) ** 2 * (p0[0] - p1[0]) + t ** 2 * (p2[0] - p1[0]),
                        p1[1] + (1 - t) ** 2 * (p0[1] - p1[1]) + t ** 2 * (p2[1] - p1[1]),
                        0,
                    ];
                }
                pcp = p1;
                break;
            case 'T':
                p0 = p;
                p2 = [cx, cy, 0];
                p1 = [
                    -pcp[0] + p[0] + p[0],
                    -pcp[1] + p[1] + p[1],
                    0,
                ];
                for (let t = 0; t < 1; t += 1 / curveStepCount) {
                    points.push(p);
                    p = [
                        p1[0] + (1 - t) ** 2 * (p0[0] - p1[0]) + t ** 2 * (p2[0] - p1[0]),
                        p1[1] + (1 - t) ** 2 * (p0[1] - p1[1]) + t ** 2 * (p2[1] - p1[1]),
                        0,
                    ];
                }
                pcp = p1;
                break;
            default:
                console.log(`The command "${commandType}" is not supported`);
        }
    }

    points.push(p);
    return points;
};

export const svgPathsToPoints = (rawLetterSVGPaths: any, curveStepCount: number): Point3D[][][] => {
    const letterSeparatedSVGPaths: any = [];

    for (let rawLetterSVGPath of rawLetterSVGPaths) {
        letterSeparatedSVGPaths.push([[]]);
        const lastIndex = letterSeparatedSVGPaths.length - 1;

        for (let command of rawLetterSVGPath.commands) {
            if (command.type === 'Z' || command.type === 'z') {
                letterSeparatedSVGPaths[lastIndex].push([]);
            } else {
                const currentLetter = letterSeparatedSVGPaths[lastIndex];
                const currentPathIndex = currentLetter.length - 1;
                currentLetter[currentPathIndex].push(command);
            }
        }

        letterSeparatedSVGPaths[lastIndex].pop();
    }

    const letterSeparatedPoints: Point3D[][][] = [];
    for (let letterSeparatedSVGPath of letterSeparatedSVGPaths) {
        letterSeparatedPoints.push([]);

        for (let partLetterSVGPath of letterSeparatedSVGPath) {
            const lastIndex = letterSeparatedPoints.length - 1;
            letterSeparatedPoints[lastIndex].push(svgCommandSetToPoints(partLetterSVGPath, curveStepCount));
        }
    }

    return letterSeparatedPoints;
};
