export type FileFormat = "stl" | "obj" | "ply";

export type ServerRequestStatus = {
    uuid: string,
    event: string,
    description: string
}

export type TaskConvertConfig = {
    input_format: FileFormat,
    target_format: FileFormat
}

export type TaskSliceConfig = {
    input_format: FileFormat,
    layer_height: number,
}

export type TaskStatus = {
    uuid: string,
    is_success: boolean,
    description: string
}

export type ClientRequestResult = {
    uuid: string
}

// #######################

export type ToysinboxLoginCredentials = {
    token: string,
    rest_server: string,
    websocket_server: string
};