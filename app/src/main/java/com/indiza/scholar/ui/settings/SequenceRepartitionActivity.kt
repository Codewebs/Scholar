package com.indiza.scholar.ui.settings

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.theme.ScholarTheme

class SequenceRepartitionActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        val idAnneeScolaire = intent.getLongExtra("idAnneeScolaire", 0L)
        
        setContent {
            ScholarTheme {
                val apiService = ApiClient.create {
                    getSharedPreferences("user_session", MODE_PRIVATE).getString("token", null)
                }.create(ApiService::class.java)

                val viewModel: SequenceRepartitionViewModel = viewModel(
                    factory = object : ViewModelProvider.Factory {
                        override fun <T : ViewModel> create(modelClass: Class<T>): T {
                            return SequenceRepartitionViewModel(apiService) as T
                        }
                    }
                )

                SequenceRepartitionScreen(
                    yearId = idAnneeScolaire,
                    viewModel = viewModel,
                    onBack = { finish() }
                )
            }
        }
    }
}
