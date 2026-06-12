package com.indiza.scholar

import android.content.Intent
import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.indiza.scholar.data.AppDatabase
import com.indiza.scholar.model.AnneeScolaireViewModelFactory
import com.indiza.scholar.model.SyncConfig
import com.indiza.scholar.network.AnneeScolaireApi
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.repositories.AnneeScolaireRepository
import com.indiza.scholar.ui.home.AnneeScolaireViewModel
import com.indiza.scholar.ui.settings.AcademicStructureSettingsGroup
import com.indiza.scholar.ui.settings.StructureConfigViewModel
import com.indiza.scholar.ui.theme.ScholarTheme
import com.indiza.scholar.ui.theme.ThemeManager
import kotlinx.coroutines.*
import java.net.HttpURLConnection
import java.net.URL

class SettingsActivity : ComponentActivity() {

    private lateinit var apiService: ApiService
    private val anneeViewModel: AnneeScolaireViewModel by viewModels {
        val dao = AppDatabase.getInstance(this).anneeScolaireDao()
        val token = getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        val api = ApiClient.create { token }.create(AnneeScolaireApi::class.java)
        val retrofit = ApiClient.create { token }
        apiService = retrofit.create(ApiService::class.java)
        AnneeScolaireViewModelFactory(AnneeScolaireRepository(dao, api), apiService)
    }

    @SuppressLint("UnusedMaterial3ScaffoldPaddingParameter")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val idAnneePassed = intent.getLongExtra("idAnneeScolaire", 0L)

        setContent {
            ScholarTheme {
                val snackbarHostState = remember { SnackbarHostState() }
                
                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    containerColor = MaterialTheme.colorScheme.background,
                    snackbarHost = { SnackbarHost(snackbarHostState) }
                ) { padding ->
                    val selectedAnnee by anneeViewModel.selectedAnnee.collectAsState()
                    SettingsScreen(
                        modifier = Modifier.padding(padding),
                        idAnneeScolaireActive = selectedAnnee?.idServeur ?: 0L,
                        anneeViewModel = anneeViewModel,
                        idAnneePassed = idAnneePassed,
                        snackbarHostState = snackbarHostState
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    modifier: Modifier = Modifier,
    idAnneeScolaireActive: Long, 
    anneeViewModel: AnneeScolaireViewModel, 
    idAnneePassed: Long = 0L,
    snackbarHostState: SnackbarHostState
) {
    val context = LocalContext.current
    val dao = AppDatabase.getInstance(context).structureDao()
    val scrollState = rememberScrollState()

    val userRole = remember {
        val roleName = context.getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("role", null)
        com.indiza.scholar.model.AcademicRole.fromName(roleName)
    }

    val schoolId = remember {
        context.getSharedPreferences("app_config", Context.MODE_PRIVATE).getLong("school_id", 0L)
    }

    var networkKey by remember { mutableIntStateOf(0) }
    var isSyncEnabled by remember { mutableStateOf(SyncConfig.isRemoteSyncEnabled) }

    val apiService = remember(networkKey) {
        ApiClient.create {
            context.getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)
    }

    val structureViewModel: StructureConfigViewModel = viewModel(
        factory = object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return StructureConfigViewModel(dao, apiService) as T
            }
        }
    )

    // States for BottomSheets
    var showAnneeSelector by remember { mutableStateOf(false) }
    var showStructureSheet by remember { mutableStateOf(false) }
    var showThemeSheet by remember { mutableStateOf(false) }
    var showNetworkSheet by remember { mutableStateOf(false) }
    var showLogoutSheet by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        structureViewModel.syncEvents.collect { message ->
            snackbarHostState.showSnackbar(message)
        }
    }
    
