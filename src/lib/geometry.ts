import { Indexer } from "../lib/vertexIndexer";
import api from "./csg/api";

export interface Polyhedron {
    csg: any;
    dimensions: {
        x: number,
        y: number,
        z: number
    }
}

const CSGToPolyhedron = (newCSG : any) : Polyhedron => {
    const CSGPolygons = newCSG.polygons;

    const triangles = [];
    const indexer = new Indexer();
    for(let polygon of CSGPolygons){
        const indices = polygon.vertices.map((vertex : any) => indexer.add(vertex));

        for (let i = 2; i < indices.length; i++) {
            triangles.push([indices[0], indices[i - 1], indices[i]]);
        }
    }

    const vertices = indexer.unique.map((v) => new Point(v.pos._x, v.pos._y, v.pos._z)) as Point[];

    return new Polyhedron(newCSG);
}

export class Polyhedron {
    constructor(csg : any){
        this.csg = csg;
        this.dimensions = {
            x: -1,
            y: -1,
            z: -1
        }
        this.updateDimensions();
    }

    copy() : Polyhedron {
        return new Polyhedron(this.csg);
    }

    flipX() : Polyhedron {
        const newCSG = api.transformations.mirror([1, 0, 0], this.csg);
        return CSGToPolyhedron(newCSG);
    }

    flipY() : Polyhedron {
        const newCSG = api.transformations.mirror([0, 1, 0], this.csg);
        return CSGToPolyhedron(newCSG);
    }

    flipZ() : Polyhedron {
        const newCSG = api.transformations.mirror([0, 0, 1], this.csg);
        return CSGToPolyhedron(newCSG);
    }

    export() : Polyhedron {
        // const newCSG = api.transformations.mirror([1, 0, 0], this.csg);
        return CSGToPolyhedron(this.csg.fixTJunctions());
    }

    exportFlipped() : Polyhedron {
        const newCSG = api.transformations.mirror([1, 0, 0], this.csg);
        return CSGToPolyhedron(newCSG.fixTJunctions());
    }

    updateDimensions() : void {
        let sX = Infinity, lX = -Infinity,
            sY = Infinity, lY = -Infinity, 
            sZ = Infinity, lZ = -Infinity;

        for(let polygon of this.csg.polygons){
            for(let vertex of polygon.vertices){
                const cX = vertex.pos._x, cY = vertex.pos._y, cZ = vertex.pos._z;
                if(cX > lX) lX = cX;
                else if(cX < sX) sX = cX;

                if(cY > lY) lY = cY;
                else if(cY < sY) sY = cY;

                if(cZ > lZ) lZ = cZ;
                else if(cZ < sZ) sZ = cZ;
            }
        }
        this.dimensions.x = lX - sX;
        this.dimensions.y = lY - sY;
        this.dimensions.z = lZ - sZ;
    }

    union(obj : Polyhedron){
        // @ts-ignore
        const newCSG = this.csg.union(obj.csg);
        return CSGToPolyhedron(newCSG);
    }

    subtract(obj : Polyhedron){
        // @ts-ignore
        const newCSG = this.csg.subtract(obj.csg);
        return CSGToPolyhedron(newCSG);
    }

    translate(dx : number, dy : number, dz : number){
        this.csg = api.transformations.translate([dx, dy, dz], this.csg);
    }

    setRotation(rx : number, ry : number, rz : number){
        this.csg = api.transformations.rotate(
            [rx, ry, rz], this.csg
        );
    }

    setSize(nx : number, ny : number, nz : number){
        this.csg = api.transformations.scale([
            nx / this.dimensions.x,
            ny / this.dimensions.y,
            nz / this.dimensions.z,
        ], this.csg);
        this.dimensions.x = nx;
        this.dimensions.y = ny;
        this.dimensions.z = nz;
    }

    setSizeX(nx : number){
        this.csg = api.transformations.scale([nx / this.dimensions.x, 1, 1], this.csg);
        this.dimensions.x = nx;
    }

    setSizeY(ny : number){
        this.csg = api.transformations.scale([1, ny / this.dimensions.y, 1], this.csg);
        this.dimensions.y = ny;
    }
}

export interface Point {
    x: number;
    y: number;
    z: number;

    copy(): Point;
}

export class Point {
    constructor(x: number, y: number, z: number){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    copy() : Point {
        return new Point(this.x, this.y, this.z);
    }
}