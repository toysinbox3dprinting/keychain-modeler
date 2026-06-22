import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlicingClient } from './slicingClient';

const credentials = {
    token: '',
    rest_server: 'https://slice.test',
    websocket_server: 'wss://slice.test',
};

describe('SlicingClient', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('resolves via /fetch-result polling when the WS completion event never arrives', async () => {
        // Reproduces the handshake race: the server finishes before our WS subscription
        // registers, so the completion notification is dropped. /fetch-result returns
        // 404 until the job is done, then the bytes. The client must still resolve.
        let fetchResultCalls = 0;
        const fetchMock = vi.fn(async (url: string) => {
            if (url.endsWith('/cloud-convert/file-upload')) {
                return new Response(JSON.stringify({ uuid: 'job-123' }), { status: 200 });
            }
            if (url.endsWith('/fetch-result')) {
                fetchResultCalls += 1;
                if (fetchResultCalls < 3) {
                    return new Response('not ready', { status: 404 });
                }
                return new Response(new Blob([new Uint8Array([1, 2, 3, 4])]), { status: 200 });
            }
            throw new Error(`unexpected url ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        // Never call connect(): with no WS, completion can only come from polling.
        const client = new SlicingClient(credentials);
        const input = new File([new Uint8Array([0])], 'model.obj');

        const resultPromise = client.convert({ input_format: 'obj', target_format: 'stl' }, input);

        await vi.advanceTimersByTimeAsync(400 + 800 + 800 + 50);
        const result = await resultPromise;

        expect(result.name).toBe('model.stl');
        expect(fetchResultCalls).toBeGreaterThanOrEqual(3);
    });

    it('rejects after the timeout instead of hanging forever when the result never appears', async () => {
        const fetchMock = vi.fn(async (url: string) => {
            if (url.endsWith('/cloud-slice/file-upload')) {
                return new Response(JSON.stringify({ uuid: 'job-456' }), { status: 200 });
            }
            return new Response('not ready', { status: 404 });
        });
        vi.stubGlobal('fetch', fetchMock);

        const client = new SlicingClient(credentials);
        const input = new File([new Uint8Array([0])], 'model.stl');

        const resultPromise = client.slice({ input_format: 'stl', layer_height: 0.2 }, input);

        // Drive the fake clock past the timeout concurrently with awaiting the rejection.
        void vi.advanceTimersByTimeAsync(120_000 + 1_000);
        await expect(resultPromise).rejects.toThrow(/Timed out/);
    });
});
