package com.indiza.scholar.ui.discipline

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.theme.ScholarTheme

class DisciplineActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val idAnneeScolaire = intent.getLongExtra("idAnneeScolaire", 0L)

        val retrofit = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE)
                .getString("token", null)
        }
        val api = retrofit.create(ApiService::class.java)

        val viewModel = ViewModelProvider(this, object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return DisciplineViewModel(api) as T
            }
        })[DisciplineViewModel::class.java]

        setContent {
            ScholarTheme {
                DisciplineScreen(
                    idAnneeScolaire = idAnneeScolaire,
                    viewModel = viewModel,
                    onBack = { finish() }
                )
            }
        }
    }
}
