import {
    ClientRequestResult,
    ServerRequestStatus,
    TaskConvertConfig,
    TaskSliceConfig,
    ToysinboxLoginCredentials,
} from './slicingTypes';

type PendingRequest = {
    fileName: string;
    resolve: (file: File) => void;
    reject: (reason?: string) => void;
};

export class SlicingClient {
    private websocket: WebSocket | null = null;
    private pendingRequests = new Map<string, PendingRequest>();
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly credentials: ToysinboxLoginCredentials,
        private readonly doLogging = false,
    ) {}

    connect(onReady?: () => void): Promise<boolean> {
        this.ensureCleanupInterval();

        return new Promise<boolean>((resolve) => {
            const websocket = new WebSocket(this.credentials.websocket_server);
            this.websocket = websocket;

            websocket.addEventListener('open', () => {
                if (this.doLogging) {
                    console.log('opened websocket server');
                }
                onReady?.();
                resolve(true);
            });

            websocket.addEventListener('error', (error) => {
                if (this.doLogging) {
                    console.log('websocket error', error);
                }
                resolve(false);
            });

            websocket.addEventListener('message', (event) => {
                void this.handleMessage(event);
            });

            websocket.addEventListener('close', () => {
                if (this.doLogging) {
                    console.log('websocket closed, reconnecting...');
                }
                this.scheduleReconnect(onReady);
            });
        });
    }

    disconnect(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }

        this.pendingRequests.forEach((request) => request.reject('client disconnected'));
        this.pendingRequests.clear();
    }

    async convert(config: TaskConvertConfig, file: File): Promise<File> {
        return this.startProcessing('cloud-convert/file-upload', config, file, config.target_format);
    }

    async slice(config: TaskSliceConfig, file: File): Promise<File> {
        return this.startProcessing('cloud-slice/file-upload', config, file, 'x3g');
    }

    private ensureCleanupInterval(): void {
        if (this.cleanupInterval) {
            return;
        }

        this.cleanupInterval = setInterval(() => {
            if (this.pendingRequests.size === 0) {
                this.pendingRequests.clear();
            }
        }, 1000);
    }

    private scheduleReconnect(onReady?: () => void): void {
        if (this.reconnectTimeout) {
            return;
        }

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            void this.connect(onReady);
        }, 250);
    }

    private async handleMessage(event: MessageEvent): Promise<void> {
        let data: ServerRequestStatus;
        try {
            data = JSON.parse(event.data.toString()) as ServerRequestStatus;
        } catch (error) {
            if (this.doLogging) {
                console.error('(500) Malformed response from server', error);
            }
            return;
        }

        if (!data.event || !data.uuid) {
            const pendingMalformed = data.uuid ? this.pendingRequests.get(data.uuid) : undefined;
            pendingMalformed?.reject('(500) Malformed response from server');
            if (pendingMalformed) {
                this.pendingRequests.delete(data.uuid);
            }
            return;
        }

        const pending = this.pendingRequests.get(data.uuid);
        if (!pending) {
            return;
        }

        if (data.event === 'server_finished_processing') {
            if (this.doLogging) {
                console.log('received finished update for', data.uuid);
            }
            try {
                const file = await this.fetchFile(data.uuid, pending.fileName);
                pending.resolve(file);
            } catch (error) {
                pending.reject(error instanceof Error ? error.message : String(error));
            } finally {
                this.pendingRequests.delete(data.uuid);
            }
            return;
        }

        if (data.event === 'server_failed_processing') {
            pending.reject(`(500) Server failed processing file, ${data.description}`);
            this.pendingRequests.delete(data.uuid);
        }
    }

    private async startProcessing(
        route: string,
        config: TaskConvertConfig | TaskSliceConfig,
        file: File,
        outputExtension: string,
    ): Promise<File> {
        if (!file || !file.name) {
            throw new Error('invalid file');
        }

        const fileName = `${file.name.split('.').slice(0, -1).join('')}.${outputExtension}`;
        const uuid = await this.postFile(route, file, config);

        return new Promise<File>((resolve, reject) => {
            this.pendingRequests.set(uuid, {
                fileName,
                resolve,
                reject,
            });
        });
    }

    private async postFile(
        route: string,
        file: File,
        config: TaskConvertConfig | TaskSliceConfig,
    ): Promise<string> {
        const jsonFile = new File([
            JSON.stringify(config),
        ], 'params.json', {
            type: 'text/plain',
            lastModified: Date.now(),
        });

        const formData = new FormData();
        formData.append('files[]', jsonFile, jsonFile.name);
        formData.append('files[]', file, file.name);

        const response = await fetch(`${this.credentials.rest_server}/${route}`, {
            method: 'POST',
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                Pragma: 'no-cache',
                Expires: '0',
            },
            body: formData,
        });

        if (response.status !== 200) {
            const text = await response.text();
            throw new Error(`POST request error (${response.status}): ${text}`);
        }

        const responseData = await response.json() as { uuid: string };
        if (!responseData.uuid) {
            throw new Error('POST request error: missing uuid');
        }

        this.websocket?.send(JSON.stringify({
            event: 'client_received_uuid',
            uuid: responseData.uuid,
        }));

        return responseData.uuid;
    }

    private async fetchFile(uuid: string, fileName: string): Promise<File> {
        const response = await fetch(`${this.credentials.rest_server}/fetch-result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uuid } as ClientRequestResult),
        });

        if (response.status !== 200) {
            const text = await response.text();
            throw new Error(`GET request error (${response.status}): ${text}`);
        }

        const blob = await response.blob();
        return new File([blob], fileName);
    }
}
