import * as THREE from 'three';
import BebasFont from '../assets/fonts/BebasNeue.otf';
import EmojiFont from '../assets/fonts/NotoEmoji-Regular.ttf';
import {
    createKeychainModel,
    createPreviewBaseOutput,
    createPreviewTopOutput,
} from '@core/modeling/keychainBuilder';
import { serializeKeychainObj } from '@core/modeling/objSerializer';
import { SlicingClient } from '@infra/slicing/slicingClient';
import { getSlicingCredentials } from '@infra/slicing/slicingConfig';
import { BaseMeshOutput, PreviewMeshOutput } from '../state/editorTypes';

const createGeometry = (vertexData: Float32Array, indices: number[]): THREE.BufferGeometry => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertexData, 3));
    geometry.setIndex(indices);
    return geometry;
};

export class EditorController {
    private readonly slicingClient: SlicingClient;

    constructor() {
        this.slicingClient = new SlicingClient(getSlicingCredentials(), false);
    }

    connect(onReady: () => void): Promise<boolean> {
        return this.slicingClient.connect(onReady);
    }

    disconnect(): void {
        this.slicingClient.disconnect();
    }

    async generatePreviewText(text: string, shape: string): Promise<PreviewMeshOutput> {
        const output = await createPreviewTopOutput({
            text,
            shape,
            textFontPath: BebasFont,
            emojiFontPath: EmojiFont,
        });

        const indexArray = output.mesh.indices.flat();
        const vertexData = new Float32Array(output.mesh.vertices.flat());

        return {
            vertexData,
            indexData: new Uint16Array(indexArray),
            geometry: createGeometry(vertexData, indexArray),
        };
    }

    generatePreviewBase(): BaseMeshOutput {
        const output = createPreviewBaseOutput();
        const indexArray = output.mesh.indices.flat();
        const vertexData = new Float32Array(output.mesh.vertices.flat());

        return {
            vertexData,
            indexData: new Uint16Array(indexArray),
            geometry: createGeometry(vertexData, indexArray),
            material: new THREE.MeshBasicMaterial({
                color: 'orange',
                side: THREE.DoubleSide,
            }),
        };
    }

    async buildObjContents(text: string, shape: string): Promise<string> {
        const keychainModel = await createKeychainModel({
            text,
            shape,
            textFontPath: BebasFont,
            emojiFontPath: EmojiFont,
        });

        return serializeKeychainObj(keychainModel);
    }

    createObjFile(objData: string): File {
        return new File([objData], 'model.obj', {
            type: 'text/plain',
            lastModified: Date.now(),
        });
    }

    async convertObjToStl(objData: string): Promise<File> {
        const objFile = this.createObjFile(objData);
        return this.slicingClient.convert({ input_format: 'obj', target_format: 'stl' }, objFile);
    }

    async convertObjToX3g(objData: string): Promise<File> {
        const objFile = this.createObjFile(objData);
        const stlFile = await this.slicingClient.convert({ input_format: 'obj', target_format: 'stl' }, objFile);
        return this.slicingClient.slice({ input_format: 'stl', layer_height: 0.2 }, stlFile);
    }
}
