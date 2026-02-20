import React from "react";
import { ReactNode } from "react";
import '../../styles/emojiselector.css';
import { Button } from "@mui/material";

export class EmojiSelector extends React.Component<{
    changeShape: (color: string) => void
}> {
    emojis: string[];

    constructor(props: {
        changeShape: (color: string) => void
    }){
        super(props);

        this.emojis = [
            'cat', 'dog', 'penguin', 'flower', 
            'star', 'heart', 'musicnote', 'fire', 
            'football', 'bear', // 'dolphin', 
            'fish', 'none',         
        ];
    }

    convert(shape: string){
        return shape === 'cat' ? '\u{1F408}' :
            shape === 'dog' ? '\u{1F415}' :
            shape === 'penguin' ? '\u{1F427}' :
            shape === 'flower' ? '\u{1F4A0}' : 
            shape === 'star' ? '\u{2B50}' :
            shape === 'heart' ? '\u{2665}' :
            shape === 'musicnote' ? '\u{1F3B5}' :

            shape === 'fire' ? '\u{1F525}' :
            shape === 'football' ? '\u{1F3C8}' :
            shape === 'dolphin' ? '\u{1F42C}' :
            shape === 'bear' ? '\u{1F43B}' :
            shape === 'fish' ? '\u{1F420}' : 
            shape === 'none' ? 'NONE' : '�';
    }

    render(): ReactNode {
        return (
            <div className="emoji-container">{
                this.emojis.map((emoji => {
                    return (<Button className={`emoji-block`} onClick={() => {
                        this.props.changeShape(emoji);
                    }} key={`${emoji}-emoji`}><div className={`${emoji === 'none' ? 'bebas-font' : 'emoji-font'}`}>
                        {this.convert(emoji)}    
                    </div></Button>);
                }))
            }</div>
        );
    }
}
