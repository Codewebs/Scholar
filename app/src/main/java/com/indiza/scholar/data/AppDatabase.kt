package com.indiza.scholar.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.indiza.scholar.dao.*
import com.indiza.scholar.model.*

@Database(
    entities = [
        AnneeScolaireEntity::class,
        EnseignementEntity::class,
        ClasseEntity::class,
        CycleEntity::class,
        EtablissementEntity::class,
        MatiereEntity::class,
        GroupeMatiereEntity::class,
        PeriodeEntity::class,
        SousPeriodeEntity::class
    ],
    version = 9,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun anneeScolaireDao(): AnneeScolaireDao
    abstract fun etablissementDao(): EtablissementDao
    abstract fun structureDao(): StructureDao
    abstract fun pedagogyDao(): PedagogyDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "scholar_db"
                )
                    .fallbackToDestructiveMigration()
                    .build()

                INSTANCE = instance
                instance
            }
        }
    }
}
