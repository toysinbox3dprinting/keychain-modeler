import React from 'react';
import * as THREE from 'three';
import '../styles/editor.css';

import LogoImage from '../assets/logo_transparent.png';
import { ExportFormat } from '@core/modeling/types';
import {
    DEFAULT_SHAPE,
    DEFAULT_TEXT,
    LOOK_POS,
    ORIGINAL_ROTATION,
    ORTHOGRAPHIC_CAMERA_POS,
    ORTHOGRAPHIC_TARGET,
    START_POS,
} from '../state/editorConstants';
import { EditorController } from './editorController';
import { DownloadPanel } from '../components/editor/DownloadPanel';
import { EditorControls } from '../components/editor/EditorControls';
import { EditorPanels } from '../components/editor/EditorPanels';
import { SceneViewport } from '../components/editor/SceneViewport';
import { EditorPageState, PanelId } from '../state/editorTypes';
import { saveFileWithDesktop } from '@infra/desktop/desktopApi';

export class EditorPage extends React.Component<{}, EditorPageState> {
    private readonly controller: EditorController;
    private readonly spinningRef: React.MutableRefObject<boolean>;

    private readonly groupRef: React.RefObject<any>;
    private readonly controlsRef: React.RefObject<any>;

    constructor(props: {}) {
        super(props);

        this.state = {
            selectedPanel: 'panel1',

            text: DEFAULT_TEXT,
            shape: DEFAULT_SHAPE,

            textGenerated: false,
            textVertexBuffer: new Float32Array(),
            textIndexBuffer: new Uint16Array(),
            textGeometry: new THREE.BufferGeometry(),
            textMaterial: new THREE.MeshBasicMaterial({
                color: THREE.Color.NAMES.aqua,
                side: THREE.DoubleSide,
            }),

            baseGenerated: false,
            baseVertexBuffer: new Float32Array(),
            baseIndexBuffer: new Uint16Array(),
            baseGeometry: new THREE.BufferGeometry(),
            baseMaterial: new THREE.MeshBasicMaterial(),

            readyToSlice: false,
            cameraType: 'perspective',
        };

        this.controller = new EditorController();
        this.spinningRef = { current: true };

        this.groupRef = React.createRef();
        this.controlsRef = React.createRef();
    }

    componentDidMount() {
        void this.generateKeychainText();
        this.generateKeychainBase();

        void this.controller.connect(() => {
            this.setState({ readyToSlice: true });
        });
    }

    componentWillUnmount() {
        this.controller.disconnect();
    }

    private async download(filename: string, data: string | File): Promise<void> {
        const desktopSaveResult = await saveFileWithDesktop(filename, data);
        if (desktopSaveResult !== undefined) {
            return;
        }

        const blob = typeof data === 'string' ? new Blob([data], { type: 'text/plain' }) : data;
        const objectUrl = window.URL.createObjectURL(blob);

        const elem = window.document.createElement('a');
        elem.href = objectUrl;
        elem.download = filename;
        document.body.appendChild(elem);
        try {
            elem.click();
        } finally {
            document.body.removeChild(elem);
            window.URL.revokeObjectURL(objectUrl);
        }
    }

    private getDownloadFilename(extension: 'obj' | 'stl' | 'x3g'): string {
        return `keychain-${this.state.text}-${this.state.shape}.${extension}`;
    }

    private async downloadX3g() {
        const objData = await this.controller.buildObjContents(this.state.text, this.state.shape);
        const x3gFile = await this.controller.convertObjToX3g(objData);
        await this.download(this.getDownloadFilename('x3g'), x3gFile);
    }

    private async downloadStl() {
        const objData = await this.controller.buildObjContents(this.state.text, this.state.shape);
        const stlFile = await this.controller.convertObjToStl(objData);
        await this.download(this.getDownloadFilename('stl'), stlFile);
    }

    private async downloadObj() {
        const objData = await this.controller.buildObjContents(this.state.text, this.state.shape);
        const objFile = this.controller.createObjFile(objData);
        await this.download(this.getDownloadFilename('obj'), objFile);
    }

    private async generate3DModel(slice = false, format: ExportFormat = 'stl') {
        try {
            if (slice) {
                await this.downloadX3g();
                return;
            }

            if (format === 'stl') {
                await this.downloadStl();
                return;
            }

            await this.downloadObj();
        } catch (error) {
            console.error('Failed to generate 3D model', error);
        }
    }

    private async generateKeychainText() {
        const output = await this.controller.generatePreviewText(this.state.text, this.state.shape);
        this.setState({
            textVertexBuffer: output.vertexData,
            textIndexBuffer: output.indexData,
            textGeometry: output.geometry,
            textGenerated: true,
        });
    }

