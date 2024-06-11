import React from "react";
import { ReactNode } from "react";
import './colorselector.css';
import { Button } from "@mui/material";

export class ColorSelector extends React.Component<{
    changeColor: (color: number) => void
}> {
    colors: number[];

    constructor(props: {
        changeColor: (color: number) => void
    }){
        super(props);

        this.colors = [
            0xffc0cb, 0xff0000, 0xffa500, 0xffd700, 0xffff00, 0x00ff00, 0x008000,
            0x00ffff, 0x0000ff, 0x000000, 0x800080, 0x654321, 0x808080, 0xffffff
        ];
    }

    render(): ReactNode {
        return (
            <div className="color-container">{
                this.colors.map((color => {
                    let colorString = `#${color.toString(16).padStart(6, '0')}ff`;
                    return (<Button className="color-block" style={{backgroundColor: colorString}} onClick={() => {
                        this.props.changeColor(color);
                    }} key={colorString}></Button>);
                }))
            }</div>
        );
    }
}