import { Point, Polyhedron } from './geometry';
import { dataToCSG } from './DataToCSG';
import { isTtfFont, loadFont } from './text/fontLoader';
import { scaleVerticesToFontHeight } from './text/meshTransform';
import { buildPolygonGroups } from './text/polygonTopology';
import { svgPathsToPoints } from './text/svgPathToPoints';
import { buildExtrudedMesh } from './text/triangulation';

export const createText = async (
    text: string,
    fontPath: string,
    fontHeight: number,
    height: number,
    resolution: number,
): Promise<Polyhedron> => {
    const font = await loadFont(fontPath);
    const reverseOrder = isTtfFont(fontPath);

    // @ts-ignore
    const rawLetterSVGPaths = font.getPaths(text, 0, 0, 12);
    const letterSeparatedPoints = svgPathsToPoints(rawLetterSVGPaths, resolution);
    const groups = buildPolygonGroups(letterSeparatedPoints, reverseOrder);

    const mesh = buildExtrudedMesh(groups, height, reverseOrder);
    const scaledVertices = scaleVerticesToFontHeight(mesh.vertices, fontHeight);

    const csg = dataToCSG(
        scaledVertices.map((point) => new Point(point[0], point[1], point[2])),
        mesh.indices,
    );

    return new Polyhedron(csg);
};
