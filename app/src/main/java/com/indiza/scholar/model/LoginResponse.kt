package com.indiza.scholar.model

data class LoginResponse(
    val success: Boolean,
    val status: String? = null,
    val message: String? = null,
    val token: String? = null,
    val userId: Long? = null,
    val name: String? = null,
    val email: String? = null,
    val telephone: Long? = null,
    val role: String? = null
)
