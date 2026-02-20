import earcut from '../earcut.esm.js';
import { Point2D, Point3D, PolygonGroup, Triple } from './types';

const flattenArray = <T>(array: T[][]): T[] => array.reduce((a, v) => a.concat(v), [] as T[]);

const chunkInto3 = (array: number[]): Triple[] => {
    const result: Triple[] = [];
    for (let i = 0; i < array.length; i += 3) {
        result.push(array.slice(i, i + 3) as Triple);
    }
    return result;
};

const point3Dto2D = (point: Point3D): Point2D => [point[0], point[1]];

export const buildExtrudedMesh = (
    groups: PolygonGroup[],
    height: number,
    reverseOrder: boolean,
): { vertices: Point3D[]; indices: number[][] } => {
    const vertices: Point3D[] = [];
    const indices: number[][] = [];

    let offset = 0;
    for (let group of groups) {
        offset += group.base.length;
        for (let hole of group.holes) {
            offset += hole.length;
        }
    }

    let currentOffset = 0;
    for (let group of groups) {
        const curVertices = [...group.base, ...flattenArray<Point3D>(group.holes)];
        let initialHoleOffset = group.base.length;

        const holeIndices = group.holes.map((hole) => {
            const curOffset = initialHoleOffset;
            initialHoleOffset += hole.length;
            return curOffset;
        });

        const loopOffset = currentOffset;
        const triangulated = holeIndices.length > 0
            ? earcut(flattenArray(curVertices.map((vertex) => point3Dto2D(vertex))), holeIndices)
            : earcut(flattenArray(curVertices.map((vertex) => point3Dto2D(vertex))));

        const curIndices = chunkInto3(triangulated).map((index) => index.map((i) => i + loopOffset));

        vertices.push(...curVertices);
        indices.push(...curIndices);

        indices.push(...curIndices.map((index) => [
            index[1] + offset,
            index[0] + offset,
            index[2] + offset,
        ]));

        let prev = group.base.length - 1;
        const sideFaces: number[][] = [];

        for (let i = 0; i < group.base.length; i++) {
            sideFaces.push([
                prev + currentOffset,
                i + currentOffset,
                prev + offset + currentOffset,
            ]);
            sideFaces.push([
                i + currentOffset,
                i + offset + currentOffset,
                prev + offset + currentOffset,
            ]);
            prev = i;
        }

        for (let j = 0; j < group.holes.length; j++) {
            prev = group.holes[j].length - 1;
            for (let i = 0; i < group.holes[j].length; i++) {
                sideFaces.push([
                    prev + currentOffset + holeIndices[j],
                    i + currentOffset + holeIndices[j],
                    prev + offset + currentOffset + holeIndices[j],
                ]);
                sideFaces.push([
                    i + currentOffset + holeIndices[j],
                    i + offset + currentOffset + holeIndices[j],
                    prev + offset + currentOffset + holeIndices[j],
                ]);
                prev = i;
            }
        }

        indices.push(
            ...sideFaces.map((triple) => (reverseOrder ? [triple[1], triple[0], triple[2]] : triple)),
        );

        currentOffset += group.base.length;
        for (let hole of group.holes) {
            currentOffset += hole.length;
        }
    }

    vertices.push(...vertices.map((point) => [point[0], point[1], height] as Point3D));

    return {
        vertices,
        indices,
    };
};
