import { Point3D } from './types';

const getBounds = (vertexArray: Point3D[]): [number, number, number, number] => {
    let leftMost = Infinity;
    let rightMost = -Infinity;
    let topMost = -Infinity;
    let bottomMost = Infinity;

    for (let vertex of vertexArray) {
        const currentVertexLeftRightDist = vertex[0];
        const currentVertexTopBottomDist = vertex[1];

        if (currentVertexTopBottomDist > topMost) topMost = currentVertexTopBottomDist;
        if (currentVertexTopBottomDist < bottomMost) bottomMost = currentVertexTopBottomDist;
        if (currentVertexLeftRightDist < leftMost) leftMost = currentVertexLeftRightDist;
        if (currentVertexLeftRightDist > rightMost) rightMost = currentVertexLeftRightDist;
    }

    return [topMost, bottomMost, leftMost, rightMost];
};

export const scaleVerticesToFontHeight = (vertices: Point3D[], fontHeight: number): Point3D[] => {
    const bounds = getBounds(vertices);
    const curHeight = bounds[0] - bounds[1];
    const scaleFactor = fontHeight / curHeight;

    return vertices.map((vertex) => [
        vertex[0] * scaleFactor,
        vertex[1] * scaleFactor,
        vertex[2],
    ]);
};
