import { apiRequest } from "./api.service.js";

const ENDPOINT = '/products';

export function getProducts() {
    return apiRequest('GET', ENDPOINT);
}

export function addProduct(product) {
    return apiRequest('POST', ENDPOINT, product);
}

export function updateProduct(id, product) {
    return apiRequest('PUT', `${ENDPOINT}/${id}`, product);
}

export function deleteProduct(id) {
    return apiRequest('DELETE', `${ENDPOINT}/${id}`);
}
