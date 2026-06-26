package com.trustledger.dto;

public record AuthResponseDto(
        String token,
        String role,
        String username,
        Boolean firstLogin,
        Boolean authenticated,
        String message,
        String error
) {
}
