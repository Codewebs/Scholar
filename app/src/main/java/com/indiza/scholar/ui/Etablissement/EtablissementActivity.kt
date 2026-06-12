package com.indiza.scholar.ui.Etablissement

import android.content.Context
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.data.AppDatabase
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.EtablissementApi
import com.indiza.scholar.repositories.EtablissementRepository

class EtablissementActivity : AppCompatActivity() {

    private lateinit var viewModel: EtablissementViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val dao = AppDatabase.getInstance(this).etablissementDao()
        val api = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(EtablissementApi::class.java)

        val repository = EtablissementRepository(dao, api)
        val factory = EtablissementViewModelFactory(repository)

        viewModel = ViewModelProvider(this, factory)[EtablissementViewModel::class.java]

        setContentView(ComposeView(this).apply {
            setContent {
                EtablissementScreen(
                    viewModel = viewModel,
                    onBackClick = { finish() }
                )
            }
        })
    }
}