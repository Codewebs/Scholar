package com.indiza.scholar.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import com.indiza.scholar.ui.theme.ThemeManager

private val DarkColorScheme = darkColorScheme(
    primary = Color.White,
    onPrimary = Color.Black,
    secondary = Color(0xFF9E9E9E),
    onSecondary = Color.White,
    tertiary = ScholarRed,
    background = Color(0xFF000000),
    surface = Color(0xFF121212),
    onBackground = Color.White,
    onSurface = Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF000000), // Action color is Black in the new design
    onPrimary = Color.White,
    secondary = Color(0xFF9E9E9E),
    onSecondary = Color.White,
    tertiary = ScholarRed,
    background = Color(0xFFFFFFFF),
    surface = Color.White,
    onBackground = Color(0xFF000000),
    onSurface = Color(0xFF000000)
)

@Composable
fun ScholarTheme(
    darkTheme: Boolean = ThemeManager.shouldCustomBeDark(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = false, // Set to false to maintain app consistency if preferred
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}