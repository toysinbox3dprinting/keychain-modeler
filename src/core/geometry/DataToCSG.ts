import csgApi from '../vendor/csg/dist/csg.esm.js';
import { Point } from "./geometry";

const { CSG } = csgApi as any;

export const dataToCSG = (vertices : Point[], indices : number[][]) => {
    // @ts-ignore
    const newCSG = CSG.polyhedron({
        points: vertices.map(vertex => [vertex.x, vertex.y, vertex.z]),
        faces: indices
    });

    return newCSG;
}
