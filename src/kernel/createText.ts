import earcut from '../lib/earcut';
import { ArraySlice } from '../lib/ArraySlice';
import { Point, Polyhedron } from '../lib/geometry';
import { dataToCSG } from '../lib/DataToCSG';
import opentype from 'opentype.js';

async function loadFont (url : string) {
    return await new Promise(
      (resolve, reject) => opentype.load(
          // @ts-ignore
        url, (err, font) => err ? reject(err) : resolve(font), undefined
      )
    )
}

export const createText = async (text : string, fontPath : string, fontHeight : number, height : number, resolution : number) : Promise<Polyhedron> => {
    // const font = opentype.loadSync(fontPath, {});    // needs to be adapted for browser later
    const font = await loadFont(fontPath);
    const reverseOrder = fontPath.slice(-3) == 'ttf';
     // @ts-ignore
    const rawLetterSVGPaths = font.getPaths(text, 0, 0, 12);

    const letterSeparatedPoints : Point3D[][][] = svg2points(rawLetterSVGPaths, resolution); // [Letters][Paths][Individual Points]

    const groups : {
        base: Point3D[],
        holes: Point3D[][]
    }[] = [];

    // console.log(`${letterSeparatedPoints.length} letters to generate`)

    for(let letter of letterSeparatedPoints){
        // if no holes / ligands
        if(letter.length == 1){
            groups.push({
                base: letter[0],
                holes: []
            });

            continue;
        }

        // has complex structure, time to deal with them!
        letter.sort((a, b) => getPolygonArea(a) - getPolygonArea(b)); // smallest to largest

        for(let i = letter.length - 1; i >= 0; i--){ // going from largest to smallest
            const outerPolygon = letter[i];

            if(polygonClockwise(outerPolygon, reverseOrder)){ // its a hole, ignore
                continue;
            }

            // not a hole, now we need to see if it contains any holes

            const potentialHoles = [];

            for(let j = i - 1; j >= 0; j--){ // go from largest to smallest again
                const innerPolygon = letter[j];

                if(!polygonClockwise(innerPolygon, reverseOrder)){ // its a shape, ignore
                    continue;
                }

                // we've found a hole -- now is this hole a valid hole (does it intersect?)

                if(!polygonInPolygon(innerPolygon, outerPolygon)){ // they don't intersect, invalid
                    continue;
                } else { // they intersect, valid hole!

                    // now make sure this hole isn't within another hole (remove redundancies)
                    let redundant = false;
                    inner2: for(let validHole of potentialHoles){
                        if(polygonInPolygon(innerPolygon, validHole)){
                            redundant = true;
                            break inner2;
                        }
                    }

                    if(!redundant) potentialHoles.push(innerPolygon);
                }
            }

            groups.push({
                base: outerPolygon,
                holes: potentialHoles
            });
        }
    }

    // console.log(`${groups.length} separate paths extracted`)

    // transform groups into vertex / index array
    const vertices = [];
    const indices = [];

    let offset = 0;
    for(let group of groups){ // find offset & fill the vertex array
        offset += group.base.length;
        
        for(let hole of group.holes){
            offset += hole.length;
        }
    }

    let currentOffset = 0;
    for(let group of groups){
        const curVertices = [...group.base, ...flattenArray<Point3D>(group.holes)];
        let initialHoleOffest = group.base.length;
        const holeIndices = group.holes.map(hole => {
            let curOffset = initialHoleOffest; 
            initialHoleOffest += hole.length;
            return curOffset;
        });

        // console.log("@@@@", group.holes.length, holeIndices.length, curVertices.length, holeIndices, (holeIndices.length > 0));

        const curIndices = chunkInto3((holeIndices.length > 0) ?  
            earcut(flattenArray(curVertices.map(vertex => point3Dto2D(vertex))), holeIndices) :
            earcut(flattenArray(curVertices.map(vertex => point3Dto2D(vertex))))
        ).map(index => index.map(i => i + currentOffset));

        // add top surface to vertices and indices
        vertices.push(...curVertices);
        indices.push(...curIndices);

        // add bottom indices, just rotate and offset faces
        indices.push(...curIndices.map(index => [
            index[1] + offset, 
            index[0] + offset, 
            index[2] + offset])
        );

        // add side faces
        let prev = group.base.length - 1;
        let sideFaces = [];
        for(let i = 0; i < group.base.length; i++){ // outside faces
            sideFaces.push([
                prev + currentOffset, 
                i + currentOffset, 
                prev + offset + currentOffset
            ]);
            sideFaces.push([
                i + currentOffset, 
                i + offset + currentOffset, 
                prev + offset + currentOffset
            ]);
            prev = i;
        }
        for(let j = 0; j < group.holes.length; j++){ // holes
            prev = group.holes[j].length - 1;
            for(let i = 0; i < group.holes[j].length; i++){ // hole faces
                sideFaces.push([
                    prev + currentOffset + holeIndices[j], 
                    i + currentOffset + holeIndices[j], 
                    prev + offset + currentOffset + holeIndices[j]
                ]);
                sideFaces.push([
                    i + currentOffset + holeIndices[j], 
                    i + offset + currentOffset + holeIndices[j], 
                    prev + offset + currentOffset + holeIndices[j]
                ]);
                prev = i;
            }
        }
        indices.push(...sideFaces.map(triple => {
            if(reverseOrder){
                return [triple[1], triple[0], triple[2]]
            } else {
                return triple;
            }
        }))
        
        currentOffset += group.base.length;
        for(let hole of group.holes) currentOffset += hole.length;
    }

    vertices.push(...vertices.map( // add bottom vertices
        point => [point[0], point[1], height]
    ));

    const bounds = getBounds(vertices as Point3D[]);
    const curHeight = bounds[0] - bounds[1];
    const scaleFactor = fontHeight / curHeight;
    const vertexArray = vertices.map(vertex => [ // transform according to params
        vertex[0] * scaleFactor, 
        vertex[1] * scaleFactor,
        vertex[2]
    ]);

    const CSG = dataToCSG(
        vertexArray.map(point => new Point(point[0], point[1], point[2])), 
        indices
    );

    const textObj = new Polyhedron(CSG);

    return textObj;
}

