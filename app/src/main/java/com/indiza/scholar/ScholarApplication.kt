package com.indiza.scholar

import android.app.Application
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.ui.theme.ThemeManager

class ScholarApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        ThemeManager.init(this)
        ApiClient.init(this)
    }
}