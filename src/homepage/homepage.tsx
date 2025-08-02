import React from "react";
import { ReactNode, useEffect, useRef } from "react";
import './homepage.css';

import * as THREE from 'three';
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { createBox } from "../kernel/createBox";
import { Point, Polyhedron } from "../lib/geometry";
import { CSGToData } from "../lib/CSGToData";
import { OrbitControls } from '@react-three/drei'
import './homepage.css';
import { createCylinder } from "../kernel/createCylinder";
import { createText } from "../kernel/createText";

import BebasFont from '../resources/BebasNeue.otf';
import EmojiFont from '../kernel/fonts/NotoEmoji-Regular.ttf';
import Accordion from "@mui/material/Accordion";
import { AccordionSummary, AccordionDetails, TextField, Button } from "@mui/material";
import { ArrowForwardIosSharp, Widgets } from "@mui/icons-material";
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DangerousIcon from '@mui/icons-material/Dangerous';
import HomeIcon from '@mui/icons-material/Home';
import { ColorSelector } from "./colorselector";

import LogoImage from '../resources/logo_transparent.png';
import { EmojiSelector } from "./emojiselector";
import { createSVG } from "../kernel/createSVG";
import { ToysinboxLoginCredentials, ServerRequestStatus, ClientRequestResult, TaskConvertConfig, TaskSliceConfig } from "./shared_types";

let spinning = true;
let originalRotation : number[] = [0, 0, 0];

const startPos: [number, number, number] = [25, 65, 25];
const lookPos: [number, number, number] = [25, 10, 0];

const login_credentials = {
    token: '',
    rest_server: `https://slicing-www.asunder.co`,
    websocket_server: `wss://slicing-wss.asunder.co`
};

function Update(props: {thisRef: HomePage}){
    useFrame((state, delta, xrFrame) => {
        if(!props.thisRef.groupRef) return;
        if(!spinning) return;
        const group = props.thisRef.groupRef.current;
        const dtheta = (delta / 8) * Math.PI * 2; // rotate once per 5 seconds
        group.translateX(25);
        group.rotateY(dtheta);
        group.translateX(-25);
    });

    return <></>
}


export interface HomePageState {
    selectedPanel: string | boolean;

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

    ready_to_slice: boolean;
    camera_type: 'perspective' | 'orthographic';
}

const CameraSelector = ({ cameraType }: { cameraType: 'perspective' | 'orthographic' }) => {
    const { viewport } = useThree();
    const orthoRef = useRef<any>();
    const frustumSize = 100;
    
    useFrame(() => {
        if (cameraType === 'orthographic' && orthoRef.current) {
            const camera = orthoRef.current;
            camera.left = -frustumSize * viewport.aspect / 2;
            camera.right = frustumSize * viewport.aspect / 2;
            camera.top = frustumSize / 2;
            camera.bottom = -frustumSize / 2;
            camera.updateProjectionMatrix();
        }
    });
    
    if (cameraType === 'perspective') {
        return (
            <PerspectiveCamera
                makeDefault
                position={startPos}
                near={0.1}
                far={1000}
                fov={75}
            />
        );
    } else {
        return (
            <OrthographicCamera
                ref={orthoRef}
                makeDefault
                position={startPos}
                near={0.1}
                far={1000}
                left={-frustumSize * viewport.aspect / 2}
                right={frustumSize * viewport.aspect / 2}
                top={frustumSize / 2}
                bottom={-frustumSize / 2}
                zoom={1}
            />
        );
    }
};

export class HomePage extends React.Component<{}, HomePageState> {
    editorViewportWidth: number;
    editorViewportHeight: number;
    aspectRatio: number;

    groupRef: React.MutableRefObject<any>;
    controlsRef: React.MutableRefObject<any>;

    scene: THREE.Scene | null;

    constructor(props: {}) {
        super(props);

        this.editorViewportWidth = 800;
        this.editorViewportHeight = 500;
        this.aspectRatio = this.editorViewportWidth / this.editorViewportHeight;
        this.scene = null;

        this.state = {
            selectedPanel: 'panel1',

            text: 'Hello',
            shape: 'cat',
            textGenerated: false,
            textVertexBuffer: new Float32Array(),
            textIndexBuffer: new Uint16Array(),
            textGeometry: new THREE.BufferGeometry(),
            textMaterial: new THREE.MeshBasicMaterial({
                color: THREE.Color.NAMES.aqua,
                side: THREE.DoubleSide
            }),

            baseGenerated: false,
            baseVertexBuffer: new Float32Array(),
            baseIndexBuffer: new Uint16Array(),
            baseGeometry: new THREE.BufferGeometry(),
            baseMaterial: new THREE.MeshBasicMaterial(),

            ready_to_slice: false,
            camera_type: 'perspective'
        };

        this.groupRef = React.createRef();
        this.controlsRef = React.createRef();
    }

