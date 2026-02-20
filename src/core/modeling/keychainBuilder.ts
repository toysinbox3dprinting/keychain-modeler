import { CSGToData } from '../geometry/CSGToData';
import { Point, Polyhedron } from '../geometry/geometry';
import { createBox } from '../geometry/createBox';
import { createCylinder } from '../geometry/createCylinder';
import { createSVG } from '../geometry/createSVG';
import { createText } from '../geometry/createText';
import { KeychainBuildInput, KeychainBuildOutput, KeychainTextOptions, TriangleMeshData } from './types';

const DEFAULT_PREVIEW_OPTIONS: KeychainTextOptions = {
    topZ: 5.05,
    emojiZOffset: 0.05,
};

const DEFAULT_EXPORT_OPTIONS: KeychainTextOptions = {
    topZ: 5,
    emojiZOffset: 0,
};

const getTextLayout = (textLength: number, emojiPresent: boolean): { sizeX: number; translateX: number } => {
    if (emojiPresent) {
        if (textLength <= 1) return { sizeX: 11, translateX: 17 };
        if (textLength === 2) return { sizeX: 22, translateX: 13.5 };
        if (textLength === 3) return { sizeX: 31, translateX: 8 };
        if (textLength === 4) return { sizeX: 40, translateX: 1.5 };
        return { sizeX: 42.5, translateX: 0.5 };
    }

    if (textLength <= 1) return { sizeX: 11, translateX: 22.5 };
    if (textLength === 2) return { sizeX: 22, translateX: 18.5 };
    if (textLength === 3) return { sizeX: 31, translateX: 14.5 };
    if (textLength === 4) return { sizeX: 41, translateX: 9 };
    if (textLength === 5) return { sizeX: 49.5, translateX: 5 };
    return { sizeX: 54, translateX: 2 };
};

const polyhedronToMesh = (polyhedron: Polyhedron, axisMode: 'preview' | 'model'): TriangleMeshData => {
    const data = CSGToData(polyhedron.export());

    if (axisMode === 'preview') {
        return {
            vertices: data.vertices.map((vertex) => [vertex[0], vertex[2], vertex[1]]),
            indices: data.indices,
        };
    }

    return {
        vertices: data.vertices,
        indices: data.indices,
    };
};

export const createKeychainBase = (): Polyhedron => {
    const textBaseBox = createBox(new Point(0, 0, 0), 60, 20, 5);
    const textBaseCylinder = createCylinder(10, 5, 64);
    textBaseCylinder.translate(0, 10, 0);

    const textBaseHole = createCylinder(2.5, 10, 64);
    textBaseHole.translate(-5, 10, -2.5);

    return textBaseBox.union(textBaseCylinder).subtract(textBaseHole);
};

export const createKeychainTop = async (
    input: KeychainBuildInput,
    options: KeychainTextOptions = DEFAULT_PREVIEW_OPTIONS,
): Promise<Polyhedron> => {
    const text = await createText(input.text, input.textFontPath, 5, 2, 16);
    const emojiPresent = input.shape !== 'none';
    const { sizeX, translateX } = getTextLayout(input.text.length, emojiPresent);

    text.setSize(sizeX, 16, 2);
    text.translate(translateX, 18, options.topZ);

    if (!emojiPresent) {
        return text;
    }

    const emoji = await createSVG(input.shape, input.emojiFontPath, 16, 2, 3);
    emoji.translate(0, 0, options.emojiZOffset);

    return text.union(emoji);
};

export const createKeychainModel = async (input: KeychainBuildInput): Promise<Polyhedron> => {
    const [base, top] = await Promise.all([
        Promise.resolve(createKeychainBase()),
        createKeychainTop(input, DEFAULT_EXPORT_OPTIONS),
    ]);

    return base.union(top);
};

export const createPreviewTopOutput = async (input: KeychainBuildInput): Promise<KeychainBuildOutput> => {
    const polyhedron = await createKeychainTop(input, DEFAULT_PREVIEW_OPTIONS);
    return {
        polyhedron,
        mesh: polyhedronToMesh(polyhedron, 'preview'),
    };
};

export const createPreviewBaseOutput = (): KeychainBuildOutput => {
    const polyhedron = createKeychainBase();
    return {
        polyhedron,
        mesh: polyhedronToMesh(polyhedron, 'preview'),
    };
};

export const createModelMesh = (polyhedron: Polyhedron): TriangleMeshData => polyhedronToMesh(polyhedron, 'model');
