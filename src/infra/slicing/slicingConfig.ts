import { ToysinboxLoginCredentials } from './slicingTypes';
import { getClientEnv } from '@app/env';

export const getSlicingCredentials = (): ToysinboxLoginCredentials => ({
    token: '',
    rest_server: getClientEnv('REACT_APP_API_BASE_URL', 'https://slicing-www.asunder.co'),
    websocket_server: getClientEnv('REACT_APP_WS_BASE_URL', 'wss://slicing-wss.asunder.co'),
});