    componentDidMount() {
        this.generateKeychainText();
        this.generateKeychainBase();

        this.generate3DModel = this.generate3DModel.bind(this);

        login(
            login_credentials, 
            false, 
            () => {
                this.setState({ready_to_slice: true});
            }
        );
    }

    loadModelToScene(vertices: number[][], indices: number[][]) {
        const verts = new Float32Array(vertices.flat());
        const inds = indices.flat();

        const geometry = new THREE.BufferGeometry();
        geometry.setIndex(inds);
        geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        this.scene?.add(mesh);

        const wireframe = new THREE.EdgesGeometry(geometry);
        const lines = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({
            color: 0x000000
        }));
        this.scene?.add(lines);
    }

    generateKeychainText() {
        console.log("GEN");
        createText(this.state.text, BebasFont, 5, 2, 16).then(async (text) => {
            const correctedText = text //.flipY();

            let emojiPresent = this.state.shape !== 'none';
            let name = this.state.text;
            let sizeX;
            let translateX;
            if(emojiPresent){
                if(name.length === 1){
                    sizeX = 110;
                    translateX = 170;
                } else if(name.length === 2){
                    sizeX = 220;
                    translateX = 135;
                } else if(name.length === 3){
                    sizeX = 310;
                    translateX = 80;
                } else if(name.length === 4){
                    sizeX = 400;
                    translateX = 15;
                } else {
                    sizeX = 425;
                    translateX = 5;
                }
            } else {
                if(name.length === 1){
                    sizeX = 110;
                    translateX = 225;
                } else if(name.length === 2){
                    sizeX = 220;
                    translateX = 185;
                } else if(name.length === 3){
                    sizeX = 310;
                    translateX = 145;
                } else if(name.length === 4){
                    sizeX = 410;
                    translateX = 90;
                } else if(name.length === 5){
                    sizeX = 495;
                    translateX = 50;
                } else if(name.length === 6){
                    sizeX = 540;
                    translateX = 20;
                } else {
                    sizeX = 540;
                    translateX = 20;
                }
            }
            sizeX /= 10;
            translateX /= 10;
            correctedText.setSize(sizeX, 16, 2);
            correctedText.translate(translateX, 2 + 16, 5.05);
            
            let top;
            if(emojiPresent){
                const emoji = await createSVG(
                    this.state.shape,
                    EmojiFont,
                    16, 2, 
                    3 // 5
                );
                emoji.translate(0, 0, 0.05);
                top = correctedText.union(emoji);
            } else {
                top = correctedText;
            }

            const data = CSGToData(top.export());
        
            const vertexData = new Float32Array(data.vertices.map(v => [v[0], v[2], v[1]]).flat())
            const indexData = new Uint16Array(data.indices.flat())
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(vertexData, 3));
            geometry.setIndex(data.indices.flat());

            // const material = new THREE.MeshBasicMaterial({
            //     color: THREE.Color.NAMES.aqua,
            //     side: THREE.DoubleSide
            // });

            this.setState({
                textVertexBuffer: vertexData,
                textIndexBuffer: indexData,
                textGeometry: geometry,
                textGenerated: true,
                // textMaterial: material
            });
        });
    }

    generateKeychainBase(){
        const textBaseBox: Polyhedron = createBox(new Point(0, 0, 0), 60, 20, 5);
        const textBaseCylinder = createCylinder(10, 5, 64);
        textBaseCylinder.translate(0, 10, 0);
        const textBaseHole = createCylinder(2.5, 10, 64);
        textBaseHole.translate(-5, 10, -2.5);
        const textBase = textBaseBox.union(textBaseCylinder).subtract(textBaseHole);
        const data = CSGToData(textBase.export());
        
        const vertexData = new Float32Array(data.vertices.map(v => [v[0], v[2], v[1]]).flat())
        const indexData = new Uint16Array(data.indices.flat())
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertexData, 3));
        geometry.setIndex(data.indices.flat());
        const material = new THREE.MeshBasicMaterial({
            color: 'orange',
            side: THREE.DoubleSide
        });

        this.setState({
            baseGeometry: geometry,
            baseVertexBuffer: vertexData,
            baseIndexBuffer: indexData,
            baseMaterial: material,
            baseGenerated: true
        });
    }

    download(filename: string, data: string | File){
        const blob = new Blob([data], {type: 'text/csv'});
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }

    async download_x3g(obj_data: string){
        const obj_file = new File(
            [obj_data], 
            'model.obj', 
            {
                type: 'text/plain',
                lastModified: new Date().getTime(),
            }
        );

        const stl_file = await convert({ input_format: 'obj', target_format: 'stl' }, obj_file);
        const x3g_file = await slice({ input_format: 'stl', layer_height: 0.2 }, stl_file);
        this.download(`keychain-${this.state.text}-${this.state.shape}.x3g`, x3g_file);
    }

    async download_stl(obj_data: string){
        const obj_file = new File(
            [obj_data], 
            'model.obj', 
            {
                type: 'text/plain',
                lastModified: new Date().getTime(),
            }
        );

        const stl_file = await convert({ input_format: 'obj', target_format: 'stl' }, obj_file);
        this.download(`keychain-${this.state.text}-${this.state.shape}.stl`, stl_file);
    }

    async download_obj(obj_data: string){
        const obj_file = new File(
            [obj_data], 
            'model.obj', 
            {
                type: 'text/plain',
                lastModified: new Date().getTime(),
            }
        );
        this.download(`keychain-${this.state.text}-${this.state.shape}.obj`, obj_file);
    }

    generate3DModel(slice = false, format = 'stl'){
        createText(this.state.text, BebasFont, 5, 2, 16).then(async (text) => {
            const correctedText = text //.flipY();

            let emojiPresent = this.state.shape !== 'none';
            let name = this.state.text;
            let sizeX;
            let translateX;
            if(emojiPresent){
                if(name.length === 1){
                    sizeX = 110;
                    translateX = 170;
                } else if(name.length === 2){
                    sizeX = 220;
                    translateX = 135;
                } else if(name.length === 3){
                    sizeX = 310;
                    translateX = 80;
                } else if(name.length === 4){
                    sizeX = 400;
                    translateX = 15;
                } else {
                    sizeX = 425;
                    translateX = 5;
                }
            } else {
                if(name.length === 1){
                    sizeX = 110;
                    translateX = 225;
                } else if(name.length === 2){
                    sizeX = 220;
                    translateX = 185;
                } else if(name.length === 3){
                    sizeX = 310;
                    translateX = 145;
                } else if(name.length === 4){
                    sizeX = 410;
                    translateX = 90;
                } else if(name.length === 5){
                    sizeX = 495;
                    translateX = 50;
                } else if(name.length === 6){
                    sizeX = 540;
                    translateX = 20;
                } else {
                    sizeX = 540;
                    translateX = 20;
                }
            }
            sizeX /= 10;
            translateX /= 10;
            correctedText.setSize(sizeX, 16, 2);
            correctedText.translate(translateX, 2 + 16, 5);
            
            let top;
            if(emojiPresent){
                const emoji = await createSVG(
                    this.state.shape,
                    EmojiFont,
                    16, 2, 3
                );
                top = correctedText.union(emoji);
            } else {
                top = correctedText;
            }

            const textBaseBox = createBox(new Point(0, 0, 0), 60, 20, 5);
            const textBaseCylinder = createCylinder(10, 5, 64);
            textBaseCylinder.translate(0, 10, 0);
            const textBaseHole = createCylinder(2.5, 10, 64);
            textBaseHole.translate(-5, 10, -2.5);
            const textBase = textBaseBox.union(textBaseCylinder).subtract(textBaseHole);

            const entireKeychain = textBase.union(top);
            const data = CSGToData(entireKeychain.exportFlipped());
        
            const obj_file_name = `keychain-${this.state.text}-${this.state.shape}.obj`;
            const obj_file_contents = `
# File generated by Keychain Generator
# Joshua Yang - Kauhentus - Toysinbox 3D Printing
g keychain
# Vertices
${data.vertices.map(v => `v ${v[0]} ${v[1]} ${v[2]} 10.0`).join('\r\n')}

# Indices
${data.indices.map(i => `f ${i[0] + 1} ${i[1] + 1} ${i[2] + 1}`).join('\r\n')}`

            const lines = obj_file_contents.split('\n').map(line => {
                if(line.slice(0, 1) !== 'v'){
                    return line;
                } else {
                    // v -14.470452261306537 157.8768715083799 70 0.0
                    const params = line.split(' ').slice(1).map(n => parseFloat(n) / 10);
                    params[0] *= -1; params[1] *= -1;
                    params[0] += -25; params[1] += 10;
                    params[0] *= 10; params[1] *= 10; params[2] *= 10;
                    const newLine = ['v', ...params].join(' ');

                    return newLine;
                }
            });
            const rescaled_obj_file_contents = lines.join('\n');

            if(!slice){
                // this.download(obj_file_name, rescaled_obj_file_contents);
                if(format === 'stl'){
                    this.download_stl(rescaled_obj_file_contents);
                } else {
                    this.download_obj(rescaled_obj_file_contents);
                }
            } else {
                this.download_x3g(rescaled_obj_file_contents);
            }
        });
    }

    keychainBase() {
        if(!this.state.baseGenerated) return <></>;

        console.log("RENDER BASE")

        return (<group>
            <mesh 
                geometry={this.state.baseGeometry} 
                material={this.state.baseMaterial}>
            </mesh>

            <lineSegments>
                <edgesGeometry attach={"geometry"} args={[this.state.baseGeometry, 30]}/>
                <lineBasicMaterial color={'black'}/>
            </lineSegments>
        </group>);
    }

    keychainText(){
        if(!this.state.textGenerated) return <></>;

        console.log("RENDER TEXT")

        return (<group>
            <mesh 
                geometry={this.state.textGeometry} 
                material={this.state.textMaterial}>
            </mesh>
            <lineSegments>
                <edgesGeometry attach={"geometry"} args={[this.state.textGeometry, 30]}/>
                <lineBasicMaterial color={'black'}/>
            </lineSegments>
        </group>);
    }

    changeText(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        console.log("Changing text...")
        let curText = event.currentTarget ? event.currentTarget.value : 
            event.target ? event.target.value : '';
        this.setState({text: curText}, () => {
            this.generateKeychainText();
        });
    }

    changeMaterialColor(color: number, type: 'base' | 'text'){
        const material = type === 'base' ? this.state.baseMaterial : this.state.textMaterial;
        material.color = new THREE.Color(color);
    }

    changeShape(newShape: string){
        this.setState({
            shape: newShape
        }, () => {
            this.generateKeychainText();
        });
    }

    async generateKeychainModel() {
        
    }

    render(): ReactNode {
        const handleChange = (panel: string) => 
            (event: React.SyntheticEvent, newExpanded: boolean) => 
                this.setState({selectedPanel: newExpanded ? panel : false});

        let textChangeTimeout: string | number | NodeJS.Timeout | undefined;

        return (
            <div className="editor-container">
                <div className="header">
                    <img className="header-logo" src={LogoImage} alt="Toysinbox Logo"></img>
                    <div className="header-text">Hello Munchkins</div>
                </div>

                <div className="main-row">
                    <div className="main-canvas">
                        <Canvas>
                            <CameraSelector cameraType={this.state.camera_type} />
                            
                            <group ref={this.groupRef}>
                                {this.keychainText()}
                                {this.keychainBase()}

                                <ambientLight />
                                <pointLight position={[35, 10, 20]} />
                                {/* <axesHelper args={[100]}/> */}
                            </group>

                            <OrbitControls position={startPos} target={lookPos} ref={this.controlsRef}/>
                            <Update thisRef={this}/>
                        </Canvas>
                    </div>

                    <div className="params-column">
                        <Accordion className="params-column-card" expanded={this.state.selectedPanel === 'panel1'} onChange={handleChange('panel1')}>
                        <AccordionSummary 
                            expandIcon={<ArrowForwardIosSharp sx={{fontSize: '0.9rem'}}/>} 
                            aria-controls="panel1d-content" 
                            sx={{marginBottom: '0px'}}
                            id="panel1d-header">
                                <div className='bebas-header'>📜 TEXT</div>
                            </AccordionSummary>
                            <AccordionDetails className='params-card params-panel-inner'>
                                <div className="comic-label">Put your name here:</div>
                                <TextField id="text-field-input" defaultValue={'hello'} onChange={(event) => {
                                    clearTimeout(textChangeTimeout);
                                    textChangeTimeout = setTimeout(() => {
                                        console.log(event)
                                        this.changeText(event)
                                    }, 300);
                                }} label="Your Keychain Text" variant="outlined"/>
                            </AccordionDetails>
                        </Accordion>
                        <Accordion className="params-column-card" expanded={this.state.selectedPanel === 'panel2'} onChange={handleChange('panel2')}>
                            <AccordionSummary 
                                expandIcon={<ArrowForwardIosSharp sx={{fontSize: '0.9rem'}}/>} 
                                aria-controls="panel2d-content" 
                                id="panel2d-header">
                                <div className='bebas-header'>🎨 BASE COLOR</div>
                            </AccordionSummary>
                            <AccordionDetails className='params-card params-panel-inner'>
                                <div className="comic-label">Choose your base color:</div>
                                <ColorSelector changeColor={(color: number) => this.changeMaterialColor(color, 'base')}/>
                            </AccordionDetails>
                        </Accordion>
                        <Accordion className="params-column-card" expanded={this.state.selectedPanel === 'panel2b'} onChange={handleChange('panel2b')}>
                            <AccordionSummary 
                                expandIcon={<ArrowForwardIosSharp sx={{fontSize: '0.9rem'}}/>} 
                                aria-controls="panel2d-content" 
                                id="panel2d-header">
                                <div className='bebas-header'>🎨 TEXT COLOR</div>
                            </AccordionSummary>
                            <AccordionDetails className='params-card params-panel-inner'>
                                <div className="comic-label">Choose your text color:</div>
                                <ColorSelector changeColor={(color: number) => this.changeMaterialColor(color, 'text')}/>
                            </AccordionDetails>
                        </Accordion>
                        <Accordion className="params-column-card" expanded={this.state.selectedPanel === 'panel3'} onChange={handleChange('panel3')}>
                            <AccordionSummary 
                                expandIcon={<ArrowForwardIosSharp sx={{fontSize: '0.9rem'}}/>} 
                                aria-controls="panel3d-content" 
                                id="panel3d-header">
                                <div className='bebas-header'>🐱 SHAPE</div>
                            </AccordionSummary>
                            <AccordionDetails className="params-card params-panel-inner">
                            <div className="comic-label">Choose your shape:</div>
                                <EmojiSelector changeShape={(shape: string) => this.changeShape(shape)}/>
                            </AccordionDetails>
                        </Accordion>
                    </div>
                </div>

                <div className="sub-row">
                    <div className="editor-control-container">
                        <div className="editor-buttons">
                            <div className="view-options-label">View Options: </div>
                            <Button className="editor-button" onClick={() => spinning = true} variant="outlined">
                                <AutorenewIcon/>
                            </Button>
                            <Button className="editor-button" onClick={() => spinning = false} variant="outlined">
                                <DangerousIcon/>
                            </Button>
                            <Button className="editor-button" onClick={() => {
                                if(this.groupRef){
                                    this.groupRef.current.rotation.set(
                                        originalRotation[0],
                                        originalRotation[1],
                                        originalRotation[2]
                                    );
                                    this.groupRef.current.position.set(0, 0, 0);
                                }

                                if(this.controlsRef.current !== undefined){
                                    const controls = this.controlsRef.current;
                                    controls.reset();
                                    
                                    if(this.state.camera_type === 'orthographic') {
                                        controls.target.set(25, 0, 5);
                                        controls.object.position.set(25, 100, 5);
                                    } else {
                                        controls.target.set(...lookPos);
                                        controls.object.position.set(...startPos);
                                    }
                                }
                            }} variant="outlined">
                                <HomeIcon/>
                            </Button>
                            { this.state.camera_type === 'perspective' ?
                                <Button className="editor-button" onClick={() => {
                                    this.setState({
                                        camera_type: 'orthographic',
                                    });
                                    spinning = false;

                                    setTimeout(() => {
                                        if(this.groupRef){
                                            this.groupRef.current.rotation.set(
                                                originalRotation[0],
                                                originalRotation[1],
                                                originalRotation[2]
                                            );
                                            this.groupRef.current.position.set(0, 0, 0);
                                        }
                                        if(this.controlsRef.current !== undefined){
                                            const controls = this.controlsRef.current;
                                            controls.reset();
                                            controls.target.set(25, 0, 5);
                                            controls.object.position.set(25, 100, 5);
                                            controls.update();
                                        }
                                    }, 50);


                                }} variant="outlined">
                                    <b>P</b>
                                </Button> :
                                <Button className="editor-button" onClick={() => {
                                    this.setState({camera_type: 'perspective'});
                                }} variant="outlined">
                                    <b>O</b>
                                </Button>
                            }
                        </div>

                        <div className="sub-sub-row">
                        <div className='wrap-40'>
                            <div><AutorenewIcon className="padAround-inline"/> = Start Spinning</div>
                            <div><DangerousIcon className="padLeft-inline"/> = Stop Spinning</div>
                            <div><HomeIcon className="padLeft-inline"/> = Reset View</div>
                            <div style={{
                                width: 'fit-content',
                                whiteSpace: 'nowrap',
                            }}><b>P / O</b> = Perspective / Orthographic View</div>
                        </div>
                        </div>
                    </div>

                    <div className="download-container">
                        
                        <Button className="download-button" variant="outlined" onClick={() => this.generate3DModel(true)}>Download X3G</Button>
                        
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                        }}>
                            <Button 
                                className="download-button-model"
                                variant="outlined" 
                                onClick={() => this.generate3DModel(false, 'stl')}>
                                STL
                            </Button>
                            <div style={{
                                width: '1rem'
                            }}></div>
                            <Button 
                                className="download-button-model"
                                variant="outlined" 
                                onClick={() => this.generate3DModel(false, 'obj')}>
                                OBJ
                            </Button>
                        </div>
                        <div 
                            className="slicing-status-label"
                            style={{ 
                                color: this.state.ready_to_slice ? 'green' : 'red',
                                fontWeight: 'bold'
                            }}
                        >
                            {this.state.ready_to_slice ? 'Ready to slice!' : 'Waiting on server...'}
                        </div>
                    </div>

                </div>

                <br></br>
                <br></br>
                <div className="sub-row">
                    Copyright &copy;2025 Toysinbox 3D Printing. Powered by Asunder Labs.
                </div>
            </div>
        );
    }
}

