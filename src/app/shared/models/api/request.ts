export interface RestRequestOptions {
    params?: { [key: string]: string | number };
    headers?: { [header: string]: string | string[] };
    body?: any;
    streamName?: string;
    useDebounce?: boolean;
    debounceMs?: number;
}