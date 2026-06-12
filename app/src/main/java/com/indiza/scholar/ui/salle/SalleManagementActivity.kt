package com.indiza.scholar.ui.salle

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService

class SalleManagementActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val idAnnee = intent.getLongExtra("idAnneeScolaire", 0L)

        val api = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)

        val viewModel = ViewModelProvider(this, object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return SalleManagementViewModel(api) as T
            }
        })[SalleManagementViewModel::class.java]

        setContent {
            SalleManagementScreen(
                idAnneeScolaire = idAnnee,
                viewModel = viewModel,
                onBack = { finish() }
            )
        }
    }
}