let scheduler_shared_counter = 0;
let scheduler: {
    [key: string]: () => void
} = {};
let error_scheduler: {
    [key: string]: (reason?: any) => void
} = {};
let websocket: WebSocket;

let rest_server: string;
let websocket_server: string;
let do_logging: boolean = true;

async function login (
    credentials: ToysinboxLoginCredentials, 
    _do_logging = true,
    update_react_state_callback: any
) {
    do_logging = _do_logging;
    rest_server = credentials.rest_server;
    websocket_server = credentials.websocket_server;

    // intermittently clear out scheduler cache
    setInterval(() => {
        if(scheduler_shared_counter <= 0){
            scheduler = {};
            error_scheduler = {};
            scheduler_shared_counter = 0;
        }
    }, 1000);

    // complete rest of async login process
    return new Promise<boolean>((resolve, reject) => {
        websocket = new WebSocket(websocket_server);
        websocket.addEventListener('open', () => {
            if(do_logging) console.log('opened websocket server');
            update_react_state_callback();
            resolve(true);
        });
        websocket.addEventListener('error', (e) => {
            if(do_logging) console.log('websocket error', e);
            resolve(false);
        });
        websocket.addEventListener('message', (e) => {
            // on update from server, get file
            const data: ServerRequestStatus = JSON.parse(e.data.toString());
            if(!data.event || !data.uuid) {
                if(do_logging) console.log('(500) Malformed response from server');
                if(data.uuid) error_scheduler[data.uuid]('(500) Malformed response from server');
                return;
            }
            
            // received successful response
            if(data.event === 'server_finished_processing'){
                if(do_logging) console.log("Received finished update, will send GET request!");
                scheduler[data.uuid]();
            } 

            // received failed response
            else if(data.event === 'server_failed_processing'){
                if(do_logging) console.error("(500) Server failed processing file");
                error_scheduler[data.uuid]('(500) Server failed processing file, ' + data.description);
            }
        });

        websocket.addEventListener('close', (e) => {
            console.log("LOST CONNECTION, logging back in...")
            setTimeout(() => {
                login(credentials, do_logging, update_react_state_callback);
            }, 100);
        });
    });
}

