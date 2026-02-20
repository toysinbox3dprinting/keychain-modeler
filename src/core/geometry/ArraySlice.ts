type comparatorFunction = (...args : any[]) => boolean;
type mutFunction = (...args : any[]) => any;

export class ArraySlice<T>  {
    [index: string] : T | T[] | number | ThisType<T>; // T
    array : T[]
    start :number;
    end : number;
    length : number
    first : T; last : T;

    constructor(array : T[], start : number, end : number){
        this.array = array;

        // error checking
        if(!Number.isInteger(start)) throw Error('ArraySlice starting index must be an integer');
        if(!Number.isInteger(end)) throw Error('ArraySlice ending index must be an integer');

        // make sure start and end indices are valid
        // negative indices start from end, with [-1] being the last element
        const outOfBoundsError = (position : string) => Error(`ArraySlice ${position} index is out of bounds`);
        this.start = -1;
        this.end = -1;
        if(start > -1){
            if(start > array.length - 1) throw outOfBoundsError("starting");
            else this.start = start;
        } else if(start < 0){
            if(start < -array.length) throw outOfBoundsError("starting");
            else this.start = array.length + start;
        }
        if(end > - 1){
            if(end > array.length) throw outOfBoundsError("ending");
            else this.end = end;
        } else if(end < 0){
            if(end < -array.length) throw outOfBoundsError("starendingting");
            else this.end = array.length + end + 1;
        }

        if(this.start > this.end) throw Error("ArraySlice ending index is greater than starting index.")

        this.length = this.end - this.start;
        this.first = this.array[this.start];
        this.last = this.array[this.length - 1];

        Object.preventExtensions(this);

        // PROXY TIME!!!
        return new Proxy(this, {
            get(obj, prop) {
                // Handle meta symbols, allow console.log and iteration
                if(typeof prop === 'symbol'){
                    const symbolString = String(prop);
                    if(symbolString === 'Symbol(util.inspect.custom)'){
                        return () => obj.array.slice(obj.start, obj.end);
                    } else if(symbolString === 'Symbol(Symbol.iterator)'){
                        return obj.subarray()[Symbol.iterator];
                    } 
                // Accessing an index
                } else if(!isNaN(+prop)){
                    const index = parseInt(String(prop));
                    if(0 <= index && index < obj.end - obj.start){ // positive index
                        return obj.array[obj.start + index];
                    } else if(index < 0 && index > -obj.end + start){ // negative index
                        return obj.array[obj.end + index];
                    } else {
                        return undefined;
                    }
                // Other properties and methods
                } else if(typeof prop === 'string'){
                    // properties that never change
                    const properties = [
                        // ArraySlice custom properties
                        'array', 'subarray', 'start', 'end', 'mutmap', 'set',

                        // destructive Array properties (implementations)
                        'length', 'copyWithin', 'fill', 'reverse', 'sort',
                    ]
                    if(properties.includes(prop)) return obj[prop];

                    /*const accessorProperties = [
                        'concat', 'filter', 'includes', 'indexOf', 'join', 'lastIndexOf', 'slice',
                        'toString', 'toLocaleString', 'entries', 'every', 'find', 
                        'findIndex', 'forEach', 'keys', 'map', 'reduce', 'reduceRight',
                        'some', 'values', 
                    ];
                    if(accessorProperties.includes(prop)){
                        return obj.subarray()[prop];
                    }*/

                    // properties that do change, need to be updated
                    if(prop === 'first') return obj.array[obj.start];
                    if(prop === 'last') return obj.array[obj.length - 1];

                    // Object.prototype properties
                    if(prop === "constructor") return ArraySlice;
                    if(prop === "valueOf") return obj.subarray;
                }
                
                return null;
            },
            // protection
            deleteProperty(_){
                console.log("Cannot delete properties of ArraySlices");
                return false;
            },
            set(obj, prop, value){
                if(typeof prop === 'symbol'){
                    return false;
                } else if(!isNaN(+prop)){
                    const index = parseInt(String(prop));
                    if(0 <= index && index < obj.end - obj.start){ // positive index
                        obj.array[obj.start + index] = value;
                        return true;
                    } else if(index < 0 && index > -obj.end + start){ // negative index
                        obj.array[obj.end + index] = value;
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        })
    }

    copyWithin(relativeTarget : number, relativeStart = 0, relativeEnd = this.length) {
        const target = relativeTarget > -1 ? relativeTarget : this.length + relativeTarget;
        const start = relativeStart > -1 ? relativeStart : this.length + relativeStart;
        const end = relativeEnd > -1 ? relativeEnd : this.length + relativeEnd;

        const outOfBoundsError = (position : string) => Error(`ArraySlice copyWithin ${position} index is out of bounds`);
        if(target < 0 || this.length <= target) throw outOfBoundsError("target");
        if(start < 0 || this.length <= start) throw outOfBoundsError("starting");
        if(end < 0 || this.length <= end) throw outOfBoundsError("ending");
        if(start > end) throw Error("ArraySlice copyWithin ending index is greater than starting index.")

        const loopEnd = end - start < this.length ? end - start :
            target > start ? this.length - target : this.length - start;
        const cachedArray = this.array.slice(0);

        for(let i = 0; i < loopEnd; i++){
            if(this.start + target + i >= this.start + this.length) break;
            this.array[this.start + target + i] = cachedArray[this.start + start + i];
        }

        return this;
    }

    fill(value : any){
        for(let i = this.start; i < this.end; i++){
            this.array[i] = value;
        }

        return this;
    }

    mutmap(appliedFunction : mutFunction){
        for(let i = this.start; i < this.end; i++){
            this.array[i] = appliedFunction(this.array[i]);
        }

        return this;
    }   

    reverse(){
        for(let i = 0; i < (this.length / 2 | 0); i++){
            const temp = this.array[this.start + i];
            this.array[this.start + i] = this.array[this.end - i - 1];
            this.array[this.end - i - 1] = temp;
        }

        return this;
    }

    set(array : any[]){
        if(array.length !== this.length) throw Error("Array lengths must be matching");
        for(let i = 0; i < array.length; i++){
            this.array[i + this.start] = array[i];
        }

        return this;
    }

    sort(compareFunction : comparatorFunction = (a : any, b : any) => a < b){
        if(typeof compareFunction(this.first, this.last) !== "boolean") throw Error("Comparator function for sorting must return a boolean");
        // stack-based sort algorithm from https://www.geeksforgeeks.org/iterative-quick-sort/
        // stack-based sort algorithms cannot have a stack overflow
        const partition = (arr : any[], low : number, high : number) => {
            const pivot = arr[high];

            let i = low - 1;
            for(let j = low; j < high; j++){
                if(compareFunction(arr[j], pivot)){
                    i++;

                    const temp = arr[i];
                    arr[i] = arr[j];
                    arr[j] = temp;
                }
            }

            const temp = arr[i + 1];
            arr[i + 1] = arr[high];
            arr[high] = temp;

            return i + 1;
        }

        const iterativeSort = (arr : any[], l : number, h : number) => {
            const stack = [];
            let top = -1;

            stack[++top] = l;
            stack[++top] = h;

            while(top >= 0){
                h = stack[top--];
                l = stack[top--];

                const p = partition(arr, l, h);
                if(p - 1 > l){
                    stack[++top] = l;
                    stack[++top] = p - 1;
                }

                if(p + 1 < h){
                    stack[++top] = p + 1;
                    stack[++top] = h;
                }
            }
        }

        const slice = this.subarray();
        iterativeSort(slice, 0, this.length - 1);
        this.set(slice);

        return this;
    }

    subarray(){
        return this.array.slice(this.start, this.end);
    }
}
