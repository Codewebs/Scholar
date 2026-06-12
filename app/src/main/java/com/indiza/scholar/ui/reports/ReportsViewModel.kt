package com.indiza.scholar.ui.reports

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.network.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ReportsViewModel(private val apiService: ApiService) : ViewModel() {
    // UI state for reports can be added here
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun generateReport(reportType: String, params: Map<String, Any>) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // Fetch data for the report from API or DAO
                // For now, it will be handled in the UI or a separate generator
            } finally {
                _isLoading.value = false
            }
        }
    }
}
