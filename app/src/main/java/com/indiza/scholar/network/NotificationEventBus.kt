package com.indiza.scholar.network

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

object NotificationEventBus {
    private val _events = MutableSharedFlow<NotificationEvent>()
    val events = _events.asSharedFlow()

    suspend fun emit(event: NotificationEvent) {
        _events.emit(event)
    }
}

sealed class NotificationEvent {
    data class DemandeValidee(val schoolId: Long, val role: String) : NotificationEvent()
    object SessionExpired : NotificationEvent()
    object SessionRevalidated : NotificationEvent()
}
