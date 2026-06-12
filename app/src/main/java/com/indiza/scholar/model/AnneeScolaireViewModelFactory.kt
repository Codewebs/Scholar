package com.indiza.scholar.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.repositories.AnneeScolaireRepository
import com.indiza.scholar.ui.home.AnneeScolaireViewModel

class AnneeScolaireViewModelFactory(
    private val repository: AnneeScolaireRepository,
    private val api: com.indiza.scholar.network.ApiService
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AnneeScolaireViewModel::class.java)) {
            return AnneeScolaireViewModel(repository, api) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