    LaunchedEffect(Unit) {
        anneeViewModel.syncEvents.collect { message ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    LaunchedEffect(Unit) {
        if (schoolId > 0L) {
            anneeViewModel.fetchAnnees(schoolId, userRole.name, selectedId = idAnneePassed)
        }
    }

    LaunchedEffect(idAnneeScolaireActive) {
        if (idAnneeScolaireActive > 0L) {
            structureViewModel.verifierConfigurationExistante(idAnneeScolaireActive)
        }
    }

    Column(modifier = modifier.fillMaxSize().verticalScroll(scrollState).padding(vertical = 16.dp)) {
        Text(
            text = "Paramètres",
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp),
            color = MaterialTheme.colorScheme.onBackground
        )

        // 1. Section Synchronisation (Master Switch)
        SettingsSection(title = "Synchronisation") {
            SettingsItem(
                icon = Icons.Default.Sync,
                iconColor = Color(0xFFAF52DE),
                title = "Synchronisation distante",
                subtitle = "Sauvegarde automatique sur le serveur",
                action = {
                    Switch(
                        checked = isSyncEnabled,
                        onCheckedChange = { isChecked ->
                            isSyncEnabled = isChecked
                            SyncConfig.isRemoteSyncEnabled = isChecked
                            context.getSharedPreferences("settings", Context.MODE_PRIVATE).edit().putBoolean("sync_enabled", isChecked).apply()
                        }
                    )
                },
                showDivider = false
            )
        }

        // Toutes les sections suivantes sont soumises à l'opacité du Master Switch
        Column(modifier = Modifier.alpha(if (isSyncEnabled) 1f else 0.4f)) {
            
            // 2. Section Académique
            SettingsSection(title = "Établissement") {
                val selectedAnnee by anneeViewModel.selectedAnnee.collectAsState()
                val annees by anneeViewModel.annees.collectAsState()

                SettingsItem(
                    icon = Icons.Default.CalendarToday,
                    iconColor = Color(0xFF5856D6),
                    title = "Année Scolaire",
                    subtitle = selectedAnnee?.libelleAnneeScolaire ?: "Non définie",
                    action = {
                        Text(text = "Modifier >", color = Color.Gray, fontSize = 14.sp)
                    },
                    onClick = { showAnneeSelector = true }
                )

                SettingsItem(
                    icon = Icons.Default.Hub,
                    iconColor = Color(0xFF007AFF),
                    title = "Structure Académique",
                    subtitle = "Cycles, classes et enseignements",
                    showDivider = false,
                    onClick = { showStructureSheet = true }
                )
            }

            // 3. Section Finance
            SettingsSection(title = "Finance") {
                SettingsItem(
                    icon = Icons.Default.Payments,
                    iconColor = Color(0xFFFF9500),
                    title = "Frais Globaux",
                    subtitle = "Bibliothèque des tarifs de base",
                    onClick = {
                        val intent = Intent(context, com.indiza.scholar.ui.finance.FinanceLibraryActivity::class.java)
                        context.startActivity(intent)
                    }
                )
                SettingsItem(
                    icon = Icons.Default.MeetingRoom,
                    iconColor = Color(0xFF1ABC9C),
                    title = "Classes & Salles",
                    subtitle = "Tarifs par classe et gestion des salles",
                    onClick = {
                        val intent = Intent(context, com.indiza.scholar.ui.student.ClasseManagementActivity::class.java)
                        intent.putExtra("idAnneeScolaire", idAnneeScolaireActive)
                        context.startActivity(intent)
                    }
                )
                SettingsItem(
                    icon = Icons.Default.DirectionsBus,
                    iconColor = Color(0xFF9B59B6),
                    title = "Tarifs Transport",
                    subtitle = "Zones et abonnements",
                    showDivider = false,
                    onClick = {
                        val intent = Intent(context, com.indiza.scholar.ui.finance.TransportManagementActivity::class.java)
                        intent.putExtra("idAnneeScolaire", idAnneeScolaireActive)
                        context.startActivity(intent)
                    }
                )
            }

            // 4. Section Pédagogie
            SettingsSection(title = "Pédagogie") {
                SettingsItem(
                    icon = Icons.Default.EventNote,
                    iconColor = Color(0xFFFF3B30),
                    title = "Calendrier Scolaire",
                    subtitle = "Trimestres et Séquences",
                    onClick = {
                        val intent = Intent(context, com.indiza.scholar.ui.settings.PeriodeManagementActivity::class.java)
                        intent.putExtra("idAnneeScolaire", idAnneeScolaireActive)
                        context.startActivity(intent)
                    }
                )
                SettingsItem(
                    icon = Icons.Default.Book,
                    iconColor = Color(0xFF8E44AD),
                    title = "Matières",
                    subtitle = "Bibliothèque et coefficients",
                    onClick = {
                        val intent = Intent(context, com.indiza.scholar.ui.matieres.MatiereActivity::class.java)
                        intent.putExtra("idAnneeScolaire", idAnneeScolaireActive)
                        context.startActivity(intent)
                    }
                )
                SettingsItem(
                    icon = Icons.Default.People,
                    iconColor = Color(0xFFE67E22),
                    title = "Personnel",
                    subtitle = "Affectation des enseignants",
                    showDivider = false,
                    onClick = {
                        val intent = Intent(context, com.indiza.scholar.ui.personnel.PersonnelManagementActivity::class.java)
                        intent.putExtra("idEtablissement", schoolId)
                        intent.putExtra("idAnnee", idAnneeScolaireActive)
                        context.startActivity(intent)
                    }
                )
            }

            // 5. Section Système
            SettingsSection(title = "Système") {
                val currentMode by ThemeManager.themeMode
                
                SettingsItem(
                    icon = Icons.Default.Palette,
                    iconColor = Color(0xFF34C759),
                    title = "Apparence",
                    subtitle = when(currentMode) {
                        com.indiza.scholar.ui.theme.ThemeMode.LIGHT -> "Clair"
                        com.indiza.scholar.ui.theme.ThemeMode.DARK -> "Sombre"
                        com.indiza.scholar.ui.theme.ThemeMode.SYSTEM -> "Système"
                    },
                    onClick = { showThemeSheet = true }
                )
                
                SettingsItem(
                    icon = Icons.Default.Dns,
                    iconColor = Color(0xFF5AC8FA),
                    title = "Serveur",
                    subtitle = context.getSharedPreferences("app_config", Context.MODE_PRIVATE).getString("server_ip", "192.168.0.50"),
                    showDivider = false,
                    onClick = { showNetworkSheet = true }
                )
            }

            // 6. Section Compte
            SettingsSection(title = "Compte") {
                SettingsItem(
                    icon = Icons.Default.Logout,
                    iconColor = Color(0xFFFF3B30),
                    title = "Déconnexion",
                    subtitle = "Se déconnecter de votre session actuelle",
                    showDivider = false,
                    onClick = { showLogoutSheet = true }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
    }

    // BottomSheets
    if (showAnneeSelector) {
        val annees by anneeViewModel.annees.collectAsState()
        ModalBottomSheet(onDismissRequest = { showAnneeSelector = false }) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth().padding(bottom = 32.dp)) {
                Text("Sélectionner l'année scolaire", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(bottom = 16.dp))
                annees.forEach { annee ->
                    ListItem(
                        headlineContent = { Text(annee.libelleAnneeScolaire) },
                        modifier = Modifier.clickable { 
                            anneeViewModel.selectAnnee(annee)
                            showAnneeSelector = false 
                        }
                    )
                }
            }
        }
    }

    if (showStructureSheet) {
        ModalBottomSheet(onDismissRequest = { showStructureSheet = false }) {
            Box(modifier = Modifier.padding(16.dp).fillMaxWidth().padding(bottom = 32.dp)) {
                AcademicStructureSettingsGroup(
                    idAnneeScolaireActive = idAnneeScolaireActive,
                    viewModel = structureViewModel,
                    userRole = userRole
                )
            }
        }
    }

    if (showThemeSheet) {
        val currentMode by ThemeManager.themeMode
        ModalBottomSheet(onDismissRequest = { showThemeSheet = false }) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth().padding(bottom = 32.dp)) {
                Text("Apparence", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(bottom = 16.dp))
                com.indiza.scholar.ui.theme.ThemeMode.entries.forEach { mode ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth().clickable { 
                            ThemeManager.setThemeMode(context, mode)
                            showThemeSheet = false 
                        }.padding(vertical = 12.dp)
                    ) {
                        RadioButton(selected = currentMode == mode, onClick = null)
                        Text(text = mode.name, modifier = Modifier.padding(start = 16.dp))
                    }
                }
            }
        }
    }

    if (showNetworkSheet) {
        var serverIp by remember { mutableStateOf(context.getSharedPreferences("app_config", Context.MODE_PRIVATE).getString("server_ip", "192.168.0.50") ?: "") }
        var isTesting by remember { mutableStateOf(false) }
        val scope = rememberCoroutineScope()
        
        ModalBottomSheet(onDismissRequest = { if(!isTesting) showNetworkSheet = false }) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth().padding(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Configuration Réseau", style = MaterialTheme.typography.titleLarge)
                OutlinedTextField(
                    value = serverIp,
                    onValueChange = { serverIp = it },
                    label = { Text("IP du Serveur") },
                    modifier = Modifier.fillMaxWidth()
                )
                if (isTesting) LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = { showNetworkSheet = false }, enabled = !isTesting) { Text("Annuler") }
                    Button(
                        onClick = {
                            scope.launch {
                                isTesting = true
                                val formattedIp = if (serverIp.startsWith("http")) serverIp else "http://$serverIp:4000/"
                                if (testConnection(formattedIp)) {
                                    context.getSharedPreferences("app_config", Context.MODE_PRIVATE).edit().putString("server_ip", serverIp).apply()
                                    ApiClient.updateBaseUrl(serverIp)
                                    networkKey++
                                    showNetworkSheet = false
                                } else {
                                    Toast.makeText(context, "Serveur injoignable", Toast.LENGTH_SHORT).show()
                                }
                                isTesting = false
                            }
                        },
                        enabled = !isTesting
                    ) { Text("Tester & Enregistrer") }
                }
            }
        }
    }

    if (showLogoutSheet) {
        ModalBottomSheet(onDismissRequest = { showLogoutSheet = false }) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth()
                    .padding(bottom = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.Logout,
                    contentDescription = null,
                    modifier = Modifier.size(48.dp),
                    tint = Color(0xFFFF3B30)
                )
                Spacer(Modifier.height(16.dp))
                Text("Déconnexion", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text(
                    "Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez saisir vos identifiants à nouveau.",
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(Modifier.height(32.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    OutlinedButton(
                        onClick = { showLogoutSheet = false },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Annuler")
                    }
                    
                    Button(
                        onClick = {
                            context.getSharedPreferences("user_session", Context.MODE_PRIVATE).edit().clear().apply()
                            val intent = Intent(context, com.indiza.scholar.ui.auth.LoginActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                            }
                            context.startActivity(intent)
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF3B30))
                    ) {
                        Text("Déconnexion", color = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsSection(
    title: String? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)) {
        if (title != null) {
            Text(
                text = title.uppercase(),
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                color = Color(0xFF6E6E73),
                modifier = Modifier.padding(start = 24.dp, bottom = 8.dp)
            )
        }
        Card(
            modifier = Modifier.padding(horizontal = 16.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(content = content)
        }
    }
}

@Composable
fun SettingsItem(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String? = null,
    action: @Composable (() -> Unit)? = null,
    showDivider: Boolean = true,
    onClick: (() -> Unit)? = null
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(enabled = onClick != null) { onClick?.invoke() }
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Zone Gauche: Icône
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(iconColor, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Zone Centrale: Texte
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (subtitle != null) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Zone Droite: Action
            Box(modifier = Modifier.padding(start = 8.dp)) {
                if (action != null) {
                    action()
                } else {
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    )
                }
            }
        }
        if (showDivider) {
            HorizontalDivider(
                modifier = Modifier.padding(start = 64.dp),
                thickness = 0.5.dp,
                color = MaterialTheme.colorScheme.outlineVariant
            )
        }
    }
}

suspend fun testConnection(urlString: String): Boolean = withContext(Dispatchers.IO) {
    try {
        val url = URL(urlString)
        val connection = url.openConnection() as HttpURLConnection
        connection.connectTimeout = 3000
        connection.connect()
        val responseCode = connection.responseCode
        connection.disconnect()
        responseCode == 200 || responseCode == 404
    } catch (e: Exception) {
        false
    }
}
