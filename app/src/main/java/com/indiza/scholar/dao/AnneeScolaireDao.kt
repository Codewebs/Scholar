package com.indiza.scholar.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.indiza.scholar.model.AnneeScolaireEntity

@Dao
interface AnneeScolaireDao {

    @Query("SELECT * FROM annee_scolaire ORDER BY dateDebut DESC")
    suspend fun getAll(): List<AnneeScolaireEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(annee: AnneeScolaireEntity)

    @Update
    suspend fun update(annee: AnneeScolaireEntity)

    @Delete
    suspend fun delete(annee: AnneeScolaireEntity)

    @Query("DELETE FROM annee_scolaire")
    suspend fun clearAll()
}