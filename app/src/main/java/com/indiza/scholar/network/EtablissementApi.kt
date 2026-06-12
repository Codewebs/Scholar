package com.indiza.scholar.network

import com.indiza.scholar.model.EtablissementEntity
import okhttp3.MultipartBody
import retrofit2.http.*

interface EtablissementApi {
    @GET("/etablissement")
    suspend fun getEtablissement(): List<EtablissementDto>

    @POST("/etablissement")
    suspend fun saveEtablissement(@Body dto: EtablissementDto): EtablissementDto

    @PUT("/etablissement/{id}")
    suspend fun updateEtablissement(@Path("id") id: Long, @Body dto: EtablissementDto): EtablissementDto

    @GET("/etablissement/{id}")
    suspend fun getSchoolById(@Path("id") id: Long): EtablissementDto

    @GET("/etablissement/user/{userId}")
    suspend fun getUserSchools(@Path("userId") userId: Long): retrofit2.Response<List<EtablissementEntity>>

    @Multipart
    @POST("/etablissement/upload-logo")
    suspend fun uploadLogo(@Part logo: MultipartBody.Part): LogoResponse
}

data class LogoResponse(val filename: String)