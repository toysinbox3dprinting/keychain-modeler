import { dataToCSG } from "./DataToCSG";
import { Point, Polyhedron } from "./geometry";

export const createSphere = (
    radius : number, resolution : number
) => {
    // generate rings
    const rings = [];
    for(let t = 0; t < Math.PI; t += Math.PI / resolution){
        const currentRing : Point[] = [];
        for(let p = 0; p < Math.PI * 2; p += Math.PI * 2 / resolution){
            currentRing.push(new Point(
                radius * Math.sin(t) * Math.cos(p),
                radius * Math.sin(t) * Math.sin(p),
                radius * Math.cos(t) + radius
            ));
        }

        rings.push(currentRing);
    }

    const vertices = rings.reduce((a, v) => a.concat(v), []);
    // add top & bottom points
    vertices.push( 
        new Point(0, 0, radius * 2),
        new Point(0, 0, 0)
    );

    // stitch rings into triangle strips w/ indices
    const indices : number[][] = [];
    for(let z = 1; z < rings.length - 1; z++){
        const offsetZ = z * resolution;
        const nextOffsetZ = (z + 1) * resolution;

        for(let a = 0; a < rings[z].length - 1; a++){   
            indices.push(
                [offsetZ + a, offsetZ + a + 1, nextOffsetZ + a + 1],
                [nextOffsetZ + a, offsetZ + a, nextOffsetZ + a + 1]
            );
        }

        indices.push(
            [offsetZ, nextOffsetZ, offsetZ + rings[z].length - 1], 
            [offsetZ + rings[z].length - 1, nextOffsetZ, nextOffsetZ + rings[z].length - 1]
        );
    }

    // add triangles at top & bottom 
    for(let a = 0; a < rings[0].length - 1; a++){
        indices.push(
            [a + resolution + 1, a + resolution, vertices.length - 2],
            [a + (rings.length - 1) * resolution, a + (rings.length - 1) * resolution + 1, vertices.length - 1]
        );
    }
    indices.push(
        [resolution, (rings.length - 1) + resolution, vertices.length - 2],
        [rings[0].length - 1 + (rings.length - 1) * resolution, (rings.length - 1) * resolution, vertices.length - 1],
    );

    const CSG = dataToCSG(vertices, indices);
    const sphere = new Polyhedron(CSG);

    return sphere;
}
