package com.indiza.scholar.ui.home

import android.annotation.SuppressLint
import android.app.DatePickerDialog
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.navigation.findNavController
import com.indiza.scholar.R
import com.indiza.scholar.SettingsActivity
import com.indiza.scholar.dao.AnneeScolaireDao
import com.indiza.scholar.data.AppDatabase
import com.indiza.scholar.model.AcademicPermission
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.model.AnneeScolaireEntity
import com.indiza.scholar.model.AnneeScolaireViewModelFactory
import com.indiza.scholar.model.SyncConfig
import com.indiza.scholar.ui.auth.LoginActivity
import com.indiza.scholar.ui.theme.*
import com.indiza.scholar.network.*
import com.indiza.scholar.repositories.*

import com.indiza.scholar.ui.Etablissement.EtablissementBottomSheet
import com.indiza.scholar.ui.Etablissement.EtablissementViewModelFactory
import com.indiza.scholar.network.EtablissementApi
import com.indiza.scholar.repositories.EtablissementRepository
import com.indiza.scholar.ui.Etablissement.EtablissementViewModel
import com.indiza.scholar.ui.components.ServerConnectionIndicator
import com.indiza.scholar.ui.genererPdfDansFlux
import com.indiza.scholar.ui.student.ClasseManagementActivity
import com.indiza.scholar.ui.student.StudentManagementActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.util.Calendar


class HomeFragment : Fragment() {

    private lateinit var homeViewModel: HomeViewModel
    private lateinit var anneeViewModel: AnneeScolaireViewModel
    private lateinit var etablissementViewModel: EtablissementViewModel
    private lateinit var apiService: ApiService

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val db = AppDatabase.getInstance(requireContext())
        val token = requireContext().getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        val anneeApi = ApiClient.create { token }.create(AnneeScolaireApi::class.java)
        apiService = ApiClient.create { token }.create(ApiService::class.java)

        val homeFactory = HomeViewModelFactory(apiService)
        homeViewModel = ViewModelProvider(this, homeFactory).get(HomeViewModel::class.java)
        
        val factory = AnneeScolaireViewModelFactory(AnneeScolaireRepository(db.anneeScolaireDao(), anneeApi), apiService)
        anneeViewModel = ViewModelProvider(this, factory).get(AnneeScolaireViewModel::class.java)

        val etablissementApi = ApiClient.create { token }.create(EtablissementApi::class.java)
        val etablissementRepo = EtablissementRepository(db.etablissementDao(), etablissementApi)
        val etablissementFactory = EtablissementViewModelFactory(etablissementRepo)
        etablissementViewModel = ViewModelProvider(this, etablissementFactory).get(EtablissementViewModel::class.java)

        val userSession = requireContext().getSharedPreferences("user_session", Context.MODE_PRIVATE)
        val userRole = userSession.getString("role", "") ?: ""
        val userName = userSession.getString("name", "Utilisateur") ?: "Utilisateur"
        val userId = userSession.getLong("userId", 0L)
        val schoolId = requireContext().getSharedPreferences("app_config", Context.MODE_PRIVATE).getLong("school_id", 0L)

        if (schoolId > 0L && userRole.isNotBlank()) {
            anneeViewModel.fetchAnnees(schoolId, userRole)
            etablissementViewModel.loadUserSchools(userId)
        }

