import { getClientEnv, isClientProduction } from './env';

const normalizeBasePath = (pathValue: string): string => {
    if (!pathValue || pathValue === '/') {
        return '/';
    }

    const withLeadingSlash = pathValue.startsWith('/') ? pathValue : `/${pathValue}`;
    return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
};

export const getAppBasePath = (): string => {
    // Keep local dev on root by default to avoid basename mismatch 404s.
    if (!isClientProduction() && getClientEnv('REACT_APP_ENABLE_BASE_PATH_IN_DEV') !== 'true') {
        return '/';
    }

    return normalizeBasePath(getClientEnv('REACT_APP_BASE_PATH', '/'));
};
