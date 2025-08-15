export const GEOLOCATION_ERROR_MESSAGE = (code: number): string => {
  const messages: Record<number, string> = {
    1: 'Permission denied for geolocation',
    2: 'Internal error retrieving geolocation',
    3: 'Geolocation request timeout',
  };

  return messages[code] ?? 'Unknown geolocation error';
};