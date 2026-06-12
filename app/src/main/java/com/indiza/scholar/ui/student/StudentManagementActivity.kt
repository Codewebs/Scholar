package com.indiza.scholar.ui.student

import android.content.Context
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService

class StudentManagementActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val idAnnee = intent.getLongExtra("idAnneeScolaire", 0L)
        val idSalle = intent.getLongExtra("idSalle", 0L)

        val prefs = getSharedPreferences("user_session", Context.MODE_PRIVATE)
        val roleStr = prefs.getString("role", "ENSEIGNANT") ?: "ENSEIGNANT"
        val userRole = try {
            AcademicRole.valueOf(roleStr.uppercase())
        } catch (e: Exception) {
            AcademicRole.ENSEIGNANT
        }

        val api = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)

        val factory = StudentManagementViewModelFactory(api, userRole)
        val viewModel = ViewModelProvider(this, factory)[StudentManagementViewModel::class.java]

        setContentView(ComposeView(this).apply {
            setContent {
                StudentManagementScreen(
                    idAnneeScolaireActive = idAnnee,
                    idSalleSelectionnee = idSalle,
                    viewModel = viewModel
                )
            }
        })
    }
}
