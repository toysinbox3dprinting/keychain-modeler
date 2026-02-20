export type Point2D = [number, number];
export type Point3D = [number, number, number];
export type Triple = [number, number, number];

export type PolygonGroup = {
    base: Point3D[];
    holes: Point3D[][];
};
