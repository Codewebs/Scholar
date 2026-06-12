package com.indiza.scholar.model

import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

object SyncConfig {
    // 🔹 State observable pour Compose
    var isRemoteSyncEnabled by mutableStateOf(false)
}