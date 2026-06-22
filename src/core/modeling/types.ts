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
    | 'dino'
    | 'seed'
    | 'none'
    | string;

export type ExportFormat = 'obj' | 'stl' | 'x3g';

export interface KeychainBuildInput {
    text: string;
    shape: KeychainShape;
    textFontPath: string;
    emojiFontPath: string;
    // Some decors (dino, seed) are our own artwork and aren't present in the legacy
    // Noto Emoji font, so each is rendered from a dedicated single-glyph font built
    // from its SVG. Keyed by shape; shapes absent here use emojiFontPath.
    decorFontPaths: Record<string, string>;
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
