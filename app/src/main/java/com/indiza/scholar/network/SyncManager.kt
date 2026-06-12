package com.indiza.scholar.network


import android.Manifest
import android.content.Context
import androidx.annotation.RequiresPermission
import com.indiza.scholar.model.SyncConfig
import com.indiza.scholar.repositories.AnneeScolaireRepository


import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

object SyncManager {

    @RequiresPermission(Manifest.permission.ACCESS_NETWORK_STATE)
    fun startSync(context: Context, repo: AnneeScolaireRepository) {
        if (!SyncConfig.isRemoteSyncEnabled) return

        if (!NetworkUtils.isOnline(context)) {
            println("📴 Aucun réseau disponible, sync reportée.")
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                println("🔄 Début de la synchronisation...")
                repo.syncWithServer()
                println("✅ Synchronisation terminée avec succès.")
            } catch (e: Exception) {
                println("❌ Erreur de synchronisation : ${e.message}")
            }
        }
    }
}
