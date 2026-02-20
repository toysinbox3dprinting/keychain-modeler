import { Point3D, PolygonGroup } from './types';

export const polygonClockwise = (poly: Point3D[], reverseOrder: boolean): boolean => {
    let sum = 0;
    for (let i = 0; i < poly.length - 1; i++) {
        sum += poly[i][0] * poly[i + 1][1] - poly[i][1] * poly[i + 1][0];
    }
    sum += poly[poly.length - 1][0] * poly[0][1] - poly[poly.length - 1][1] * poly[0][0];

    return reverseOrder ? !(sum > 0) : sum > 0;
};

const pointInPolygon = (point: Point3D, vs: Point3D[]): boolean => {
    const x = point[0];
    const y = point[1];

    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0];
        const yi = vs[i][1];
        const xj = vs[j][0];
        const yj = vs[j][1];

        const intersect = (yi > y) !== (yj > y)
            && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
};

const polygonInPolygon = (poly1: Point3D[], poly2: Point3D[]): boolean => {
    return poly1.every((point) => pointInPolygon(point, poly2));
};

const getPolygonArea = (poly: Point3D[]): number => {
    let sum = 0;
    for (let i = 0; i < poly.length - 1; i++) {
        sum += poly[i][0] * poly[i + 1][1] - poly[i][1] * poly[i + 1][0];
    }
    sum += poly[poly.length - 1][0] * poly[0][1] - poly[poly.length - 1][1] * poly[0][0];

    return Math.abs(sum / 2);
};

export const buildPolygonGroups = (
    letterSeparatedPoints: Point3D[][][],
    reverseOrder: boolean,
): PolygonGroup[] => {
    const groups: PolygonGroup[] = [];

    for (let letter of letterSeparatedPoints) {
        if (letter.length === 1) {
            groups.push({
                base: letter[0],
                holes: [],
            });
            continue;
        }

        letter.sort((a, b) => getPolygonArea(a) - getPolygonArea(b));

        for (let i = letter.length - 1; i >= 0; i--) {
            const outerPolygon = letter[i];

            if (polygonClockwise(outerPolygon, reverseOrder)) {
                continue;
            }

            const potentialHoles: Point3D[][] = [];

            for (let j = i - 1; j >= 0; j--) {
                const innerPolygon = letter[j];

                if (!polygonClockwise(innerPolygon, reverseOrder)) {
                    continue;
                }

                if (!polygonInPolygon(innerPolygon, outerPolygon)) {
                    continue;
                }

                let redundant = false;
                for (let validHole of potentialHoles) {
                    if (polygonInPolygon(innerPolygon, validHole)) {
                        redundant = true;
                        break;
                    }
                }

                if (!redundant) {
                    potentialHoles.push(innerPolygon);
                }
            }

            groups.push({
                base: outerPolygon,
                holes: potentialHoles,
            });
        }
    }

    return groups;
};
