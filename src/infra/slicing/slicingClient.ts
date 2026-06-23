import {
    ClientRequestResult,
    TaskConvertConfig,
    TaskSliceConfig,
    ToysinboxLoginCredentials,
} from './slicingTypes';

// Slicing results are delivered by polling /fetch-result over HTTP. The server's
// WebSocket "finished" notification was unreliable: a job often completes before
// the client's subscription registers (a handshake race), so the event is dropped
// and the export hangs. Polling makes completion independent of that event.
const SLICING_POLL_INITIAL_DELAY_MS = 400;
const SLICING_POLL_INTERVAL_MS = 800;
const SLICING_TIMEOUT_MS = 120_000;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class SlicingClient {
    constructor(
        private readonly credentials: ToysinboxLoginCredentials,
        private readonly doLogging = false,
    ) {}

    // No persistent connection is needed; reachability is checked per request.
    // Kept for API compatibility and to signal UI readiness.
    connect(onReady?: () => void): Promise<boolean> {
        onReady?.();
        return Promise.resolve(true);
    }

    disconnect(): void {
        // No persistent connection to tear down.
    }

    async convert(config: TaskConvertConfig, file: File): Promise<File> {
        return this.startProcessing('cloud-convert/file-upload', config, file, config.target_format);
    }

    async slice(config: TaskSliceConfig, file: File): Promise<File> {
        return this.startProcessing('cloud-slice/file-upload', config, file, 'x3g');
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
        return this.pollForResult(uuid, fileName);
    }

    private async pollForResult(uuid: string, fileName: string): Promise<File> {
        const deadline = Date.now() + SLICING_TIMEOUT_MS;
        await delay(SLICING_POLL_INITIAL_DELAY_MS);

        while (Date.now() < deadline) {
            try {
                return await this.fetchFile(uuid, fileName);
            } catch (error) {
                // Result not ready yet (or a transient error) — keep polling until timeout.
                if (this.doLogging) {
                    console.log('slicing result not ready, retrying', error);
                }
                await delay(SLICING_POLL_INTERVAL_MS);
            }
        }

        throw new Error('(504) Timed out waiting for slicing result');
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
        if (blob.size === 0) {
            // A ready result is never empty; treat as "not ready" so polling continues.
            throw new Error('empty result');
        }
        return new File([blob], fileName);
    }
}
