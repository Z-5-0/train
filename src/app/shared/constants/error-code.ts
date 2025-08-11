import { HttpErrorResponse } from "@angular/common/http";

export function getErrorMessage(error: HttpErrorResponse): string {
    const errorMsg = error?.error?.error || 'No error message';
    const detailMsg = (error?.error?.detail?.error?.message || error.error.detail).replace(/\n\n/g, '\n') || '';

    const messages: { [key: number]: string } = {
        400: `${error.status} - Bad request\n${errorMsg}\n${detailMsg}`,
        401: `${error.status} - You do not have permission to perform the action\n${errorMsg}\n${detailMsg}`,
        403: `${error.status} - Forbidden, you are not authorized to access this resource\n${errorMsg}\n${detailMsg}`,
        404: `${error.status} - Client request could not be found\n${errorMsg}\n${detailMsg}`,
        408: `${error.status} - Request timeout, please try again\n${errorMsg}\n${detailMsg}`,
        422: `${error.status} - Unprocessable Entity, validation failed\n${errorMsg}\n${detailMsg}`,
        429: `${error.status} - Too many requests\n${errorMsg}\n${detailMsg}`,
        500: `${error.status} - Internal server error\n${errorMsg}\n${detailMsg}`,
        502: `${error.status} - Bad gateway\n${errorMsg}\n${detailMsg}`,
        503: `${error.status} - Service unavailable\n${errorMsg}\n${detailMsg}`,
        504: `${error.status} - Gateway timeout\n${errorMsg}\n${detailMsg}`,
    };

    return messages[error.status] || 'Unexpected error occurred';
}