package com.indiza.scholar

import com.indiza.scholar.model.AcademicPermission
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.model.AppMenu
import com.indiza.scholar.model.AppModule
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

    private val _userRole = MutableStateFlow(AcademicRole.SANS_ROLE)
    val userRole: StateFlow<AcademicRole> = _userRole

    fun setContext(schoolId: Long, yearId: Long, active: Boolean = true, role: String? = null) {
        _schoolId.value = schoolId
        _yearId.value = yearId
        _isUserActive.value = active
        
        // Initialiser les permissions de base à partir du rôle si fourni
        role?.let {
            val academicRole = AcademicRole.fromName(it)
            _userRole.value = academicRole
            _permissions.value = academicRole.permissions
        }
    }

    fun updatePermissions(added: List<String>?, removed: List<String>?) {
        // L'ADMINISTRATEUR garde toujours toutes les permissions
        if (_userRole.value == AcademicRole.ADMINISTRATEUR) {
            _permissions.value = AcademicPermission.entries.toSet()
            return
        }

        val current = _permissions.value.toMutableSet()
        
        added?.forEach { pName ->
            AcademicPermission.entries.find { it.name == pName }?.let { current.add(it) }
        }
        
        removed?.forEach { pName ->
            AcademicPermission.entries.find { it.name == pName }?.let { current.remove(it) }
        }
        
        _permissions.value = current
    }

    /**
     * Vérifie si l'utilisateur a une permission spécifique
     */
    fun hasPermission(permission: AcademicPermission): Boolean {
        if (_userRole.value == AcademicRole.ADMINISTRATEUR) return true
        return _permissions.value.contains(permission)
    }

    /**
     * Vérifie si un module est accessible (si au moins une de ses permissions est accordée)
     */
    fun isModuleAccessible(module: AppModule): Boolean {
        if (_userRole.value == AcademicRole.ADMINISTRATEUR) return true
        return module.permissions.any { hasPermission(it) }
    }

    /**
     * Vérifie si un menu est accessible (si au moins un de ses modules est accessible)
     */
    fun isMenuAccessible(menu: AppMenu): Boolean {
        if (_userRole.value == AcademicRole.ADMINISTRATEUR) return true
        if (menu.modules.isEmpty()) return false // Sécurité : un menu sans modules est invisible par défaut
        return menu.modules.any { isModuleAccessible(it) }
    }

    fun clear() {
        _schoolId.value = 0L
        _yearId.value = 0L
        _isUserActive.value = false
        _permissions.value = emptySet()
    }
}
