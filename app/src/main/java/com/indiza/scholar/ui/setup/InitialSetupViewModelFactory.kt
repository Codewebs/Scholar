package com.indiza.scholar.ui.setup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.dao.AnneeScolaireDao
import com.indiza.scholar.dao.EtablissementDao
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.repositories.PersonnelRepository

class InitialSetupViewModelFactory(
    private val api: ApiService,
    private val schoolDao: EtablissementDao,
    private val yearDao: AnneeScolaireDao,
    private val personnelRepository: PersonnelRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(InitialSetupViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return InitialSetupViewModel(api, schoolDao, yearDao, personnelRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
