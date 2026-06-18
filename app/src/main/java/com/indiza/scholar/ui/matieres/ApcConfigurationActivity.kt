package com.indiza.scholar.ui.matieres

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.data.AppDatabase
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.student.ClasseManagementViewModel
import com.indiza.scholar.ui.theme.ScholarTheme

class ApcConfigurationActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val idAnnee = intent.getLongExtra("idAnneeScolaire", 0L)

        val api = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)

        val viewModel = ViewModelProvider(this, object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return MatiereViewModel(api) as T
            }
        })[MatiereViewModel::class.java]

        val classeViewModel = ViewModelProvider(this, object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return ClasseManagementViewModel(api) as T
            }
        })[ClasseManagementViewModel::class.java]

        setContent {
            ScholarTheme {
                ApcConfigurationScreen(idAnnee, viewModel, classeViewModel) { finish() }
            }
        }
    }
}
