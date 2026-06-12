package com.indiza.scholar.ui.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.network.ApiService

class StudentManagementViewModelFactory(
    private val api: ApiService,
    private val userRole: AcademicRole
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(StudentManagementViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return StudentManagementViewModel(api, userRole) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
