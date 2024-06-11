import { dataToCSG } from "../lib/DataToCSG";
import { Point, Polyhedron } from "../lib/geometry";

export const createCylinder = (
    radius : number, height : number, resolution : number
) => {
    // generate rings
    const topRing = [], bottomRing = [];
    for(let p = 0; p < Math.PI * 2; p += Math.PI * 2 / resolution){
        topRing.push(new Point(Math.sin(p) * radius, Math.cos(p) * radius, 0));
        bottomRing.push(new Point(Math.sin(p) * radius, Math.cos(p) * radius, height));
    }

    const vertices = topRing.concat(bottomRing);
    // add origin pts easily triangulate base faces
    vertices.push(
        new Point(0, 0, 0),
        new Point(0, 0, height)
    );

    // stitch rings into triangle strips w/ indices
    const indices : number[][] = [];
    for(let i = 0; i < topRing.length - 1; i++){
        indices.push(
            // side triangle strips
            [i, i + 1, i + topRing.length + 1],
            [i, i + topRing.length + 1, i + topRing.length],

            // base triangles
            [i + 1, i, vertices.length - 2],
            [i + topRing.length, i + topRing.length + 1, vertices.length - 1]
        );
    }
    // treat edge cases
    indices.push(
        [topRing.length - 1, 0, topRing.length],
        [topRing.length - 1, topRing.length, topRing.length * 2 - 1],

        [0, topRing.length - 1, vertices.length - 2],
        [topRing.length * 2 - 1, topRing.length, vertices.length - 1]
    );

    const CSG = dataToCSG(vertices, indices);
    const cylinder = new Polyhedron(CSG);

    return cylinder;
}