        return ComposeView(requireContext()).apply {
            setContent {
                ScholarTheme {
                    HomeScreen(
                        homeViewModel = homeViewModel,
                        anneeViewModel = anneeViewModel,
                        etablissementViewModel = etablissementViewModel,
                        apiService = apiService,
                        userName = userName,
                        userId = userId,
                        initialUserRole = userRole,
                        schoolId = schoolId,
                        onLogout = { logout() }
                    )
                }
            }
        }
    }

    private fun logout() {
        requireContext().getSharedPreferences("user_session", Context.MODE_PRIVATE).edit().clear().apply()
        requireContext().getSharedPreferences("app_config", Context.MODE_PRIVATE).edit().clear().apply()
        val intent = Intent(requireContext(), LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    homeViewModel: HomeViewModel,
    anneeViewModel: AnneeScolaireViewModel,
    etablissementViewModel: EtablissementViewModel,
    apiService: ApiService,
    userName: String,
    userId: Long,
    initialUserRole: String, // Renommé pour plus de clarté
    schoolId: Long,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val isUserActive by com.indiza.scholar.SessionManager.isUserActive.collectAsState()
    val currentUserRole by com.indiza.scholar.SessionManager.userRole.collectAsState()
    
    // Si l'utilisateur n'est pas actif (pas d'école, pas d'année ou pas encore validé)
    if (!isUserActive) {
        LaunchedEffect(Unit) {
            Log.d("HomeFragment", "User not active (role: $initialUserRole, school: $schoolId). Redirecting to Dashboard.")
            val navController = (context as? androidx.fragment.app.FragmentActivity)
                ?.findNavController(R.id.nav_host_fragment_activity_main)
            navController?.navigate(R.id.navigation_dashboard)
        }
        return
    }

    var showEtablissementSheet by remember { mutableStateOf(false) }
    var showProfileSheet by remember { mutableStateOf(false) }
    val selectedAnnee by anneeViewModel.selectedAnnee.collectAsState()

    // Charger le suivi de configuration dès que le contexte change
    LaunchedEffect(schoolId, selectedAnnee) {
        if (schoolId > 0L) {
            Log.d("HomeFragment", "Triggering setup progress load for year: ${selectedAnnee?.libelleAnneeScolaire}")
            homeViewModel.loadSetupProgress(schoolId, selectedAnnee?.idServeur)
        }
    }

    Scaffold(
        containerColor = Color(0xFF1E2A3A),
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding).background(Color(0xFF1E2A3A))) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(10.dp)
            ) {

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showProfileSheet = true }
                        .padding(vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surfaceVariant),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = "Profil",
                            modifier = Modifier.size(26.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = userName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            // On affiche le rôle actuel du SessionManager (synchronisé)
                            if (currentUserRole != AcademicRole.SANS_ROLE) {
                                com.indiza.scholar.ui.personnel.RoleBadge(currentUserRole)
                            } else if (initialUserRole.isNotBlank()) {
                                // Fallback sur le rôle initial si le manager n'est pas encore prêt
                                initialUserRole.split(",").forEach { role ->
                                    com.indiza.scholar.ui.personnel.RoleBadge(AcademicRole.fromName(role.trim()))
                                }
                            }
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 2.dp)) {
                            Icon(
                                Icons.Default.Sync,
                                contentDescription = null,
                                modifier = Modifier.size(10.dp),
                                tint = ScholarBlue
                            )
                            Spacer(Modifier.width(4.dp))
                            Text(
                                text = "Connecté",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFF4CAF50)
                            )
                        }
                    }

                    Box(contentAlignment = Alignment.CenterEnd) {
                        ServerConnectionIndicator(apiService)
                    }
                }

                Spacer(modifier = Modifier.height(11.dp))

                val permissions by com.indiza.scholar.SessionManager.permissions.collectAsState()
                val canViewYear = permissions.contains(com.indiza.scholar.model.AcademicPermission.VIEW_SCHOOL_YEAR_INFO)

                // Sélecteurs d'année et d'établissement sur la même ligne
                if (schoolId > 0L && canViewYear) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            LigneAnneeScolaire(anneeViewModel, currentUserRole.name, schoolId, userId, homeViewModel)
                        }
                        Box(modifier = Modifier.weight(1f)) {
                            EtablissementSwitcher(etablissementViewModel, homeViewModel)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                }

                // Dashboard Grid
                Text(
                    text = "Tableau de bord",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 6.dp)
                )

                val menuItems = com.indiza.scholar.model.AppMenu.entries.filter { menu ->
                    com.indiza.scholar.SessionManager.isMenuAccessible(menu)
                }

                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(menuItems) { menu ->
                        val dashboardItem = DashboardItem(
                            emoji = menu.emoji,
                            title = menu.title,
                            description = menu.description
                        )
                        DashboardCard(dashboardItem, onClick = {
                            val intentAnneeId = selectedAnnee?.idServeur ?: 0L
                            when(menu) {
                                com.indiza.scholar.model.AppMenu.ECOLE -> {
                                    showEtablissementSheet = true
                                }
                                com.indiza.scholar.model.AppMenu.PERSONNEL -> {
                                    val intent = Intent(context, com.indiza.scholar.ui.personnel.PersonnelManagementActivity::class.java).apply {
                                        putExtra("idEtablissement", schoolId)
                                        putExtra("idAnnee", intentAnneeId)
                                    }
                                    context.startActivity(intent)
                                }
                                com.indiza.scholar.model.AppMenu.EQUIPE -> {
                                    val intent = Intent(context, com.indiza.scholar.ui.personnel.EquipePedagogiqueActivity::class.java).apply {
                                        putExtra("schoolId", schoolId)
                                        putExtra("idAnnee", intentAnneeId)
                                    }
                                    context.startActivity(intent)
                                }
                                com.indiza.scholar.model.AppMenu.ELEVES -> {
                                    val intent = Intent(context, StudentManagementActivity::class.java).apply {
                                        putExtra("idAnneeScolaire", intentAnneeId)
                                    }
                                    context.startActivity(intent)
                                }
                                com.indiza.scholar.model.AppMenu.MATIERES -> {
                                    val intent = Intent(context, com.indiza.scholar.ui.matieres.MatiereActivity::class.java).apply {
                                        putExtra("idAnneeScolaire", intentAnneeId)
                                    }
                                    context.startActivity(intent)
                                }
                                com.indiza.scholar.model.AppMenu.STATS -> {
                                    val intent = Intent(context, com.indiza.scholar.ui.reports.ReportsActivity::class.java)
                                    intent.putExtra("idAnneeScolaire", selectedAnnee?.idServeur ?: 0L)
                                    intent.putExtra("schoolId", schoolId)
                                    intent.putExtra("userRole", currentUserRole.name)
                                    context.startActivity(intent)
                                }
                                com.indiza.scholar.model.AppMenu.NOTES -> {
                                    val intent = Intent(context, com.indiza.scholar.ui.grades.GradeManagementActivity::class.java)
                                    intent.putExtra("idAnneeScolaire", selectedAnnee?.idServeur ?: 0L)
                                    context.startActivity(intent)
                                }
                                com.indiza.scholar.model.AppMenu.PAIEMENTS -> {
                                    val intent = Intent(context, com.indiza.scholar.ui.finance.PaymentActivity::class.java)
                                    intent.putExtra("idAnneeScolaire", selectedAnnee?.idServeur ?: 0L)
                                    context.startActivity(intent)
                                }
                                com.indiza.scholar.model.AppMenu.CLASSES -> {
                                    val intent = Intent(context, ClasseManagementActivity::class.java)
                                    context.startActivity(intent)
                                }
                                com.indiza.scholar.model.AppMenu.PARAMETRES -> {
                                    val intent = Intent(context, SettingsActivity::class.java)
                                    context.startActivity(intent)
                                }
                                else -> {}
                            }
                        })
                    }
                }
            }

            // Setup Progress Floating Widget
            SetupProgressWidget(
                viewModel = homeViewModel,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(16.dp)
            )
        }
    }

    if (showEtablissementSheet) {
        EtablissementBottomSheet(
            viewModel = etablissementViewModel,
            userRole = currentUserRole,
            onDismiss = { showEtablissementSheet = false }
        )
    }

    if (showProfileSheet) {
        com.indiza.scholar.ui.profile.ProfileBottomSheet(
            userName = userName,
            userRole = currentUserRole.name,
            userId = userId,
            apiService = apiService,
            onDismiss = { showProfileSheet = false },
            onLogout = onLogout
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EtablissementSwitcher(viewModel: EtablissementViewModel, homeViewModel: HomeViewModel) {
    val context = LocalContext.current
    val schools by viewModel.userSchools.collectAsState()
    val currentSchool by viewModel.etablissement.collectAsState()
    var expanded by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "Établissement actif",
            style = MaterialTheme.typography.bodySmall,
            color = Color.Gray
        )
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = !expanded }
        ) {
            Row(
                modifier = Modifier
                    .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = currentSchool?.nomFr ?: "Chargement...",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = ScholarBlue
                )
                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
            }

            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                schools.forEach { school ->
                    DropdownMenuItem(
                        text = { Text(school.nomFr) },
                        onClick = {
                            expanded = false
                            if (school.idServeur != currentSchool?.idServeur) {
                                val schoolId = school.idServeur ?: 0L
                                // Changer d'école dans les SharedPreferences
                                context.getSharedPreferences("app_config", Context.MODE_PRIVATE)
                                    .edit()
                                    .putLong("school_id", schoolId)
                                    .putLong("year_id", 0L) // On réinitialise l'année car c'est une nouvelle école
                                    .apply()
                                
                                // Mettre à jour le SessionManager (ce qui déclenchera la redirection via MainActivity)
                                com.indiza.scholar.SessionManager.setContext(schoolId, 0L, false)
                                
                                // Recharger les données
                                viewModel.loadSchool(schoolId)
                                Toast.makeText(context, "Passage à : ${school.nomFr}. Veuillez choisir une année scolaire.", Toast.LENGTH_SHORT).show()
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun SelectableDateField(label: String, value: String, onDateSelected: (String) -> Unit) {
    val context = LocalContext.current
    val calendar = Calendar.getInstance()
    
    val datePicker = DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            val formatted = String.format("%04d-%02d-%02d", year, month + 1, dayOfMonth)
            onDateSelected(formatted)
        },
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    )

    OutlinedTextField(
        value = value,
        onValueChange = {},
        label = { Text(label) },
        readOnly = true,
        trailingIcon = {
            Icon(Icons.Default.DateRange, contentDescription = null, modifier = Modifier.clickable { datePicker.show() })
        },
        modifier = Modifier.fillMaxWidth().clickable { datePicker.show() }
    )
}


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LigneAnneeScolaire(
    viewModel: AnneeScolaireViewModel, 
    userRole: String, 
    schoolId: Long, 
    userId: Long, 
    homeViewModel: HomeViewModel
) {
    val context = LocalContext.current
    var expanded by remember { mutableStateOf(false) }
    val annees by viewModel.annees.collectAsState()
    val selectedAnnee by viewModel.selectedAnnee.collectAsState()

    val canAdd = com.indiza.scholar.SessionManager.hasPermission(AcademicPermission.REGISTER_SCHOOL_YEAR)
    val canEdit = com.indiza.scholar.SessionManager.hasPermission(AcademicPermission.EDIT_SCHOOL_YEAR_INFO)
    val canDelete = com.indiza.scholar.SessionManager.hasPermission(AcademicPermission.UNENROLL_SCHOOL_YEAR)

    var showActions by remember { mutableStateOf(false) } // Par défaut caché comme dans l'image

    // 🔹 États des boîtes de dialogue
    var showAddDialog by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showNetworkSheet by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "Année scolaire",
            style = MaterialTheme.typography.bodySmall,
            color = Color.LightGray
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Box(modifier = Modifier.weight(1f)) {
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    Row(
                        modifier = Modifier
                            .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = selectedAnnee?.libelleAnneeScolaire ?: "Non définie",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                    }

                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        annees.forEach { annee ->
                            DropdownMenuItem(
                                text = { Text(annee.libelleAnneeScolaire) },
                                onClick = {
                                    viewModel.selectAnnee(annee)
                                    expanded = false
                                    
                                    val anneeId = annee.idServeur ?: 0L
                                    // Persister le choix de l'année
                                    context.getSharedPreferences("app_config", Context.MODE_PRIVATE)
                                        .edit()
                                        .putLong("year_id", anneeId)
                                        .apply()
                                        
                                    // Mettre à jour le SessionManager
                                    com.indiza.scholar.SessionManager.setContext(schoolId, anneeId, schoolId > 0 && anneeId > 0)
                                    
                                    // 🛡️ Sync permissions for the new year context
                                    if (userId > 0L) {
                                        homeViewModel.syncPermissions(userId, schoolId, anneeId)
                                    }
                                }
                            )
                        }
                    }
                }
            }

            IconButton(
                onClick = { showActions = !showActions },
                modifier = Modifier
                    .size(48.dp)
                    .background(Color.LightGray.copy(alpha = 0.4f), CircleShape)
            ) {
                Icon(
                    imageVector = if (showActions) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                    contentDescription = "Actions",
                    tint = Color.White
                )
            }
        }

        if (showActions) {
            Row(
                modifier = Modifier.padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (canAdd) {
                    IconButton(onClick = { showAddDialog = true }, modifier = Modifier.background(ScholarTeal, CircleShape)) {
                        Icon(Icons.Default.Add, contentDescription = "Ajouter", tint = Color.White)
                    }
                }
                if (canEdit) {
                    IconButton(onClick = { showEditDialog = true }, modifier = Modifier.background(ScholarBlue, CircleShape)) {
                        Icon(Icons.Default.Edit, contentDescription = "Modifier", tint = Color.White)
                    }
                }
                if (canDelete) {
                    IconButton(onClick = { showDeleteDialog = true }, modifier = Modifier.background(ScholarRed, CircleShape)) {
                        Icon(Icons.Default.Delete, contentDescription = "Supprimer", tint = Color.White)
                    }
                }
                IconButton(onClick = { showNetworkSheet = true }, modifier = Modifier.background(Color.Gray.copy(alpha = 0.2f), CircleShape)) {
                    Icon(Icons.Default.Dns, contentDescription = "Serveur", tint = MaterialTheme.colorScheme.onSurface)
                }
            }
        }
    }

    if (showNetworkSheet) {
        val scope = rememberCoroutineScope()
        val prefs = remember { context.getSharedPreferences("app_config", Context.MODE_PRIVATE) }
        var serverIp by remember { mutableStateOf(prefs.getString("server_ip", "192.168.0.50") ?: "") }
        var isTesting by remember { mutableStateOf(false) }

        ModalBottomSheet(onDismissRequest = { if (!isTesting) showNetworkSheet = false }) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth().padding(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Configuration Réseau", style = MaterialTheme.typography.titleLarge)
                OutlinedTextField(
                    value = serverIp,
                    onValueChange = { serverIp = it },
                    label = { Text("IP du Serveur / URL") },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("ex: 192.168.1.100") },
                    singleLine = true
                )
                if (isTesting) LinearProgressIndicator(modifier = Modifier.fillMaxWidth())

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = { showNetworkSheet = false }, enabled = !isTesting) { Text("Annuler") }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            scope.launch {
                                isTesting = true
                                val formattedIp = if (serverIp.startsWith("http")) serverIp else "http://$serverIp:4000/"
                                if (testConnection(formattedIp)) {
                                    prefs.edit().putString("server_ip", serverIp).apply()
                                    ApiClient.updateBaseUrl(serverIp)
                                    showNetworkSheet = false
                                    Toast.makeText(context, "Serveur mis à jour !", Toast.LENGTH_SHORT).show()
                                } else {
                                    Toast.makeText(context, "Serveur injoignable ($formattedIp)", Toast.LENGTH_SHORT).show()
                                }
                                isTesting = false
                            }
                        },
                        enabled = !isTesting
                    ) {
                        Text(if (isTesting) "Test..." else "Appliquer")
                    }
                }
            }
        }
    }


    // ============================
    // 🔸 DIALOGUE : AJOUT
    // ============================
    if (showAddDialog) {
        var newLibelle by remember { mutableStateOf("") }
        var newDateDebut by remember { mutableStateOf("") }
        var newDateFin by remember { mutableStateOf("") }
        var cloturee by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (newLibelle.isNotBlank() &&
                            newDateDebut.isNotBlank() &&
                            newDateFin.isNotBlank()
                        ) {
                            val newAnnee = AnneeScolaireEntity(
                                libelleAnneeScolaire = newLibelle,
                                dateDebut = newDateDebut,
                                dateFin = newDateFin,
                                idEtablissement = schoolId,
                                cloturerAnnee = cloturee
                            )
                            viewModel.addAnnee(newAnnee, schoolId, userRole)
                        }
                        showAddDialog = false
                    }
                ) { Text("Créer") }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Annuler")
                }
            },
            title = { Text("Nouvelle année scolaire") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = newLibelle,
                        onValueChange = { newLibelle = it },
                        label = { Text("Libellé (ex: 2025 - 2026)") }
                    )

                    SelectableDateField(
                        label = "Date de début",
                        value = newDateDebut,
                        onDateSelected = { newDateDebut = it }
                    )

                    SelectableDateField(
                        label = "Date de fin",
                        value = newDateFin,
                        onDateSelected = { newDateFin = it }
                    )

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = cloturee, onCheckedChange = { cloturee = it })
                        Text("Année clôturée ?")
                    }
                }
            }
        )
    }

    // ============================
    // 🔸 DIALOGUE : MODIFICATION
    // ============================
    if (showEditDialog && selectedAnnee != null) {
        var updatedLibelle by remember { mutableStateOf(selectedAnnee!!.libelleAnneeScolaire) }
        var updatedDateDebut by remember { mutableStateOf(selectedAnnee!!.dateDebut) }
        var updatedDateFin by remember { mutableStateOf(selectedAnnee!!.dateFin) }
        var cloturee by remember { mutableStateOf(selectedAnnee!!.cloturerAnnee) }

        AlertDialog(
            onDismissRequest = { showEditDialog = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        val updated = selectedAnnee!!.copy(
                            libelleAnneeScolaire = updatedLibelle,
                            dateDebut = updatedDateDebut,
                            dateFin = updatedDateFin,
                            cloturerAnnee = cloturee
                        )
                        viewModel.updateAnnee(updated, schoolId, userRole)
                        showEditDialog = false
                    }
                ) { Text("Enregistrer") }
            },
            dismissButton = {
                TextButton(onClick = { showEditDialog = false }) {
                    Text("Annuler")
                }
            },
            title = { Text("Modifier l'année scolaire") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = updatedLibelle,
                        onValueChange = { updatedLibelle = it },
                        label = { Text("Libellé") }
                    )

                    SelectableDateField(
                        label = "Date de début",
                        value = updatedDateDebut,
                        onDateSelected = { updatedDateDebut = it }
                    )

                    SelectableDateField(
                        label = "Date de fin",
                        value = updatedDateFin,
                        onDateSelected = { updatedDateFin = it }
                    )

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = cloturee, onCheckedChange = { cloturee = it })
                        Text("Année clôturée ?")
                    }
                }
            }
        )
    }

    // ============================
    // 🔸 DIALOGUE : SUPPRESSION
    // ============================
    if (showDeleteDialog && selectedAnnee != null) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteAnnee(selectedAnnee!!, schoolId, userRole)
                    showDeleteDialog = false
                }) {
                    Text("Supprimer", color = Color.Red)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) { Text("Annuler") }
            },
            title = { Text("Supprimer l’année") },
            text = { Text("Voulez-vous vraiment supprimer « ${selectedAnnee!!.libelleAnneeScolaire} » ?") }
        )
    }
}