const POST_file = async (
    route: string,
    file: File,
    config: any, 
) => {
    return new Promise<string>((resolve, reject) => {
        if(do_logging) console.log('Sending POST request...');

        // get parameter JSON file
        const json_file = new File(
            [JSON.stringify(config)], 
            'params.json', 
            {
                type: 'text/plain',
                lastModified: new Date().getTime(),
            }
        );

        // get OBJ 3D model file 
        const model_file = file;

        // put files into a FormData to send to the server
        // this is achieved via multipart/form-data in request
        const files = [json_file, model_file];
        const data = new FormData();
        for (const file of files) {
            data.append('files[]', file, file.name);
        }

        // send the files to the server in a POST request
        console.log(`${rest_server}/${route}`);
        fetch(`${rest_server}/${route}`, {
            method: "POST", 
            headers: {               
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: data
        }).then(async (res) =>  {
            if(res.status !== 200){
                const text = await res.text();
                reject(`POST request error (${res.status}): ${text}`);
                return;
            }

            if(do_logging) console.log("POST request complete");
            const data = await res.json();
            websocket.send(JSON.stringify({
                event: 'client_received_uuid',
                uuid: data.uuid
            }));
            resolve(data.uuid);

        }).catch((err) => {
            if(do_logging) console.log("POST request error", err);
            reject('POST request error');
        });
    });
}

const GET_file = async (
    uuid: string,
    file_name: any
) => {
    return new Promise<File>((resolve, reject) => {
        if(do_logging) console.log('Sending GET request...');

        fetch(`${rest_server}/fetch-result`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uuid: uuid,
            } as ClientRequestResult)
        }).then(async (res) => {
            if(res.status !== 200){
                const text = await res.text();
                reject(`GET request error (${res.status}): ${text}`);
                return;
            }

            if(do_logging) console.log("GET request complete");
            const data_blob = await res.blob();
            const formatted_file_name = `${file_name}`;
            const output_file = new File([data_blob], formatted_file_name);
            resolve(output_file);
        }).catch((err) => {
            if(do_logging) console.error("GET request error", err);
            reject('GET request error');
        });
    });
}

