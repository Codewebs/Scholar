package com.indiza.scholar.ui.Etablissement

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.repositories.EtablissementRepository

class EtablissementViewModelFactory(private val repository: EtablissementRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(EtablissementViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return EtablissementViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
