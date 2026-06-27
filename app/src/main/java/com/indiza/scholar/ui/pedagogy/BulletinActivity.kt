package com.indiza.scholar.ui.pedagogy

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.ui.theme.ScholarTheme

enum class BulletinPerimeter { SALLE, CLASSE, CYCLE }
enum class NotationSystem { NUMERIC, LETTER, COLOR, HYBRID }
enum class BulletinLanguage { FR, EN, ES }

data class BulletinConfigState(
    var language: BulletinLanguage = BulletinLanguage.FR,
    var allowIncompleteStudent: Boolean = false,
    var allowIncompleteRoom: Boolean = false,
    var selectedPerimeter: BulletinPerimeter = BulletinPerimeter.SALLE,
    var selectedId: Long? = null,
    var notationSystem: NotationSystem = NotationSystem.HYBRID,
    var showNumeric: Boolean = true,
    var showLetter: Boolean = true,
    var showColors: Boolean = true,
    var showCharts: Boolean = true,
    var chartType: String = "BAR", // "BAR" or "RADAR"
    var showChartExplanations: Boolean = false,
    var marginTop: Int = 10,
    var marginBottom: Int = 10,
    var showMinisterialHeader: Boolean = true
)

class BulletinActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ScholarTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF1E2A3A)
                ) {
                    var config by remember { mutableStateOf(BulletinConfigState()) }
                    BulletinConfigScreen(
                        config = config,
                        onConfigChange = { config = it },
                        onBack = { finish() }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BulletinConfigScreen(
    config: BulletinConfigState,
    onConfigChange: (BulletinConfigState) -> Unit,
    onBack: () -> Unit
) {
    var showPerimeterSheet by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Cockpit de Bulletins", color = Color.White, fontWeight = FontWeight.Black) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Retour", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF2C3E50)),
                actions = {
                    TextButton(onClick = { /* TODO: Print */ }) {
                        Text("GÉNÉRER", color = Color(0xFF1ABC9C), fontWeight = FontWeight.Black)
                    }
                }
            )
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        LazyColumn(
            modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Section 0: Langue
            item {
                ConfigSectionTitle("Langue du Bulletin", Icons.Default.Language)
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        BulletinLanguage.values().forEach { lang ->
                            OutlinedButton(
                                onClick = { onConfigChange(config.copy(language = lang)) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (config.language == lang) Color(0xFF1ABC9C).copy(alpha = 0.1f) else Color.Transparent,
                                    contentColor = if (config.language == lang) Color(0xFF1ABC9C) else Color.Gray
                                ),
                                border = BorderStroke(1.dp, if (config.language == lang) Color(0xFF1ABC9C) else Color.Gray.copy(alpha = 0.3f))
                            ) {
                                Text(lang.name, fontSize = 10.sp, fontWeight = FontWeight.Black)
                            }
                        }
                    }
                }
            }

            // Section A: Autorisations & Périmètre
            item {
                ConfigSectionTitle("Autorisations & Périmètre", Icons.Default.GpsFixed)
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        ConfigSwitchItem(
                            label = "Notes incomplètes (Élève)",
                            checked = config.allowIncompleteStudent,
                            onCheckedChange = { onConfigChange(config.copy(allowIncompleteStudent = it)) }
                        )
                        ConfigSwitchItem(
                            label = "Salle incomplète",
                            checked = config.allowIncompleteRoom,
                            onCheckedChange = { onConfigChange(config.copy(allowIncompleteRoom = it)) }
                        )
                        
                        HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                        
                        Text("Cible d'impression", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            BulletinPerimeter.values().forEach { p ->
                                OutlinedButton(
                                    onClick = { 
                                        onConfigChange(config.copy(selectedPerimeter = p))
                                        showPerimeterSheet = true
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        containerColor = if (config.selectedPerimeter == p) Color(0xFF1ABC9C).copy(alpha = 0.1f) else Color.Transparent,
                                        contentColor = if (config.selectedPerimeter == p) Color(0xFF1ABC9C) else Color.Gray
                                    ),
                                    border = BorderStroke(1.dp, if (config.selectedPerimeter == p) Color(0xFF1ABC9C) else Color.Gray.copy(alpha = 0.3f))
                                ) {
                                    Text(p.name, fontSize = 10.sp)
                                }
                            }
                        }
                    }
                }
            }

            // Section B: En-tête & Marges
            item {
                ConfigSectionTitle("En-tête & Mise en page", Icons.Default.VerticalAlignTop)
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        ConfigSwitchItem(
                            label = "Bloc Ministériel Bilingue",
                            checked = config.showMinisterialHeader,
                            onCheckedChange = { onConfigChange(config.copy(showMinisterialHeader = it)) }
                        )
                        
                        Text("Marges de sécurité (mm)", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            MargeInput("HAUT", config.marginTop) { onConfigChange(config.copy(marginTop = it)) }
                            MargeInput("BAS", config.marginBottom) { onConfigChange(config.copy(marginBottom = it)) }
                        }
                    }
                }
            }

            // Section C: Notation
            item {
                ConfigSectionTitle("Système de Notation", Icons.Default.EditNote)
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        NotationSelector(config.notationSystem) { onConfigChange(config.copy(notationSystem = it)) }
                        
                        if (config.notationSystem == NotationSystem.HYBRID) {
                            AnimatedVisibility(visible = true) {
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
                                    ConfigSwitchItem("Afficher les points (/20)", config.showNumeric) { onConfigChange(config.copy(showNumeric = it)) }
                                    ConfigSwitchItem("Afficher les cotes (A+...F-)", config.showLetter) { onConfigChange(config.copy(showLetter = it)) }
                                    ConfigSwitchItem("Afficher les couleurs APC", config.showColors) { onConfigChange(config.copy(showColors = it)) }
                                }
                            }
                        }
                    }
                }
            }

            // Section D: Graphiques
            item {
                ConfigSectionTitle("Analyses & Graphiques", Icons.Default.BarChart)
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        ConfigSwitchItem("Inclure les graphiques", config.showCharts) { onConfigChange(config.copy(showCharts = it)) }
                        
                        if (config.showCharts) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                ChartTypeButton("BARRES", config.chartType == "BAR") { onConfigChange(config.copy(chartType = "BAR")) }
                                ChartTypeButton("RADAR", config.chartType == "RADAR") { onConfigChange(config.copy(chartType = "RADAR")) }
                            }
                            
                            Box(modifier = Modifier.fillMaxWidth().background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(12.dp)).padding(12.dp)) {
                                Column {
                                    Text(
                                        text = if (config.chartType == "RADAR") 
                                            "Radar : Chaque branche représente un domaine de compétences. Idéal pour voir l'équilibre des acquis."
                                            else "Barres : Situe l'élève par rapport aux extrêmes et à la moyenne de la classe.",
                                        color = Color(0xFF3498DB),
                                        fontSize = 11.sp,
                                        lineHeight = 16.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(Modifier.height(8.dp))
                                    ConfigSwitchItem("Imprimer ces explications", config.showChartExplanations) { onConfigChange(config.copy(showChartExplanations = it)) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showPerimeterSheet) {
        ModalBottomSheet(onDismissRequest = { showPerimeterSheet = false }, containerColor = Color(0xFF2C3E50)) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth().padding(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Sélectionner ${config.selectedPerimeter}", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                
                // Demo list - in real app would be from ViewModel
                val items = when(config.selectedPerimeter) {
                    BulletinPerimeter.SALLE -> listOf("6ème A", "6ème B", "5ème A")
                    BulletinPerimeter.CLASSE -> listOf("6ème", "5ème", "4ème")
                    BulletinPerimeter.CYCLE -> listOf("Premier Cycle", "Second Cycle")
                }
                
                items.forEach { name ->
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { showPerimeterSheet = false },
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f))
                    ) {
                        Text(name, color = Color.White, modifier = Modifier.padding(16.dp), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun ConfigSectionTitle(title: String, icon: ImageVector) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 8.dp)) {
        Icon(icon, null, tint = Color(0xFF1ABC9C), modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(8.dp))
        Text(title.uppercase(), color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
    }
}

@Composable
fun ConfigSwitchItem(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().clickable { onCheckedChange(!checked) }, horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color(0xFF1ABC9C),
                checkedTrackColor = Color(0xFF1ABC9C).copy(alpha = 0.5f),
                uncheckedThumbColor = Color.Gray,
                uncheckedTrackColor = Color.Gray.copy(alpha = 0.2f)
            )
        )
    }
}

