const getRawEnv = () => import.meta.env;

export const getClientEnv = (key: keyof ImportMetaEnv, fallback = ''): string => {
  const value = getRawEnv()[key];
  return typeof value === 'string' ? value : fallback;
};

export const isClientProduction = (): boolean => getRawEnv().PROD;
