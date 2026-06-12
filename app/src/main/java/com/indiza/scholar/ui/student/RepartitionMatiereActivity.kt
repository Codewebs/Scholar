package com.indiza.scholar.ui.student

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.matieres.MatiereViewModel
import com.indiza.scholar.ui.matieres.RepartitionMatiereScreen
import com.indiza.scholar.ui.theme.ScholarTheme

class RepartitionMatiereActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val idAnnee = intent.getLongExtra("idAnneeScolaire", 0L)
        val schoolId = getSharedPreferences("app_config", Context.MODE_PRIVATE).getLong("school_id", 0L)
        val userRole = getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("role", "ENSEIGNANT") ?: "ENSEIGNANT"

        val api = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)

        val matiereViewModel = ViewModelProvider(this, object : ViewModelProvider.Factory {
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
                RepartitionMatiereScreen(idAnnee, schoolId, userRole, matiereViewModel, classeViewModel) { finish() }
            }
        }
    }
}
