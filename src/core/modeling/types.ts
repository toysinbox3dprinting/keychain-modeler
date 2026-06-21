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
    | 'none'
    | string;

export type ExportFormat = 'obj' | 'stl' | 'x3g';

export interface KeychainBuildInput {
    text: string;
    shape: KeychainShape;
    textFontPath: string;
    emojiFontPath: string;
    // The default emoji font (Noto Emoji v1.05) has no sauropod (1F995) glyph, so the
    // dino is rendered from a dedicated single-glyph font built from our own SVG.
    dinoFontPath: string;
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
