import { Polyhedron } from './geometry';
import {createText} from './createText';

export const createSVG = async (shape : string, fontfile : string, fontHeight : number, height : number, resolution : number) : Promise<Polyhedron> => {
    const codepoint = 
        shape === 'cat' ? '\u{1F408}' :
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

        '�';


    // 1F408,1F415,1F427,1F4A0,2B50,2665,1F3B5,
    // 1F525,1F3C8,1F42C,1F43B,1F420,FFFD
    
    const rawObject = await createText(
        codepoint,
        fontfile,
        fontHeight, height, resolution
    );
    const object = rawObject // .flipY();
    // object.translate(0, -12, 0);

    if(shape === 'cat'){
        object.translate(420 / 10, 160 / 10, 50 / 10);
    } else if(shape === 'dog'){
        object.setSizeX(140 / 10);
        object.setSizeY(130 / 10);
        object.translate(435 / 10, 145 / 10, 50 / 10);
    } else if(shape === 'penguin'){
        object.setSizeX(130 / 10);
        object.setSizeY(150 / 10);
        object.translate(435 / 10, 150 / 10, 50 / 10);
    } else if(shape === 'flower'){
        object.setSizeX(120 / 10);
        object.setSizeY(130 / 10);
        object.translate(450 / 10, 145 / 10, 50 / 10);
    } else if(shape === 'star'){
        object.setSizeX(125 / 10);
        object.setSizeY(130 / 10);
        object.translate(430 / 10, 155 / 10, 50 / 10);
    } else if(shape === 'musicnote'){
        object.setSizeX(130 / 10);
        object.setSizeY(150 / 10);
        object.translate(440 / 10, 160 / 10, 50 / 10);
    } else if(shape === 'heart'){
        object.setSizeX(130 / 10);
        object.setSizeY(130 / 10);
        object.translate(420 / 10, 160 / 10, 50 / 10);
    } 

    else if(shape === 'fire'){
        object.setSizeX(110 / 10);
        object.setSizeY(145 / 10);
        object.translate(425 / 10, 155 / 10, 50 / 10);
    } else if(shape === 'football'){
        object.setSizeX(125 / 10);
        object.setSizeY(125 / 10);
        object.translate(435 / 10, 150 / 10, 50 / 10);
    } else if(shape === 'dolphin') {
        object.setSizeX(120 / 10);
        object.setSizeY(150 / 10);
        object.translate(420 / 10, 150 / 10, 50 / 10);
    } else if(shape === 'bear'){
        object.setSizeX(130 / 10);
        object.setSizeY(130 / 10);
        object.translate(428 / 10, 160 / 10, 50 / 10);
    } else if(shape === 'fish'){
        object.setSizeX(135 / 10);
        object.setSizeY(130 / 10);
        object.translate(445 / 10, 160 / 10, 50 / 10);
    }
    
    else {
        // 120, 150, 440, 150
        object.setSizeX(130 / 10);
        object.setSizeY(130 / 10);
        object.translate(420 / 10, 160 / 10, 50 / 10);
    }

    return object;
}