async function convert (
    config: TaskConvertConfig, 
    file: File
) {
    if(do_logging) console.log('Starting converting process...', file);

    return new Promise<File>((resolve, reject) => {
        if(!file || !file.name){
            reject('invalid file');
            return;
        }
        const file_name = file.name.split('.').slice(0, -1).join('') + `.${config.target_format}`;
 
        scheduler_shared_counter += 1;

        // 1. Send file and config to the server
        POST_file('cloud-convert/file-upload', file, config)
            .then((file_uuid) => {
                // 2. Upon confirmation, wait for signal to get it from server
                scheduler[file_uuid] = async () => {
                    GET_file(file_uuid, file_name)
                        .then((file) => resolve(file))
                        .catch((reason) => reject(reason))
                        .finally(() => scheduler_shared_counter -= 1)
                }
                error_scheduler[file_uuid] = (reason: any) => {
                    reject(reason);
                    scheduler_shared_counter -= 1;
                }
            })
            .catch((reason) => {
                reject(reason);
                scheduler_shared_counter -= 1;
            });
    });
}

async function slice (
    config: TaskSliceConfig, 
    file: File
) {
    if(do_logging) console.log('Starting slicing process...', file);

    return new Promise<File>((resolve, reject) => {
        if(!file || !file.name){
            reject('invalid file');
            return;
        }
        const file_name = file.name.split('.').slice(0, -1).join('') + `.x3g`;
 
        scheduler_shared_counter += 1;

        // 1. Send file and config to the server
        POST_file('cloud-slice/file-upload', file, config)
            .then((file_uuid) => {
                // 2. Upon confirmation, wait for signal to get it from server
                scheduler[file_uuid] = async () => {
                    GET_file(file_uuid, file_name)
                        .then((file) => resolve(file))
                        .catch((reason) => reject(reason))
                        .finally(() => scheduler_shared_counter -= 1)
                }
                error_scheduler[file_uuid] = (reason: any) => {
                    reject(reason);
                    scheduler_shared_counter -= 1;
                }
            })
            .catch((reason) => {
                reject(reason);
                scheduler_shared_counter -= 1;
            });
    });
}