const svg2points = (rawLetterSVGPaths : any, curveStepCount : number) : Point3D[][][] => {
    let letterSeparatedSVGPaths : any = [];
    
    // seperate the rawLetterPaths by the 'Z' command which indicates a break and a new letter
    for(let rawLetterSVGPath of rawLetterSVGPaths){
        letterSeparatedSVGPaths.push([[]]);
        const lastIndex = letterSeparatedSVGPaths.length - 1;
        for(let command of rawLetterSVGPath.commands){
            if(command.type == 'Z' || command.type == 'z') letterSeparatedSVGPaths[lastIndex].push([]);
            else {
                const lastLastIndex = letterSeparatedSVGPaths[lastIndex].length - 1;
                letterSeparatedSVGPaths[lastIndex][lastLastIndex].push(command);
            }
        }
        letterSeparatedSVGPaths[lastIndex].pop();
    }
    
    // called once for each letter, turns each letter's command [] into point []
    const SVGtoPoints = (commandSet : any) => { 
        let p : Point3D = [0, 0, 0], 
            p0 : Point3D, p1 : Point3D, p2 : Point3D, p3 : Point3D;
        let points : Point3D[]  = [];
    
        for(let c of commandSet){
            const commandType : string = c.type;
            let pcp : Point3D = [0, 0, 0]; // previous curve control point 
            let cx = c.x || 0, cx1 = c.x1 || 0, cx2 = c.x2 || 0,
                cy = c.y || 0, cy1 = c.y1 || 0, cy2 = c.y2 || 0;
            
            switch(commandType){
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
                    for(let t = 0; t < 1; t += 1 / curveStepCount){
                        points.push(p);
                        p = [
                            (1 - t)** 3 * p0[0] + 3 * (1 - t)**2 * t * p1[0] + 3 * (1 - t) * t**2 * p2[0] + t**3 * p3[0],
                            (1 - t)** 3 * p0[1] + 3 * (1 - t)**2 * t * p1[1] + 3 * (1 - t) * t**2 * p2[1] + t**3 * p3[1],
                            0
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
                        0
                    ];
                    for(let t = 0; t < 1; t += 1 / curveStepCount){
                        points.push(p);
                        p = [
                            (1 - t)** 3 * p0[0] + 3 * (1 - t)**2 * t * p1[0] + 3 * (1 - t) * t**2 * p2[0] + t**3 * p3[0],
                            (1 - t)** 3 * p0[1] + 3 * (1 - t)**2 * t * p1[1] + 3 * (1 - t) * t**2 * p2[1] + t**3 * p3[1],
                            0
                        ];
                    }
                    pcp = p2;
                    break;
                case 'Q':
                    p0 = p;
                    p1 = [cx1, cy1, 0];
                    p2 = [cx, cy, 0];
                    for(let t = 0; t < 1; t += 1 / curveStepCount){
                        points.push(p);
                        p = [
                            p1[0] + (1 - t)**2 * (p0[0] - p1[0]) + t**2 * (p2[0] - p1[0]),
                            p1[1] + (1 - t)**2 * (p0[1] - p1[1]) + t**2 * (p2[1] - p1[1]),
                            0
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
                        0
                    ];
                    for(let t = 0; t < 1; t += 1 / curveStepCount){
                        points.push(p);
                        p = [
                            p1[0] + (1 - t)**2 * (p0[0] - p1[0]) + t**2 * (p2[0] - p1[0]),
                            p1[1] + (1 - t)**2 * (p0[1] - p1[1]) + t**2 * (p2[1] - p1[1]),
                            0
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
    }

    // convert the letter [] of command [] into a letter [] of point []
    let letterSeparatedPoints : Point3D[][][] = [];
    for(let letterSeparatedSVGPath of letterSeparatedSVGPaths){
        letterSeparatedPoints.push([]);
        for(let partLetterSVGPath of letterSeparatedSVGPath){
            const lastIndex = letterSeparatedPoints.length - 1;
            letterSeparatedPoints[lastIndex].push(SVGtoPoints(partLetterSVGPath));
        }
    }

    return letterSeparatedPoints;
}

type Point2D = [number, number];
type Point3D = [number, number, number];
type Triple = [any, any, any];

// CW = hole, CCW = shape
const polygonClockwise = (poly : Point3D[], reverseOrder : boolean) => {
    let sum = 0;
    for(let i = 0; i < poly.length - 1; i++){
        sum += poly[i][0] * poly[i + 1][1] - poly[i][1] * poly[i + 1][0];
    }
    sum += poly[poly.length - 1][0] * poly[0][1] - poly[poly.length - 1][1] * poly[0][0]

    if(reverseOrder){
        return !(sum > 0)
    } else {
        return sum > 0
    }
}

const polygonInPolygon = (poly1 : Point3D[], poly2 : Point3D[]) =>  // poly1 smaller than poly2
    poly1.every(point => pointInPolygon(point, poly2));

const pointInPolygon = (point : Point3D, vs : Point3D[]) => {
    // https://github.com/substack/point-in-polygon/blob/master/index.js
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    
    var x = point[0], y = point[1];
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    
    return inside;
};

const getPolygonArea = (poly : Point3D[]) => {
    let sum = 0;
    for(let i = 0; i < poly.length - 1; i++){
        sum += poly[i][0] * poly[i + 1][1] - poly[i][1] * poly[i + 1][0];
    }
    sum += poly[poly.length - 1][0] * poly[0][1] - poly[poly.length - 1][1] * poly[0][0]

    return Math.abs(sum / 2);
}

const getBounds = (vertexArray : Point3D[]) => {
    let leftMost : number = Infinity, rightMost : number = -Infinity, topMost : number = -Infinity, bottomMost : number = Infinity;
    for(let vertex of vertexArray){ 
        const currentVertexLeftRightDist = vertex[0], currentVertexTopBottomDist = vertex[1];
        if(currentVertexTopBottomDist > topMost) topMost = currentVertexTopBottomDist;
        if(currentVertexTopBottomDist < bottomMost) bottomMost = currentVertexTopBottomDist;
        if(currentVertexLeftRightDist < leftMost) leftMost = currentVertexLeftRightDist
        if(currentVertexLeftRightDist > rightMost) rightMost = currentVertexLeftRightDist;
    }

    return [topMost, bottomMost, leftMost, rightMost];
}

const flattenArray = <T>(array : T[][]) => array.reduce((a, v) => a.concat(v), [] as T[]);

const chunkInto3 = (array : any) : Triple[] => {
    let result : Triple[] = [];
    for(let i = 0; i < array.length; i+= 3){
        result.push(array.slice(i, i + 3));
    }
    return result;
}

const point3Dto2D = (point : Point3D) : Point2D =>  [point[0], point[1]] as Point2D;