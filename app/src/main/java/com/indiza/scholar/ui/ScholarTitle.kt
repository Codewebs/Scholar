package com.indiza.scholar.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

import com.indiza.scholar.ui.theme.Carattere

@Composable
fun ScholarTitle(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFF1A53E3)
) {
    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {

        Text(
            text = "Scholar",
            style = TextStyle(
                fontFamily = Carattere,
                fontSize = 72.sp,
                fontWeight = FontWeight.Normal,
                color = color
            )
        )
    }
}