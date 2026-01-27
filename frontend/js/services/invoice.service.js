import { apiRequest } from "./api.service.js";

const ENDPOINT = '/invoices';

export async function getInvoices() {
    try {
        const response = await apiRequest('GET', ENDPOINT);
        return response;
    }
    catch (error) {
        throw error;
    }
}

export async function addInvoice(data) {
    try {
        const response = await apiRequest('POST', ENDPOINT, data);
        return response;
    }
    catch (error) {
        throw error;
    }
}

export async function updateInvoice(id, data) {
    return apiRequest('PUT', `${ENDPOINT}/${id}`, data);
}

export async function deleteInvoice(id) {
    return apiRequest('DELETE', `${ENDPOINT}/${id}`);
}