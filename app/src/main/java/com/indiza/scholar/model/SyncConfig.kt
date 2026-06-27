package com.indiza.scholar.model

import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableIntStateOf

object SyncConfig {
    // 🔹 State observable pour Compose
    var isRemoteSyncEnabled by mutableStateOf(false)

    // 🔹 Paramètres d'impression
    var doubleReceipts by mutableStateOf(false)
    var nbTelephones by mutableIntStateOf(2)

    // 🔹 Paramètres pédagogiques
    var useCompetences by mutableStateOf(false)

    // 🔹 Paramètres de langue
    var appLanguage by mutableStateOf("FR")
    var forceDocLanguage by mutableStateOf(false)
}
