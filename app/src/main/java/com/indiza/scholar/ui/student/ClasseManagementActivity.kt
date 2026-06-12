package com.indiza.scholar.ui.student

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService

class ClasseManagementActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val idAnnee = intent.getLongExtra("idAnneeScolaire", 0L)
        val userRole = intent.getStringExtra("userRole") ?: "ENSEIGNANT"

        val api = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)

        val viewModel = ViewModelProvider(this, object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return ClasseManagementViewModel(api) as T
            }
        })[ClasseManagementViewModel::class.java]

        setContent {
            ClasseManagementScreen(
                idAnneeScolaire = idAnnee,
                userRole = userRole,
                viewModel = viewModel,
                onBack = { finish() }
            )
        }
    }
}
