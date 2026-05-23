package com.mylife.core.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApiResponse<T> {

    private T data;
    private String message;
    private String status;

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(data, message, "SUCCESS");
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(null, message, "ERROR");
    }

    public static <T> ApiResponse<T> validationError(String message) {
        return new ApiResponse<>(null, message, "VALIDATION_ERROR");
    }
}
