import React from 'react';
import { Button } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DangerousIcon from '@mui/icons-material/Dangerous';
import HomeIcon from '@mui/icons-material/Home';
import { CameraType } from '../../state/editorTypes';

type EditorControlsProps = {
    cameraType: CameraType;
    onStartSpin: () => void;
    onStopSpin: () => void;
    onResetView: () => void;
    onSwitchToOrthographic: () => void;
    onSwitchToPerspective: () => void;
};

export const EditorControls = (props: EditorControlsProps) => {
    return (
        <div className='editor-control-container'>
            <div className='editor-buttons'>
                <div className='view-options-label'>View Options: </div>
                <Button className='editor-button' onClick={props.onStartSpin} variant='outlined'>
                    <AutorenewIcon />
                </Button>
                <Button className='editor-button' onClick={props.onStopSpin} variant='outlined'>
                    <DangerousIcon />
                </Button>
                <Button className='editor-button' onClick={props.onResetView} variant='outlined'>
                    <HomeIcon />
                </Button>
                {props.cameraType === 'perspective' ? (
                    <Button className='editor-button' onClick={props.onSwitchToOrthographic} variant='outlined'>
                        <b>P</b>
                    </Button>
                ) : (
                    <Button className='editor-button' onClick={props.onSwitchToPerspective} variant='outlined'>
                        <b>O</b>
                    </Button>
                )}
            </div>

            <div className='sub-sub-row'>
                <div className='wrap-40'>
                    <div>
                        <AutorenewIcon className='padAround-inline' /> = Start Spinning
                    </div>
                    <div>
                        <DangerousIcon className='padLeft-inline' /> = Stop Spinning
                    </div>
                    <div>
                        <HomeIcon className='padLeft-inline' /> = Reset View
                    </div>
                    <div
                        style={{
                            width: 'fit-content',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <b>P / O</b> = Perspective / Orthographic View
                    </div>
                </div>
            </div>
        </div>
    );
};
