package com.indiza.scholar.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.student.EleveUiModel
import kotlinx.coroutines.launch

@Composable
fun StudentPortalScreen(
    apiService: ApiService,
    userName: String,
    schoolName: String,
    yearId: Long
) {
    var student by remember { mutableStateOf<EleveUiModel?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(yearId) {
        isLoading = true
        val res = apiService.getAllStudents(yearId)
        if (res.isSuccessful) {
            val list = res.body() ?: emptyList()
            if (list.isNotEmpty()) student = list[0]
        }
        isLoading = false
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    } else if (student == null) {
        EmptyPortalState(
            title = "Profile not found",
            subtitle = "Your account is not linked to any student record. Please contact administration."
        )
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item {
                Text(
                    text = "Welcome back, ${userName.split(" ")[0]}! 🎓",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = "$schoolName • ${student?.classeLabel ?: "N/A"}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray
                )
            }

            item {
                StudentKPIs(student!!)
            }

            item {
                Text("My Courses", fontWeight = FontWeight.Bold)
            }
            
            // Mock courses for now
            items(listOf("Mathematics", "Physics", "Literature")) { course ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(course, fontWeight = FontWeight.Bold)
                        Text("15.5/20", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Black)
                    }
                }
            }
            
            item {
                Button(
                    onClick = { /* Download Bulletin */ },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(Icons.Default.Download, null)
                    Spacer(Modifier.width(8.dp))
                    Text("Download Report Card")
                }
            }
        }
    }
}

@Composable
fun StudentKPIs(student: EleveUiModel) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        KPIItem("Rank", "01/35", Modifier.weight(1f))
        KPIItem("Avg", "16.8", Modifier.weight(1f))
        KPIItem("Fees", if (student.isSolded) "OK" else "Pending", Modifier.weight(1f))
    }
}

@Composable
fun KPIItem(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Black)
        }
    }
}