data class DashboardItem(
    val emoji: String,
    val title: String,
    val description: String,
    val hasNotification: Boolean = false,
    val permission: com.indiza.scholar.model.AcademicPermission? = null
)

@Composable
fun SetupProgressWidget(viewModel: HomeViewModel, modifier: Modifier = Modifier) {
    val progress by viewModel.setupProgress.collectAsState()
    val error by viewModel.error.collectAsState()
    var expanded by remember { mutableStateOf(false) }
    var showServerConfig by remember { mutableStateOf(false) }
    val context = LocalContext.current

    Box(modifier = modifier) {
        if (expanded) {
            Card(
                modifier = Modifier
                    .width(280.dp)
                    .padding(bottom = 70.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Suivi de configuration",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.height(12.dp))
                    
                    if (error != null) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                            Icon(Icons.Default.ErrorOutline, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(32.dp))
                            Spacer(Modifier.height(8.dp))
                            Text(error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center)
                            Spacer(Modifier.height(12.dp))
                            Button(
                                onClick = { showServerConfig = true },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.errorContainer, contentColor = MaterialTheme.colorScheme.onErrorContainer),
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Configurer le serveur", fontSize = 12.sp)
                            }
                        }
                    } else if (progress != null) {
                        val p = progress!!
                        ProgressItemRow("Année scolaire", p.schoolYear.done, p.schoolYear.label)
                        ProgressItemRow("Profil académique", p.academicProfile.done)
                        ProgressItemRow("Frais exigibles (Lib.)", p.globalFees.done)
                        
                        val classFeesLabel = "${p.classFees.count}/${p.classFees.total} classes"
                        ProgressItemRow("Tarifs par classe", p.classFees.done, classFeesLabel)
                        
                        val roomsLabel = "${p.rooms.count}/${p.rooms.total} classes"
                        ProgressItemRow("Salles configurées", p.rooms.done, roomsLabel)
                        
                        ProgressItemRow("Périodes (Trim.)", p.periods.done, "${p.periods.count} déf.")
                        ProgressItemRow("Sous-périodes (Séq.)", p.subPeriods.done, "${p.subPeriods.count} déf.")
                        
                        // Matières avec barre de progression
                        val subjectPercent = if (p.subjects.total > 0) p.subjects.count.toFloat() / p.subjects.total else 0f
                        Column(modifier = Modifier.padding(vertical = 4.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (p.subjects.done) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                                    contentDescription = null,
                                    tint = if (p.subjects.done) Color(0xFF4CAF50) else Color.Gray,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(Modifier.width(12.dp))
                                Text("Répartition matières", style = MaterialTheme.typography.bodyMedium)
                                Spacer(Modifier.weight(1f))
                                Text("${p.subjects.count}/${p.subjects.total}", style = MaterialTheme.typography.labelSmall)
                            }
                            LinearProgressIndicator(
                                progress = { subjectPercent },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(start = 32.dp, top = 8.dp)
                                    .height(4.dp)
                                    .clip(RoundedCornerShape(2.dp)),
                                color = if (subjectPercent < 1f) Color.Gray.copy(alpha = 0.3f) else Color(0xFF4CAF50),
                                trackColor = Color.LightGray.copy(alpha = 0.3f)
                            )
                        }
                    } else {
                        Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(modifier = Modifier.size(32.dp))
                        }
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = { expanded = !expanded },
            modifier = Modifier.align(Alignment.BottomStart),
            containerColor = when {
                error != null -> MaterialTheme.colorScheme.error
                expanded -> Color(0xFF5D5B71)
                else -> MaterialTheme.colorScheme.primary
            },
            contentColor = Color.White,
            shape = CircleShape
        ) {
            Icon(
                imageVector = if (expanded) Icons.Default.Close else if (error != null) Icons.Default.WifiOff else Icons.Default.Assignment,
                contentDescription = "Setup Progress"
            )
        }
    }

    if (showServerConfig) {
        ServerConfigDialog(onDismiss = { showServerConfig = false })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServerConfigDialog(onDismiss: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val prefs = remember { context.getSharedPreferences("app_config", Context.MODE_PRIVATE) }
    var serverIp by remember { mutableStateOf(prefs.getString("server_ip", "192.168.0.50") ?: "") }
    var isTesting by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Configuration Réseau") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Le serveur est injoignable. Veuillez vérifier l'adresse IP.", style = MaterialTheme.typography.bodyMedium)
                OutlinedTextField(
                    value = serverIp,
                    onValueChange = { serverIp = it },
                    label = { Text("IP du Serveur / URL") },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("ex: 192.168.1.100") },
                    singleLine = true
                )
                if (isTesting) LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    scope.launch {
                        isTesting = true
                        val formattedIp = if (serverIp.startsWith("http")) serverIp else "http://$serverIp:4000/"
                        if (testConnection(formattedIp)) {
                            prefs.edit().putString("server_ip", serverIp).apply()
                            ApiClient.updateBaseUrl(serverIp)
                            onDismiss()
                            Toast.makeText(context, "Serveur mis à jour !", Toast.LENGTH_SHORT).show()
                            (context as? android.app.Activity)?.recreate()
                        } else {
                            Toast.makeText(context, "Serveur toujours injoignable ($formattedIp)", Toast.LENGTH_SHORT).show()
                        }
                        isTesting = false
                    }
                },
                enabled = !isTesting
            ) {
                Text(if (isTesting) "Test..." else "Appliquer")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isTesting) { Text("Annuler") }
        }
    )
}

