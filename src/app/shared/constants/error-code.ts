import { HttpErrorResponse } from "@angular/common/http";

export function getErrorMessage(error: HttpErrorResponse): string {
    const messages: { [key: number]: string } = {
        400: `${error.status} - Bad request\n${error.error.error}\n${error.error.detail.error.message}`,
        401: `${error.status} - You do not have permission to perform the action\n${error.error.error}\n${error.error.detail.error.message}`,
        403: `${error.status} - Forbidden, you are not authorized to access this resource\n${error.error.error}\n${error.error.detail.error.message}`,
        404: `${error.status} - Client request could not be found\n${error.error.error}\n${error.error.detail.error.message}`,
        408: `${error.status} - Request timeout, please try again - ${error.error.error}\n${error.error.detail.error.message}`,
        422: `${error.status} - Unprocessable Entity, validation failed\n${error.error.error}\n${error.error.detail.error.message}`,
        429: `${error.status} - Too many requests\n${error.error.error}\n${error.error.detail.error.message}`,
        500: `${error.status} - Internal server error\n${error.error.error}\n${error.error.detail.error.message}`,
        502: `${error.status} - Bad gateway\n${error.error.error}\n${error.error.detail.error.message}`,
        503: `${error.status} - Service unavailable\n${error.error.error}\n${error.error.detail.error.message}`,
        504: `${error.status} - Gateway timeout\n${error.error.error}v${error.error.detail.error.message}`,
    };

    return messages[error.status] || 'Unexpected error occurred';
}