    private generateKeychainBase() {
        const output = this.controller.generatePreviewBase();
        this.setState({
            baseVertexBuffer: output.vertexData,
            baseIndexBuffer: output.indexData,
            baseGeometry: output.geometry,
            baseMaterial: output.material,
            baseGenerated: true,
        });
    }

    private setPanelState(panel: PanelId, expanded: boolean) {
        this.setState({ selectedPanel: expanded ? panel : false });
    }

    private changeText(nextText: string) {
        this.setState({ text: nextText }, () => {
            void this.generateKeychainText();
        });
    }

    private changeShape(nextShape: string) {
        this.setState({ shape: nextShape }, () => {
            void this.generateKeychainText();
        });
    }

    private changeMaterialColor(color: number, type: 'base' | 'text') {
        const material = type === 'base' ? this.state.baseMaterial : this.state.textMaterial;
        material.color = new THREE.Color(color);
    }

    private resetView() {
        if (this.groupRef.current) {
            this.groupRef.current.rotation.set(
                ORIGINAL_ROTATION[0],
                ORIGINAL_ROTATION[1],
                ORIGINAL_ROTATION[2],
            );
            this.groupRef.current.position.set(0, 0, 0);
        }

        if (this.controlsRef.current !== undefined && this.controlsRef.current !== null) {
            const controls = this.controlsRef.current;
            controls.reset();

            if (this.state.cameraType === 'orthographic') {
                controls.target.set(...ORTHOGRAPHIC_TARGET);
                controls.object.position.set(...ORTHOGRAPHIC_CAMERA_POS);
            } else {
                controls.target.set(...LOOK_POS);
                controls.object.position.set(...START_POS);
            }
        }
    }

    private switchToOrthographic() {
        this.setState({ cameraType: 'orthographic' });
        this.spinningRef.current = false;

        setTimeout(() => {
            if (this.groupRef.current) {
                this.groupRef.current.rotation.set(
                    ORIGINAL_ROTATION[0],
                    ORIGINAL_ROTATION[1],
                    ORIGINAL_ROTATION[2],
                );
                this.groupRef.current.position.set(0, 0, 0);
            }

            if (this.controlsRef.current !== undefined && this.controlsRef.current !== null) {
                const controls = this.controlsRef.current;
                controls.reset();
                controls.target.set(...ORTHOGRAPHIC_TARGET);
                controls.object.position.set(...ORTHOGRAPHIC_CAMERA_POS);
                controls.update();
            }
        }, 50);
    }

    render() {
        return (
            <div className='editor-container'>
                <div className='header'>
                    <img className='header-logo' src={LogoImage} alt='Toysinbox Logo'></img>
                    <div className='header-text'>Hello Munchkins</div>
                </div>

                <div className='main-row'>
                    <SceneViewport
                        cameraType={this.state.cameraType}
                        groupRef={this.groupRef}
                        controlsRef={this.controlsRef}
                        spinningRef={this.spinningRef}
                        textGenerated={this.state.textGenerated}
                        textGeometry={this.state.textGeometry}
                        textMaterial={this.state.textMaterial}
                        baseGenerated={this.state.baseGenerated}
                        baseGeometry={this.state.baseGeometry}
                        baseMaterial={this.state.baseMaterial}
                    />

                    <EditorPanels
                        selectedPanel={this.state.selectedPanel}
                        onPanelChange={(panel, expanded) => this.setPanelState(panel, expanded)}
                        onTextChange={(text) => this.changeText(text)}
                        onBaseColorChange={(color) => this.changeMaterialColor(color, 'base')}
                        onTextColorChange={(color) => this.changeMaterialColor(color, 'text')}
                        onShapeChange={(shape) => this.changeShape(shape)}
                    />
                </div>

                <div className='sub-row'>
                    <EditorControls
                        cameraType={this.state.cameraType}
                        onStartSpin={() => {
                            this.spinningRef.current = true;
                        }}
                        onStopSpin={() => {
                            this.spinningRef.current = false;
                        }}
                        onResetView={() => this.resetView()}
                        onSwitchToOrthographic={() => this.switchToOrthographic()}
                        onSwitchToPerspective={() => {
                            this.setState({ cameraType: 'perspective' });
                        }}
                    />

                    <DownloadPanel
                        readyToSlice={this.state.readyToSlice}
                        onDownloadX3g={() => void this.generate3DModel(true)}
                        onDownloadStl={() => void this.generate3DModel(false, 'stl')}
                        onDownloadObj={() => void this.generate3DModel(false, 'obj')}
                    />
                </div>

                <br></br>
                <br></br>
                <div className='sub-row'>Copyright &copy;2025 Toysinbox 3D Printing. Powered by Asunder Labs.</div>
            </div>
        );
    }
}
