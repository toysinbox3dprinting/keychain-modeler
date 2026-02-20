import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { CameraType } from '../../state/editorTypes';
import { LOOK_POS, START_POS } from '../../state/editorConstants';

type SceneViewportProps = {
    cameraType: CameraType;
    groupRef: React.RefObject<any>;
    controlsRef: React.RefObject<any>;
    spinningRef: React.MutableRefObject<boolean>;

    textGenerated: boolean;
    textGeometry: THREE.BufferGeometry;
    textMaterial: THREE.MeshBasicMaterial;

    baseGenerated: boolean;
    baseGeometry: THREE.BufferGeometry;
    baseMaterial: THREE.MeshBasicMaterial;
};

const CameraSelector = ({ cameraType }: { cameraType: CameraType }) => {
    const { viewport } = useThree();
    const orthoRef = useRef<any>();
    const frustumSize = 100;

    useFrame(() => {
        if (cameraType === 'orthographic' && orthoRef.current) {
            const camera = orthoRef.current;
            camera.left = (-frustumSize * viewport.aspect) / 2;
            camera.right = (frustumSize * viewport.aspect) / 2;
            camera.top = frustumSize / 2;
            camera.bottom = -frustumSize / 2;
            camera.updateProjectionMatrix();
        }
    });

    if (cameraType === 'perspective') {
        return <PerspectiveCamera makeDefault position={START_POS} near={0.1} far={1000} fov={75} />;
    }

    return (
        <OrthographicCamera
            ref={orthoRef}
            makeDefault
            position={START_POS}
            near={0.1}
            far={1000}
            left={(-frustumSize * viewport.aspect) / 2}
            right={(frustumSize * viewport.aspect) / 2}
            top={frustumSize / 2}
            bottom={-frustumSize / 2}
            zoom={1}
        />
    );
};

const SpinUpdate = ({
    groupRef,
    spinningRef,
}: {
    groupRef: React.RefObject<any>;
    spinningRef: React.MutableRefObject<boolean>;
}) => {
    useFrame((state, delta) => {
        if (!spinningRef.current || !groupRef.current) {
            return;
        }

        const group = groupRef.current;
        const dtheta = (delta / 8) * Math.PI * 2;
        group.translateX(25);
        group.rotateY(dtheta);
        group.translateX(-25);
    });

    return <></>;
};

export const SceneViewport = (props: SceneViewportProps) => {
    return (
        <div className='main-canvas'>
            <Canvas>
                <CameraSelector cameraType={props.cameraType} />

                <group ref={props.groupRef}>
                    {props.textGenerated && (
                        <group>
                            <mesh geometry={props.textGeometry} material={props.textMaterial}></mesh>
                            <lineSegments>
                                <edgesGeometry attach={'geometry'} args={[props.textGeometry, 30]} />
                                <lineBasicMaterial color={'black'} />
                            </lineSegments>
                        </group>
                    )}

                    {props.baseGenerated && (
                        <group>
                            <mesh geometry={props.baseGeometry} material={props.baseMaterial}></mesh>
                            <lineSegments>
                                <edgesGeometry attach={'geometry'} args={[props.baseGeometry, 30]} />
                                <lineBasicMaterial color={'black'} />
                            </lineSegments>
                        </group>
                    )}

                    <ambientLight />
                    <pointLight position={[35, 10, 20]} />
                </group>

                <OrbitControls position={START_POS} target={LOOK_POS} ref={props.controlsRef} />
                <SpinUpdate groupRef={props.groupRef} spinningRef={props.spinningRef} />
            </Canvas>
        </div>
    );
};
