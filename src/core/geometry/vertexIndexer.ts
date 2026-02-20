export interface Indexer {
    unique: any[];
    indices: number[];
    map: object;
}

export class Indexer {
    constructor(){
        this.unique = [];
        this.indices = [];
        this.map = {};
    }

    add(obj : any) : any {
        const key = JSON.stringify(obj);
        if(!(key in this.map)){
            // @ts-ignore
            this.map[key] = this.unique.length;
            this.unique.push(obj);
        }
        // @ts-ignore
        return this.map[key];
    }
}
