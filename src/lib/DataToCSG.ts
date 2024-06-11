import { CSG } from "./csg/csg";
import { Point } from "./geometry";

const pointToArray = (point : Point) : number[] => [point.x, point.y, point.z];
export const dataToCSG = (vertices : Point[], indices : number[][]) => {
    // @ts-ignore
    const newCSG = CSG.polyhedron({
        points: vertices.map(vertex => [vertex.x, vertex.y, vertex.z]),
        faces: indices
    });

    return newCSG;
}