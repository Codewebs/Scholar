package com.indiza.scholar.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.indiza.scholar.model.SalleEntity
import kotlinx.coroutines.flow.Flow


@Dao
interface SalleDao {
    @Query("SELECT * FROM salle_classe WHERE idClasseLocal = :idClasse")
    fun getSallesByClasse(idClasse: Long): Flow<List<SalleEntity>>

    @Query("SELECT * FROM salle_classe")
    fun getAllSalles(): Flow<List<SalleEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSalles(salles: List<SalleEntity>)
}