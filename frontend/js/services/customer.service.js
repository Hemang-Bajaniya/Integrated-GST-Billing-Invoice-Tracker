import { apiRequest } from "./api.service.js";

const ENDPOINT = '/customers';

export async function getCustomers() {
    try {
        const response = await apiRequest('GET', ENDPOINT);
        return response;
    }
    catch (error) {
        throw error;
    }
}

export async function addCustomer(data) {
    try {
        const response = await apiRequest('POST', ENDPOINT, data);
        return response;
    }
    catch (error) {
        throw error;
    }
}

export async function updateCustomer(id, data) {
    return apiRequest('PUT', `${ENDPOINT}/${id}`, data);
}

export async function deleteCustomer(id) {
    return apiRequest('DELETE', `${ENDPOINT}/${id}`);
}