@Composable
fun ProgressItemRow(label: String, done: Boolean, extra: String? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = if (done) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (done) Color(0xFF4CAF50) else Color.Gray,
            modifier = Modifier.size(20.dp)
        )
        Spacer(Modifier.width(12.dp))
        Column {
            Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
            if (extra != null) {
                Text(extra, style = MaterialTheme.typography.labelSmall, color = Color.Gray)
            }
        }
    }
}

@Composable
fun DashboardCard(item: DashboardItem, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF2C3E50))
            .clickable { onClick() }
            .padding(12.dp)
            .fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = item.emoji,
                fontSize = 28.sp
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = item.title,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    maxLines = 2,
                    lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = item.description,
                    color = Color.LightGray.copy(alpha = 0.6f),
                    fontSize = 11.sp,
                    maxLines = 1,
                    lineHeight = 14.sp
                )
            }
        }

        if (item.hasNotification) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(Color.Red, CircleShape)
                    .align(Alignment.TopEnd)
            )
        }
    }
}

suspend fun testConnection(urlString: String): Boolean = withContext(Dispatchers.IO) {
    try {
        val url = java.net.URL(urlString)
        val connection = url.openConnection() as java.net.HttpURLConnection
        connection.connectTimeout = 3000
        connection.connect()
        val responseCode = connection.responseCode
        connection.disconnect()
        responseCode == 200 || responseCode == 404
    } catch (e: Exception) {
        false
    }
}
