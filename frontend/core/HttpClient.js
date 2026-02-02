// Abstract Base Class for HTTP Client Implementations

export default class HttpClient {
    request(url, method, data) {
        throw new Error("Not implemented");
    }
}