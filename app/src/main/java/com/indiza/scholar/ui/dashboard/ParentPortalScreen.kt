package com.indiza.scholar.ui.dashboard

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.style.TextAlign
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.student.EleveUiModel
import kotlinx.coroutines.launch

@Composable
fun ParentPortalScreen(
    apiService: ApiService,
    userId: Long,
    schoolId: Long,
    schoolName: String,
    yearId: Long
) {
    var children by remember { mutableStateOf<List<EleveUiModel>>(emptyList()) }
    var selectedChild by remember { mutableStateOf<EleveUiModel?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(yearId) {
        isLoading = true
        val res = apiService.getAllStudents(yearId)
        if (res.isSuccessful) {
            children = res.body() ?: emptyList()
            if (children.isNotEmpty()) selectedChild = children[0]
        }
        isLoading = false
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    } else if (children.isEmpty()) {
        EmptyPortalState(
            title = "No children linked",
            subtitle = "Please contact the administration to link your children to your account."
        )
    } else {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text(
                text = "Family Space",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Black
            )
            Text(
                text = "Academic year: $schoolName",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Children Selector
            if (children.size > 1) {
                ScrollableTabRow(
                    selectedTabIndex = children.indexOf(selectedChild),
                    edgePadding = 0.dp,
                    containerColor = Color.Transparent,
                    divider = {}
                ) {
                    children.forEach { child ->
                        Tab(
                            selected = selectedChild == child,
                            onClick = { selectedChild = child },
                            text = { Text(child.nomComplet.split(" ").getOrNull(0) ?: "Child", fontWeight = FontWeight.Bold) }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            selectedChild?.let { child ->
                ChildSummaryCard(child)
                Spacer(modifier = Modifier.height(24.dp))
                
                Text("Quick Actions", fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 12.dp))
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    PortalActionItem("Grades", Icons.Default.Star, Color(0xFF3498DB), Modifier.weight(1f)) { }
                    PortalActionItem("Finance", Icons.Default.Payments, Color(0xFF27AE60), Modifier.weight(1f)) { }
                    PortalActionItem("Absences", Icons.Default.CalendarToday, Color(0xFFE67E22), Modifier.weight(1f)) { }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Text("Latest Updates", fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 12.dp))
                
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, null, tint = Color(0xFF3498DB))
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Parent Meeting", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Next Saturday at 10:00 AM in the main hall.", fontSize = 12.sp, color = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ChildSummaryCard(child: EleveUiModel) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.1f),
                    modifier = Modifier.size(64.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.School, null, modifier = Modifier.size(32.dp))
                    }
                }
                Spacer(Modifier.width(16.dp))
                Column {
                    Text(child.nomComplet, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("Class: ${child.classeLabel ?: "N/A"}", style = MaterialTheme.typography.bodyMedium)
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                SummaryStat("Avg", "14.5/20")
                SummaryStat("Abs", "02")
                SummaryStat("Status", if (child.isSolded) "Paid" else "Pending", if (child.isSolded) Color(0xFF27AE60) else Color(0xFFE67E22))
            }
        }
    }
}

@Composable
fun SummaryStat(label: String, value: String, valueColor: Color = Color.Black) {
    Column {
        Text(label, fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
        Text(value, fontSize = 16.sp, fontWeight = FontWeight.Black, color = valueColor)
    }
}

@Composable
fun PortalActionItem(label: String, icon: ImageVector, color: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                shape = CircleShape,
                color = color.copy(alpha = 0.1f),
                modifier = Modifier.size(40.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
                }
            }
            Spacer(Modifier.height(8.dp))
            Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun EmptyPortalState(title: String, subtitle: String) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Default.Group, null, modifier = Modifier.size(64.dp), tint = Color.LightGray)
        Spacer(Modifier.height(24.dp))
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(subtitle, textAlign = TextAlign.Center, color = Color.Gray, modifier = Modifier.padding(top = 8.dp))
    }
}
