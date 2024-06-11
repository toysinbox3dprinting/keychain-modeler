import { dataToCSG } from "../lib/DataToCSG";
import { Point, Polyhedron } from "../lib/geometry";

export const createBox = (
    BLCoord : Point, l : number, w : number, h : number
) : Polyhedron => {
    const coord000_0 = BLCoord.copy();
    const coord001_1 = BLCoord.copy();
    coord001_1.x += l;
    const coord010_2 = BLCoord.copy();
    coord010_2.y += w;
    const coord011_3 = BLCoord.copy();
    coord011_3.x += l;
    coord011_3.y += w;

    const coord100_4 = BLCoord.copy();
    coord100_4.z += h;
    const coord101_5 = BLCoord.copy();
    coord101_5.x += l;
    coord101_5.z += h;
    const coord110_6 = BLCoord.copy();
    coord110_6.y += w;
    coord110_6.z += h;
    const coord111_7 = BLCoord.copy();
    coord111_7.x += l;
    coord111_7.y += w;
    coord111_7.z += h;

    const vertices = [
        coord000_0, coord001_1, coord010_2, coord011_3,
        coord100_4, coord101_5, coord110_6, coord111_7
    ];

    const indices = [
        [2, 0, 1], [3, 2, 1], // bottom
        [1, 0, 4], [1, 4, 5], // front
        [3, 1, 5], [3, 5, 7], // right
        [2, 4, 0], [6, 4, 2], // left
        [6, 2, 3], [7, 6, 3], // back
        [7, 5, 6], [5, 4, 6] // top
    ];

    const CSG = dataToCSG(vertices, indices);

    const cube = new Polyhedron(CSG);

    return cube;
}