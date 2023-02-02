interface ServeJsonModifier {
    (headers: Headers, search: URLSearchParams, payload: Record<string, any>): void;
}

interface ServeJsonOption {
    headers?: Record<string,string> | Headers;
    search?: Record<string,string> | URLSearchParams;
    payload?: Record<string, any>;
    modifier?: ServeJsonModifier;
}