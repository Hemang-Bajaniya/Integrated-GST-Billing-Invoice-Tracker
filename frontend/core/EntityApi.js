// Generic CRUD Repository for managing entities via HTTP requests

export default class EntityApi {
    constructor(httpClient, url) {
        this.httpClient = httpClient;
        this.url = url;
    }

    getAll() {
        return this.httpClient.request(this.url, "GET");
    }

    add(entity) {
        return this.httpClient.request(this.url, "POST", entity);
    }

    update(entityId, entity) {
        return this.httpClient.request(`${this.url}/${entityId}`, "PUT", entity);
    }

    delete(entityId) {
        return this.httpClient.request(`${this.url}/${entityId}`, "DELETE");
    }
}

