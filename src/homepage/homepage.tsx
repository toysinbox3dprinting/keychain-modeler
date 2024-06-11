import React, { Ref, useEffect, useRef, useState } from "react";
import { ReactNode } from "react";
import './homepage.css';

import * as THREE from 'three';
import { Canvas, RootState, useFrame, useThree } from "@react-three/fiber";
import { createBox } from "../kernel/createBox";
import { Point } from "../lib/geometry";
import { CSGToData } from "../lib/CSGToData";
import { OrbitControls } from '@react-three/drei'
import './homepage.css';
import { createCylinder } from "../kernel/createCylinder";
import { createText } from "../kernel/createText";

import BebasFont from '../resources/BebasNeue.otf';
import EmojiFont from '../kernel/fonts/NotoEmoji-Regular.ttf';
import Accordion from "@mui/material/Accordion";
import { AccordionSummary, Typography, AccordionDetails, TextField, Button, Container } from "@mui/material";
import { ArrowForwardIosSharp } from "@mui/icons-material";
import ThreeSixtyIcon from '@mui/icons-material/ThreeSixty';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DangerousIcon from '@mui/icons-material/Dangerous';
import HomeIcon from '@mui/icons-material/Home';
import { ColorSelector } from "./colorselector";

import LogoImage from '../resources/logo_transparent.png';
import { EmojiSelector } from "./emojiselector";
import { createSVG } from "../kernel/createSVG";

let spinning = true;
let groupRef: any = undefined;
let originalRotation : number[] = [0, 0, 0];

const startPos: [number, number, number] = [25, 65, 25];
const lookPos: [number, number, number] = [25, 10, 0];

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
}

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
        };

        this.groupRef = React.createRef();
        this.controlsRef = React.createRef();
    }

    componentDidMount() {
        this.generateKeychainText();
        this.generateKeychainBase();

        this.generate3DModel = this.generate3DModel.bind(this);
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
        const textBaseBox = createBox(new Point(0, 0, 0), 60, 20, 5);
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

    download(filename: string, data: string){
        const lines = data.split('\n').map(line => {
            if(line.slice(0, 1) != 'v'){
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
    
        const newData = lines.join('\n');
        const blob = new Blob([newData], {type: 'text/csv'});
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }

    generate3DModel(){
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
                console.log(correctedText, emoji);
                console.log(top)
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
        
            this.download(`keychain-${this.state.text}.obj`, `
# File generated by Keychain Generator
# Joshua Yang - Kauhentus - Toysinbox 3D Printing
g keychain
# Vertices
${data.vertices.map(v => `v ${v[0]} ${v[1]} ${v[2]} 0.0`).join('\r\n')}

# Indices
${data.indices.map(i => `f ${i[0] + 1} ${i[1] + 1} ${i[2] + 1}`).join('\r\n')}`
            );
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
        console.log("RERENDER TIME");

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
                        <Canvas
                            camera={{ 
                                near: 0.1,
                                far: 1000,
                                position: startPos
                            }}>

                            <group ref={this.groupRef}>
                                {this.keychainText()}
                                {this.keychainBase()}

                                <ambientLight />
                                <pointLight position={[35, 10, 20]} />
                                <axesHelper args={[100]}/>
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
                                controls.target.set(...lookPos);
                            }
                        }} variant="outlined">
                            <HomeIcon/>
                        </Button>
                    </div>

                    <Button className="download-button" variant="outlined" onClick={this.generate3DModel}>Download!</Button>
                </div>

                <div className="sub-sub-row">
                    <div className='wrap-40'>
                        <div><AutorenewIcon className="padAround-inline"/> = Start Spinning</div>
                        <div><DangerousIcon className="padLeft-inline"/> = Stop Spinning</div>
                        <div><HomeIcon className="padLeft-inline"/> = Reset View</div>
                    </div>
                </div>

                <br></br>
                <br></br>
                <div className="sub-row">
                    Copyright &copy;2023 Toysinbox 3D Printing.
                </div>
            </div>
        );
    }
}