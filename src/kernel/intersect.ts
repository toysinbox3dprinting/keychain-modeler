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
    const trianglesA = A.indices.map(triple => ({
        vertices: triple.map(i => A.vertices[i]),
        indices: triple
    } as Triangle));

    const trianglesB = A.indices.map(triple => ({
        vertices: triple.map(i => A.vertices[i]),
        indices: triple
    } as Triangle));

    return [A, B];
}