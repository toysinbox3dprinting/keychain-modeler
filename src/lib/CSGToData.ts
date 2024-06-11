import { Polyhedron } from "../lib/geometry";
import { Indexer } from "./vertexIndexer";

export const CSGToData = (newCSG : Polyhedron) => {
    const CSGPolygons = newCSG.csg.toPolygons();

    const triangles = [];
    const indexer = new Indexer();
    for(let polygon of CSGPolygons){
        const indices = polygon.vertices.map((vertex : any) => indexer.add(vertex));

        for (let i = 2; i < indices.length; i++) {
            triangles.push([indices[0], indices[i - 1], indices[i]]);
        }
    }

    const vertices = indexer.unique.map(v => [v.pos.x, v.pos.y, v.pos.z]);

    return {
        vertices: vertices,
        indices: triangles
    };
}