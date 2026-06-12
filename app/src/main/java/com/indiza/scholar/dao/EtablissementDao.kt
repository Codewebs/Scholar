package com.indiza.scholar.dao

import androidx.room.*
import com.indiza.scholar.model.EtablissementEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface EtablissementDao {
    @Query("SELECT * FROM etablissement LIMIT 1")
    fun getEtablissement(): Flow<EtablissementEntity?>

    @Query("SELECT * FROM etablissement LIMIT 1")
    suspend fun getEtablissementSync(): EtablissementEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(etablissement: EtablissementEntity)
}