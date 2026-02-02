// Concrete Implementation of HttpClient

import HttpClient from "./HttpClient.js";

export default class JQueryHttpClient extends HttpClient {
    request(url, method, data) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                method: method,
                data: data ? JSON.stringify(data) : null,
                contentType: 'application/json',
                success: function (response) {
                    resolve(response);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    reject(new Error(`HTTP ${textStatus}: ${errorThrown}`));
                }
            });
        });
    }
}