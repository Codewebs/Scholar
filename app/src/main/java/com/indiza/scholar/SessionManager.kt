package com.indiza.scholar

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

object SessionManager {
    private val _schoolId = MutableStateFlow(0L)
    val schoolId: StateFlow<Long> = _schoolId

    private val _yearId = MutableStateFlow(0L)
    val yearId: StateFlow<Long> = _yearId

    private val _isUserActive = MutableStateFlow(false)
    val isUserActive: StateFlow<Boolean> = _isUserActive

    fun setContext(schoolId: Long, yearId: Long, active: Boolean = true) {
        _schoolId.value = schoolId
        _yearId.value = yearId
        _isUserActive.value = active
    }

    fun clear() {
        _schoolId.value = 0L
        _yearId.value = 0L
        _isUserActive.value = false
    }
}
