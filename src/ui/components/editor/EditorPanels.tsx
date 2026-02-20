import React, { useEffect, useRef } from 'react';
import Accordion from '@mui/material/Accordion';
import { AccordionDetails, AccordionSummary, TextField } from '@mui/material';
import { ArrowForwardIosSharp } from '@mui/icons-material';
import { ColorSelector } from './ColorSelector';
import { EmojiSelector } from './EmojiSelector';
import { PanelId } from '../../state/editorTypes';
import { TEXT_INPUT_DEBOUNCE_MS } from '../../state/editorConstants';

type EditorPanelsProps = {
    selectedPanel: PanelId | false;
    onPanelChange: (panel: PanelId, expanded: boolean) => void;
    onTextChange: (text: string) => void;
    onBaseColorChange: (color: number) => void;
    onTextColorChange: (color: number) => void;
    onShapeChange: (shape: string) => void;
};

const renderHeader = (text: string) => <div className='bebas-header'>{text}</div>;

export const EditorPanels = (props: EditorPanelsProps) => {
    const textChangeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (textChangeTimeout.current) {
                clearTimeout(textChangeTimeout.current);
            }
        };
    }, []);

    const handlePanelChange = (panel: PanelId) => (event: React.SyntheticEvent, expanded: boolean) => {
        props.onPanelChange(panel, expanded);
    };

    return (
        <div className='params-column'>
            <Accordion
                className='params-column-card'
                expanded={props.selectedPanel === 'panel1'}
                onChange={handlePanelChange('panel1')}
            >
                <AccordionSummary
                    expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
                    aria-controls='panel1d-content'
                    sx={{ marginBottom: '0px' }}
                    id='panel1d-header'
                >
                    {renderHeader('📜 TEXT')}
                </AccordionSummary>
                <AccordionDetails className='params-card params-panel-inner'>
                    <div className='comic-label'>Put your name here:</div>
                    <TextField
                        id='text-field-input'
                        defaultValue={'hello'}
                        onChange={(event) => {
                            if (textChangeTimeout.current) {
                                clearTimeout(textChangeTimeout.current);
                            }

                            const nextText = event.target.value;
                            textChangeTimeout.current = setTimeout(() => {
                                props.onTextChange(nextText);
                            }, TEXT_INPUT_DEBOUNCE_MS);
                        }}
                        label='Your Keychain Text'
                        variant='outlined'
                    />
                </AccordionDetails>
            </Accordion>

            <Accordion
                className='params-column-card'
                expanded={props.selectedPanel === 'panel2'}
                onChange={handlePanelChange('panel2')}
            >
                <AccordionSummary
                    expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
                    aria-controls='panel2d-content'
                    id='panel2d-header'
                >
                    {renderHeader('🎨 BASE COLOR')}
                </AccordionSummary>
                <AccordionDetails className='params-card params-panel-inner'>
                    <div className='comic-label'>Choose your base color:</div>
                    <ColorSelector changeColor={props.onBaseColorChange} />
                </AccordionDetails>
            </Accordion>

            <Accordion
                className='params-column-card'
                expanded={props.selectedPanel === 'panel2b'}
                onChange={handlePanelChange('panel2b')}
            >
                <AccordionSummary
                    expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
                    aria-controls='panel2d-content'
                    id='panel2d-header'
                >
                    {renderHeader('🎨 TEXT COLOR')}
                </AccordionSummary>
                <AccordionDetails className='params-card params-panel-inner'>
                    <div className='comic-label'>Choose your text color:</div>
                    <ColorSelector changeColor={props.onTextColorChange} />
                </AccordionDetails>
            </Accordion>

            <Accordion
                className='params-column-card'
                expanded={props.selectedPanel === 'panel3'}
                onChange={handlePanelChange('panel3')}
            >
                <AccordionSummary
                    expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '0.9rem' }} />}
                    aria-controls='panel3d-content'
                    id='panel3d-header'
                >
                    {renderHeader('🐱 SHAPE')}
                </AccordionSummary>
                <AccordionDetails className='params-card params-panel-inner'>
                    <div className='comic-label'>Choose your shape:</div>
                    <EmojiSelector changeShape={props.onShapeChange} />
                </AccordionDetails>
            </Accordion>
        </div>
    );
};
