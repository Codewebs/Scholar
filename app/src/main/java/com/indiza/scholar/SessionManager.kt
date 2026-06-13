package com.indiza.scholar

import com.indiza.scholar.model.AcademicPermission
import com.indiza.scholar.model.AcademicRole
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

object SessionManager {
    private val _schoolId = MutableStateFlow(0L)
    val schoolId: StateFlow<Long> = _schoolId

    private val _yearId = MutableStateFlow(0L)
    val yearId: StateFlow<Long> = _yearId

    private val _isUserActive = MutableStateFlow(false)
    val isUserActive: StateFlow<Boolean> = _isUserActive

    private val _permissions = MutableStateFlow<Set<AcademicPermission>>(emptySet())
    val permissions: StateFlow<Set<AcademicPermission>> = _permissions

    fun setContext(schoolId: Long, yearId: Long, active: Boolean = true, role: String? = null) {
        _schoolId.value = schoolId
        _yearId.value = yearId
        _isUserActive.value = active
        
        // Initialiser les permissions de base à partir du rôle si fourni
        if (role != null) {
            val academicRole = AcademicRole.fromName(role)
            _permissions.value = academicRole.permissions
        }
    }

    fun updatePermissions(added: List<String>?, removed: List<String>?) {
        val current = _permissions.value.toMutableSet()
        
        added?.forEach { pName ->
            AcademicPermission.entries.find { it.name == pName }?.let { current.add(it) }
        }
        
        removed?.forEach { pName ->
            AcademicPermission.entries.find { it.name == pName }?.let { current.remove(it) }
        }
        
        _permissions.value = current
    }

    fun hasPermission(permission: AcademicPermission): Boolean {
        return _permissions.value.contains(permission)
    }

    fun clear() {
        _schoolId.value = 0L
        _yearId.value = 0L
        _isUserActive.value = false
        _permissions.value = emptySet()
    }
}
