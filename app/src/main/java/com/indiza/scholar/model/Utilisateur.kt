package com.indiza.scholar.model

import com.squareup.moshi.Json

data class Utilisateur(
    @Json(name = "identifiant") val identifiant: String,
    @Json(name = "nom") val nom: String,
    @Json(name = "email") val email: String,
    @Json(name = "telephone") val telephone: Long? = null,
    @Json(name = "photo") val photo: String? = null,
    @Json(name = "password") val password: String? = null,
    @Json(name = "confirmPassword") val confirmPassword: String? = null
)