@Composable
fun MargeInput(label: String, value: Int, onValueChange: (Int) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(8.dp)).padding(horizontal = 12.dp, vertical = 8.dp)) {
        Text(label, color = Color.Gray, fontSize = 9.sp, fontWeight = FontWeight.Black)
        Spacer(Modifier.width(12.dp))
        Text(value.toString(), color = Color.White, fontWeight = FontWeight.Black)
        Spacer(Modifier.width(12.dp))
        Column {
            Icon(Icons.Default.KeyboardArrowUp, null, tint = Color.White, modifier = Modifier.size(16.dp).clickable { onValueChange(value + 1) })
            Icon(Icons.Default.KeyboardArrowDown, null, tint = Color.White, modifier = Modifier.size(16.dp).clickable { if (value > 0) onValueChange(value - 1) })
        }
    }
}

@Composable
fun NotationSelector(selected: NotationSystem, onSelect: (NotationSystem) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box(modifier = Modifier.fillMaxWidth()) {
        OutlinedButton(
            onClick = { expanded = true },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(when(selected) {
                    NotationSystem.NUMERIC -> "Numérique (Points)"
                    NotationSystem.LETTER -> "Cotes (A+...)"
                    NotationSystem.COLOR -> "Colorimétrique"
                    NotationSystem.HYBRID -> "Hybride (Mixte)"
                }, fontSize = 13.sp)
                Icon(Icons.Default.ArrowDropDown, null)
            }
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }, modifier = Modifier.background(Color(0xFF2C3E50)).fillMaxWidth(0.8f)) {
            NotationSystem.values().forEach { sys ->
                DropdownMenuItem(
                    text = { Text(sys.name, color = Color.White) },
                    onClick = { onSelect(sys); expanded = false }
                )
            }
        }
    }
}

@Composable
fun ChartTypeButton(label: String, selected: Boolean, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.height(36.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (selected) Color.White else Color.White.copy(alpha = 0.05f),
            contentColor = if (selected) Color.Black else Color.Gray
        ),
        shape = RoundedCornerShape(8.dp),
        contentPadding = PaddingValues(horizontal = 12.dp)
    ) {
        Text(label, fontSize = 9.sp, fontWeight = FontWeight.Black)
    }
}

