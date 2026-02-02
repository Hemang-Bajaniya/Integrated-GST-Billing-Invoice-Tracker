// Dependency Injection Container for API instances

import EntityApi from "./EntityApi.js";

class Container {
    constructor(httpClient, BaseUrl = "") {
        this.httpClient = httpClient;
        this.instances = {};
        this.BaseUrl = BaseUrl;
    }

    get(apiName) {
        if (!this.instances[apiName]) {
            this.instances[apiName] = this.create(apiName);
        }
        return this.instances[apiName];
    }

    // Factory method to create API instances
    create(apiName) {
        switch (apiName) {
            case "customer":
                return new EntityApi(this.httpClient, this.BaseUrl + "/api/customers");

            case "invoice":
                return new EntityApi(this.httpClient, this.BaseUrl + "/api/invoices");

            case "product":
                return new EntityApi(this.httpClient, this.BaseUrl + "/api/products");

            default:
                throw new Error("Unknown API: " + apiName);
        }
    }
}

export default Container;