package com.indiza.scholar.repositories

import com.indiza.scholar.dao.AnneeScolaireDao
import com.indiza.scholar.model.AnneeScolaireEntity
import com.indiza.scholar.model.toEntity
import com.indiza.scholar.network.AnneeScolaireApi

class AnneeScolaireRepository (
    private val dao: AnneeScolaireDao,
    private val api: AnneeScolaireApi? = null
) {
    suspend fun getAllLocal(): List<AnneeScolaireEntity> = dao.getAll()

    suspend fun saveLocal(annees: List<AnneeScolaireEntity>) {
        dao.clearAll()
        annees.forEach { dao.insertOrUpdate(it) }
    }

    suspend fun addLocal(annee: AnneeScolaireEntity) {
        dao.insertOrUpdate(annee)
    }

    suspend fun updateLocal(annee: AnneeScolaireEntity) {
        dao.update(annee)
    }

    suspend fun deleteLocal(annee: AnneeScolaireEntity) {
        dao.delete(annee)
    }

    suspend fun syncWithServer() {
        if (api == null) return
        val serverData = api.getAllAnnees()
        val entities = serverData.map { it.toEntity() }
        saveLocal(entities)
    }
}
