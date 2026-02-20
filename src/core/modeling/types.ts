import { Polyhedron } from '../geometry/geometry';

export type KeychainShape =
    | 'cat'
    | 'dog'
    | 'penguin'
    | 'flower'
    | 'star'
    | 'heart'
    | 'musicnote'
    | 'fire'
    | 'football'
    | 'dolphin'
    | 'bear'
    | 'fish'
    | 'none'
    | string;

export type ExportFormat = 'obj' | 'stl' | 'x3g';

export interface KeychainBuildInput {
    text: string;
    shape: KeychainShape;
    textFontPath: string;
    emojiFontPath: string;
}

export interface KeychainTextOptions {
    topZ: number;
    emojiZOffset: number;
}

export interface TriangleMeshData {
    vertices: number[][];
    indices: number[][];
}

export interface KeychainBuildOutput {
    polyhedron: Polyhedron;
    mesh: TriangleMeshData;
}
