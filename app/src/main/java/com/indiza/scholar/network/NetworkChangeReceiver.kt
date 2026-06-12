package com.indiza.scholar.network

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.annotation.RequiresPermission
import com.indiza.scholar.data.AppDatabase
import com.indiza.scholar.repositories.AnneeScolaireRepository

class NetworkChangeReceiver : BroadcastReceiver() {
    @RequiresPermission(Manifest.permission.ACCESS_NETWORK_STATE)
    override fun onReceive(context: Context?, intent: Intent?) {
        context ?: return
        val db = AppDatabase.getInstance(context)
        val repo = AnneeScolaireRepository(
            dao = db.anneeScolaireDao(),
            api = ApiClient.create {
                // Logique pour récupérer le token (par exemple depuis SharedPreferences)
                context.getSharedPreferences("auth", Context.MODE_PRIVATE)
                    .getString("token", null)
            }.create(AnneeScolaireApi::class.java)
        )
        SyncManager.startSync(context, repo)
    }
}
