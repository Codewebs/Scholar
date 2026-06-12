package com.indiza.scholar.dao

import androidx.room.*
import com.indiza.scholar.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface PedagogyDao {
    // Matieres
    @Query("SELECT * FROM matiere WHERE supprimer = 0")
    fun getAllMatieres(): Flow<List<MatiereEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMatiere(matiere: MatiereEntity)

    // Groupes
    @Query("SELECT * FROM groupe_matiere ORDER BY ordre ASC")
    fun getAllGroupes(): Flow<List<GroupeMatiereEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGroupe(groupe: GroupeMatiereEntity)

    // Periodes
    @Query("SELECT * FROM periode ORDER BY ordrePeriode ASC")
    fun getAllPeriodes(): Flow<List<PeriodeEntity>>

    @Update
    suspend fun updatePeriode(periode: PeriodeEntity)

    // Sous-Periodes
    @Query("SELECT * FROM sous_periode WHERE idPeriodeLocal = :idPeriode ORDER BY ordreSousPeriode ASC")
    fun getSousPeriodes(idPeriode: Long): Flow<List<SousPeriodeEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSousPeriode(sp: SousPeriodeEntity)
}
