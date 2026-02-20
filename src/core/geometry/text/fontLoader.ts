import opentype from 'opentype.js';

export const loadFont = async (url: string): Promise<any> => {
    return await new Promise((resolve, reject) => {
        // @ts-ignore
        opentype.load(url, (err, font) => (err ? reject(err) : resolve(font)), undefined);
    });
};

export const isTtfFont = (fontPath: string): boolean => fontPath.slice(-3) === 'ttf';
