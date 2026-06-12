package com.indiza.scholar.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.indiza.scholar.model.ClasseEntity
import com.indiza.scholar.model.CycleEntity
import com.indiza.scholar.model.EnseignementEntity

@Dao
interface StructureDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEnseignement(enseignement: EnseignementEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCycle(cycle: CycleEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClasses(classes: List<ClasseEntity>)

    @Query("SELECT * FROM enseignement WHERE idAnneeScolaire = :anneeId")
    suspend fun getEnseignementsByAnnee(anneeId: Long): List<EnseignementEntity>

    @Query("SELECT * FROM enseignement WHERE idAnneeScolaire = :idAnneeScolaire LIMIT 1")
    suspend fun getEnseignementByAnnee(idAnneeScolaire: Long): EnseignementEntity?

    @Query("SELECT * FROM cyclee WHERE idEnseignementLocal = :idEnseignement")
    suspend fun getCyclesByEnseignement(idEnseignement: Long): List<CycleEntity>

    @Query("SELECT * FROM classe WHERE idCycleLocal = :idCycle")
    suspend fun getClassesByCycle(idCycle: Long): List<ClasseEntity>

    @Query("DELETE FROM enseignement WHERE idAnneeScolaire = :idAnneeScolaire")
    suspend fun deleteEnseignementsPourAnnee(idAnneeScolaire: Long)

    @Query("DELETE FROM cyclee WHERE idAnneeScolaire = :idAnneeScolaire")
    suspend fun deleteCyclesPourAnnee(idAnneeScolaire: Long)

    @Query("DELETE FROM classe WHERE idAnneeScolaire = :idAnneeScolaire")
    suspend fun deleteClassesPourAnnee(idAnneeScolaire: Long)

    suspend fun clearFullStructurePourAnnee(idAnneeScolaire: Long) {
        deleteClassesPourAnnee(idAnneeScolaire)
        deleteCyclesPourAnnee(idAnneeScolaire)
        deleteEnseignementsPourAnnee(idAnneeScolaire)
    }
}
