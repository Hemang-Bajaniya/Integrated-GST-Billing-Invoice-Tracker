import API_CONFIG from "../config/api.config.js";

export function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `${API_CONFIG.BASE_URL}${endpoint}`,
      contentType: "application/json",
      dataType: "json",
      method,
      data: JSON.stringify(data),
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })
      .done(resolve)
      .fail(reject);
  });
}