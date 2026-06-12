package com.indiza.scholar.network

import com.indiza.scholar.model.AnneeScolaireDto
import com.indiza.scholar.model.AnneeScolaireResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface AnneeScolaireApi {
    @POST("/annee")
    suspend fun createAnnee(@Body annee: AnneeScolaireDto): AnneeScolaireResponse

    @GET("/annee")
    suspend fun getAllAnnees(): List<AnneeScolaireDto>

    @POST("/annee")
    suspend fun saveAnneeScolaire(@Body dto: AnneeScolaireDto): AnneeScolaireResponse

    @PUT("/annee/{id}")
    suspend fun updateAnnee(@Path("id") id: Long, @Body annee: AnneeScolaireDto): AnneeScolaireResponse

    @DELETE("/annee/{id}")
    suspend fun deleteAnnee(@Path("id") id: Long): Response<Unit>
}

