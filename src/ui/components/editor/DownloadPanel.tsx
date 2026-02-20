import React from 'react';
import { Button } from '@mui/material';

type DownloadPanelProps = {
    readyToSlice: boolean;
    onDownloadX3g: () => void;
    onDownloadStl: () => void;
    onDownloadObj: () => void;
};

export const DownloadPanel = (props: DownloadPanelProps) => {
    return (
        <div className='download-container'>
            <Button className='download-button' variant='outlined' onClick={props.onDownloadX3g}>
                Download X3G
            </Button>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                }}
            >
                <Button className='download-button-model' variant='outlined' onClick={props.onDownloadStl}>
                    STL
                </Button>
                <div
                    style={{
                        width: '1rem',
                    }}
                ></div>
                <Button className='download-button-model' variant='outlined' onClick={props.onDownloadObj}>
                    OBJ
                </Button>
            </div>

            <div
                className='slicing-status-label'
                style={{
                    color: props.readyToSlice ? 'green' : 'red',
                    fontWeight: 'bold',
                }}
            >
                {props.readyToSlice ? 'Ready to slice!' : 'Waiting on server...'}
            </div>
        </div>
    );
};
