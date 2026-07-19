package com.indiza.scholar.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.AbsenceUiModel

@Composable
fun AbsenceItemRow(absence: AbsenceUiModel, onChanged: (Int, Int) -> Unit) {
    val statusColor = when {
        absence.heuresANJ >= 45 -> Color.Red
        absence.heuresANJ >= 30 -> Color(0xFFE67E22)
        else -> Color.Transparent
    }
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = if (statusColor != Color.Transparent) statusColor.copy(alpha = 0.2f) else Color(0xFF34495E))
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(absence.nomComplet, color = Color.White, fontWeight = FontWeight.Medium)
                Text(absence.matricule ?: "N/A", color = Color.Gray, fontSize = 10.sp)
            }
            CounterButton(label = "AJ", value = absence.heuresAJ, onValueChange = { onChanged(it, absence.heuresANJ) })
            Spacer(Modifier.width(16.dp))
            CounterButton(label = "ANJ", value = absence.heuresANJ, onValueChange = { onChanged(absence.heuresAJ, it) }, color = Color.Red)
        }
    }
}

@Composable
fun CounterButton(label: String, value: Int, onValueChange: (Int) -> Unit, color: Color = Color(0xFF1ABC9C)) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, color = Color.Gray, fontSize = 9.sp)
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(4.dp))) {
            IconButton(onClick = { if (value > 0) onValueChange(value - 1) }, modifier = Modifier.size(24.dp)) {
                Icon(Icons.Default.Remove, null, tint = Color.White, modifier = Modifier.size(16.dp))
            }
            Text(value.toString(), color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.width(24.dp), textAlign = TextAlign.Center)
            IconButton(onClick = { onValueChange(value + 1) }, modifier = Modifier.size(24.dp)) {
                Icon(Icons.Default.Add, null, tint = color, modifier = Modifier.size(16.dp))
            }
        }
    }
}
