/**
 * Log error to console (accepts Error, jqXHR, string)
 */
export function logError(err, type = 'error') {
    const message =
        err?.responseText ||
        err?.message ||
        (typeof err === 'string' ? err : 'Unknown error');

    console.error('[ERROR LOG]', {
        message,
        type,
        status: err?.status,
        url: window.location.href
    });
}
