import { AppDispatch } from "../store";
import { addToast } from "../store/slices/uiSlice";

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
  error_code?: string;
  detail?: string;
  errors?: Array<{ field?: string; message: string }>;
}

const getErrorMessage = (error: any): string => {
  const data = error.response?.data as ApiErrorResponse | undefined;
  
  if (!data) {
    return error.message || 'An error occurred';
  }

  if (data.error) {
    return data.error;
  }

  if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((e) => e.message).join('. ');
  }

  if (data.message) {
    return data.message;
  }

  if (data.detail) {
    return data.detail;
  }

  return 'An error occurred';
};

const getErrorTitle = (status: number, errorCode?: string): string => {
  if (errorCode) {
    return errorCode.replace(/_/g, ' ');
  }
  
  switch (status) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Validation Error';
    case 500:
      return 'Server Error';
    default:
      return 'Error';
  }
};

export const handleApiError = (error: any, dispatch?: any, defaultMessage?: string): string => {
  const status = error.response?.status;
  const data = error.response?.data as ApiErrorResponse | undefined;
  const errorCode = data?.error_code;
  const message = getErrorMessage(error) || defaultMessage || 'An error occurred';
  const title = getErrorTitle(status, errorCode);

  if (dispatch) {
    dispatch(addToast({ 
      type: 'error', 
      title, 
      message 
    }));
  }
  
  return message;
};

export const handleApiSuccess = (dispatch: any, title: string, message: string) => {
  dispatch(addToast({ 
    type: 'success', 
    title, 
    message 
  }));
};

export const handleApiWarning = (dispatch: any, title: string, message: string) => {
  dispatch(addToast({ 
    type: 'warning', 
    title, 
    message 
  }));
};

export const handleApiInfo = (dispatch: any, title: string, message: string) => {
  dispatch(addToast({ 
    type: 'info', 
    title, 
    message 
  }));
};
