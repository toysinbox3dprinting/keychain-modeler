export interface Triangle {
    vertices: number[][],
    indices: number[]
}

export const intersect = (
    A: {
        vertices: number[][],
        indices: number[][],
    },
    B: {
        vertices: number[][],
        indices: number[][]
    }
): {
    vertices: number[][],
    indices: number[][]
}[] => {
    return [A, B];
}
