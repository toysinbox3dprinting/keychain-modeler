import * as THREE from 'three';

export type CameraType = 'perspective' | 'orthographic';
export type PanelId = 'panel1' | 'panel2' | 'panel2b' | 'panel3';

export interface EditorPageState {
    selectedPanel: PanelId | false;

    text: string;
    shape: string;

    textGenerated: boolean;
    textVertexBuffer: Float32Array;
    textIndexBuffer: Uint16Array;
    textGeometry: THREE.BufferGeometry;
    textMaterial: THREE.MeshBasicMaterial;

    baseGenerated: boolean;
    baseVertexBuffer: Float32Array;
    baseIndexBuffer: Uint16Array;
    baseGeometry: THREE.BufferGeometry;
    baseMaterial: THREE.MeshBasicMaterial;

    readyToSlice: boolean;
    cameraType: CameraType;
}

export interface PreviewMeshOutput {
    vertexData: Float32Array;
    indexData: Uint16Array;
    geometry: THREE.BufferGeometry;
}

export interface BaseMeshOutput extends PreviewMeshOutput {
    material: THREE.MeshBasicMaterial;
}
