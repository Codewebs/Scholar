package com.indiza.scholar.ui.personnel

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.ui.draw.scale
import com.indiza.scholar.model.*
import com.indiza.scholar.ui.theme.ScholarTheme

import androidx.lifecycle.viewmodel.compose.viewModel
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.repositories.PersonnelRepository

class PersonnelManagementActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val idEtablissement = intent.getLongExtra("idEtablissement", 0)
        val idAnnee = intent.getLongExtra("idAnnee", 0)

        setContent {
            ScholarTheme {
                val context = androidx.compose.ui.platform.LocalContext.current
                val api = ApiClient.create { 
                    context.getSharedPreferences("user_session", android.content.Context.MODE_PRIVATE).getString("token", null) 
                }.create(ApiService::class.java)
                val repo = PersonnelRepository(api)
                
                val viewModel: PersonnelManagementViewModel = viewModel(
                    factory = object : androidx.lifecycle.ViewModelProvider.Factory {
                        override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                            return PersonnelManagementViewModel(repo, idEtablissement, idAnnee) as T
                        }
                    }
                )
                
                PersonnelManagementScreen(viewModel, idEtablissement, idAnnee)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PersonnelManagementScreen(viewModel: PersonnelManagementViewModel, idEtablissement: Long, idAnnee: Long) {
    val uiState by viewModel.uiState.collectAsState()
    val demandes by viewModel.demandes.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("Membres actifs", "Demandes en attente")

    var selectedDemandeForValidation by remember { mutableStateOf<DemandeInscriptionPersonnel?>(null) }
    var selectedPersonnelForAction by remember { mutableStateOf<InscriptionPersonnelEntity?>(null) }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = { Text("Gestion du Personnel") },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background,
                        titleContentColor = MaterialTheme.colorScheme.onBackground
                    )
                )
                SecondaryTabRow(
                    selectedTabIndex = selectedTabIndex,
                    containerColor = MaterialTheme.colorScheme.background,
                    contentColor = MaterialTheme.colorScheme.primary
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            text = { 
                                BadgedBox(badge = { 
                                    if (index == 1 && demandes.isNotEmpty()) {
                                        Badge(containerColor = MaterialTheme.colorScheme.error) { Text(demandes.size.toString()) }
                                    }
                                }) {
                                    Text(title, color = if (selectedTabIndex == index) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        )
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Filtrer par nom ou téléphone...") },
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (selectedTabIndex == 0) {
                // --- VUE ACTIFS ---
                when (val state = uiState) {
                    is PersonnelUIState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = MaterialTheme.colorScheme.primary) }
                    is PersonnelUIState.Error -> Text(state.message, color = MaterialTheme.colorScheme.error)
                    is PersonnelUIState.Success -> {
                        val filteredList = state.list.filter { 
                            it.nom.contains(searchQuery, true) || 
                            (it.prenom?.contains(searchQuery, true) ?: false) ||
                            it.telephone1.toString().contains(searchQuery)
                        }
                        
                        if (filteredList.isEmpty()) {
                            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Aucun membre actif trouvé", color = MaterialTheme.colorScheme.onSurfaceVariant) }
                        } else {
                            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(filteredList) { personnel ->
                                    PersonnelItemCard(personnel) { selectedPersonnelForAction = personnel }
                                }
                            }
                        }
                    }
                }
            } else {
                // --- VUE DEMANDES ---
                val filteredDemandes = demandes.filter { 
                    it.nom.contains(searchQuery, true) || 
                    it.prenom.contains(searchQuery, true) ||
                    it.telephone1.toString().contains(searchQuery)
                }
                
                if (filteredDemandes.isEmpty()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Aucune demande en attente", color = MaterialTheme.colorScheme.onSurfaceVariant) }
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(filteredDemandes) { demande ->
                            DemandeItemCard(demande) { selectedDemandeForValidation = demande }
                        }
                    }
                }
            }
        }
    }

    // --- BottomSheets ---
    if (selectedDemandeForValidation != null) {
        ModalBottomSheet(
            onDismissRequest = { selectedDemandeForValidation = null },
            containerColor = MaterialTheme.colorScheme.surface,
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ) {
            ValidationTunnelContent(
                demande = selectedDemandeForValidation!!,
                idAnneeScolaire = idAnnee,
                availableMatieres = (viewModel.availableMatieres.collectAsState()).value,
                onDismiss = { selectedDemandeForValidation = null },
                onValidate = { payload ->
                    viewModel.validerDemande(payload)
                    selectedDemandeForValidation = null
                }
            )
        }
    }

    if (selectedPersonnelForAction != null) {
        ModalBottomSheet(
            onDismissRequest = { selectedPersonnelForAction = null },
            containerColor = MaterialTheme.colorScheme.surface,
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ) {
            StaffActionContent(
                personnel = selectedPersonnelForAction!!,
                idAnnee = idAnnee,
                viewModel = viewModel,
                onDismiss = { selectedPersonnelForAction = null }
            )
        }
    }
}

@Composable
fun StaffActionContent(
    personnel: InscriptionPersonnelEntity,
    idAnnee: Long,
    viewModel: PersonnelManagementViewModel,
    onDismiss: () -> Unit
) {
    var currentView by remember { mutableStateOf("MENU") } // MENU, EDIT_INFO, EDIT_RIGHTS, AFFECT_ROOM, REMOVE_ROOM
    
    when (currentView) {
        "MENU" -> StaffMenuOptions(
            personnel = personnel,
            onEditInfo = { currentView = "EDIT_INFO" },
            onEditRights = { currentView = "EDIT_RIGHTS" },
            onAffectRoom = { currentView = "AFFECT_ROOM" },
            onRemoveRoom = { currentView = "REMOVE_ROOM" },
            onBan = { 
                viewModel.banirPersonnel(personnel.idServeur ?: 0L)
                onDismiss()
            }
        )
        "EDIT_INFO" -> EditStaffInfoContent(
            personnel = personnel,
            availableMatieres = viewModel.availableMatieres.collectAsState().value,
            onDismiss = { currentView = "MENU" },
            onUpdate = { /* Not fully implemented but would call an update API */ onDismiss() }
        )
        "EDIT_RIGHTS" -> RightsManagementContent(
            personnel = personnel,
            onDismiss = { currentView = "MENU" },
            onUpdate = { added, removed ->
                viewModel.updatePermissions(personnel.idServeur!!, added, removed)
                onDismiss()
            }
        )
        "AFFECT_ROOM" -> AffectRoomContent(
            personnel = personnel,
            idAnnee = idAnnee,
            viewModel = viewModel,
            onDismiss = { currentView = "MENU" },
            onSuccess = { onDismiss() }
        )
        "REMOVE_ROOM" -> RemoveRoomContent(
            personnel = personnel,
            viewModel = viewModel,
            onDismiss = { currentView = "MENU" },
            onSuccess = { onDismiss() }
        )
    }
}

@Composable
fun StaffMenuOptions(
    personnel: InscriptionPersonnelEntity,
    onEditInfo: () -> Unit,
    onEditRights: () -> Unit,
    onAffectRoom: () -> Unit,
    onRemoveRoom: () -> Unit,
    onBan: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Text("Actions: ${personnel.nom}", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(24.dp))
        
        ActionMenuItem(Icons.Default.Person, "Modifier ses infos (Détails, Spécialités)", onEditInfo)
        ActionMenuItem(Icons.Default.AdminPanelSettings, "Gérer les permissions / Rôle", onEditRights)
        ActionMenuItem(Icons.Default.AddHomeWork, "Affecter à une salle de classe", onAffectRoom)
        ActionMenuItem(Icons.Default.RemoveCircleOutline, "Retirer d'une salle de classe", onRemoveRoom)
        
        Spacer(modifier = Modifier.height(16.dp))
        HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f))
        Spacer(modifier = Modifier.height(16.dp))
        
        ActionMenuItem(Icons.Default.Block, "Bannir ce membre", onBan, color = MaterialTheme.colorScheme.error)
        
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun ActionMenuItem(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, onClick: () -> Unit, color: Color = MaterialTheme.colorScheme.onSurface) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onClick() }.padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = if (color == MaterialTheme.colorScheme.onSurface) MaterialTheme.colorScheme.primary else color)
        Spacer(modifier = Modifier.width(16.dp))
        Text(title, color = color, fontSize = 16.sp)
    }
}

@Composable
fun EditStaffInfoContent(
    personnel: InscriptionPersonnelEntity,
    availableMatieres: List<MatiereEntity>,
    onDismiss: () -> Unit,
    onUpdate: () -> Unit
) {
    // Simplified edit view focusing on role and specialties
    var selectedRole by remember { mutableStateOf(personnel.role) }
    val selectedMatiereIds = remember { mutableStateListOf<Long>().apply { addAll(personnel.specialites?.mapNotNull { it.idServeur } ?: emptyList()) } }
    
    Column(modifier = Modifier.fillMaxWidth().padding(16.dp).verticalScroll(rememberScrollState())) {
        Text("Modifier Informations", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(16.dp))
        
        Text("Rôle: $selectedRole")
        // Would add role selector here...

        Spacer(modifier = Modifier.height(16.dp))
        @OptIn(ExperimentalLayoutApi::class)
        Text("Spécialités (Matières)", fontWeight = FontWeight.Bold)
        @OptIn(ExperimentalLayoutApi::class)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            availableMatieres.forEach { matiere ->
                val isChecked = selectedMatiereIds.contains(matiere.idServeur)
                FilterChip(
                    selected = isChecked,
                    onClick = {
                        if (isChecked) selectedMatiereIds.remove(matiere.idServeur)
                        else selectedMatiereIds.add(matiere.idServeur ?: 0L)
                    },
                    label = { Text(matiere.abreviation ?: matiere.libelleFr, fontSize = 10.sp) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        Button(onClick = onUpdate, modifier = Modifier.fillMaxWidth()) { Text("Sauvegarder") }
        TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) { Text("Annuler") }
    }
}

@Composable
fun RemoveRoomContent(
    personnel: InscriptionPersonnelEntity,
    viewModel: PersonnelManagementViewModel,
    onDismiss: () -> Unit,
    onSuccess: () -> Unit
) {
    val affectations by viewModel.affectationsMembre.collectAsState()
    
    LaunchedEffect(personnel.idServeur) {
        personnel.idServeur?.let { viewModel.loadAffectationsMembre(it) }
    }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp).heightIn(min = 300.dp)) {
        Text("Affectations de ${personnel.nom}", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(16.dp))
        
        if (affectations.isEmpty()) {
            Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                Text("Aucune affectation trouvée", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(affectations) { aff ->
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(aff.matiereLabel, fontWeight = FontWeight.Bold)
                                Text("Salle: ${aff.nomComplet}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                            }
                            IconButton(onClick = { viewModel.retirerAffectation(aff.idAffectation); onSuccess() }) {
                                Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) { Text("Retour") }
    }
}

@Composable
fun AffectRoomContent(
    personnel: InscriptionPersonnelEntity,
    idAnnee: Long,
    viewModel: PersonnelManagementViewModel,
    onDismiss: () -> Unit,
    onSuccess: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    val salles by viewModel.sallesDisponibles.collectAsState()
    var selectedSalle by remember { mutableStateOf<SalleEntity?>(null) }
    
    LaunchedEffect(idAnnee) {
        viewModel.loadSalles(idAnnee)
    }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp).heightIn(max = 500.dp)) {
        Text("Affectation Salle", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(16.dp))
        
        if (selectedSalle == null) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Rechercher une salle") },
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Default.Search, null) }
            )
            Spacer(modifier = Modifier.height(8.dp))
            LazyColumn(modifier = Modifier.weight(1f)) {
                items(salles.filter { it.nomSalle.contains(searchQuery, true) || (it.classeLabel?.contains(searchQuery, true) ?: false) }) { salle ->
                    val label = if (salle.classeLabel != null) "${salle.classeLabel} ${salle.nomSalle}" else salle.nomSalle
                    ListItem(
                        headlineContent = { Text(label) },
                        modifier = Modifier.clickable { selectedSalle = salle },
                        colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                    )
                }
            }
        } else {
            val label = if (selectedSalle!!.classeLabel != null) "${selectedSalle!!.classeLabel} ${selectedSalle!!.nomSalle}" else selectedSalle!!.nomSalle
            Text("Salle: $label", fontWeight = FontWeight.Bold)
            TextButton(onClick = { selectedSalle = null }) { Text("Changer de salle") }
            
            Spacer(modifier = Modifier.height(16.dp))
            Text("Choisir la matière d'affectation:", color = MaterialTheme.colorScheme.onSurfaceVariant)
            
            val specialites = personnel.specialites
            if (specialites.isNullOrEmpty()) {
                Text("Cet enseignant n'a pas de spécialités définies.", color = MaterialTheme.colorScheme.error)
            } else {
                LazyColumn(modifier = Modifier.weight(1f)) {
                    items(specialites) { matiere ->
                        ListItem(
                            headlineContent = { Text(matiere.libelleFr) },
                            modifier = Modifier.clickable {
                                viewModel.affecterPersonnel(
                                    AffectationPayload(
                                        idInscriptionPersonnel = personnel.idServeur!!,
                                        idSalle = selectedSalle!!.idServeur!!,
                                        idMatiere = matiere.idServeur!!
                                    )
                                ) { ok -> if (ok) onSuccess() }
                            },
                            colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                        )
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) { Text("Retour") }
    }
}

@Composable
fun PersonnelItemCard(personnel: InscriptionPersonnelEntity, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("${personnel.nom} ${personnel.prenom ?: ""}", fontWeight = FontWeight.Bold)
                
                // Badges des rôles
                Row(
                    modifier = Modifier.padding(top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    val roles = personnel.role.split(",").map { it.trim() }
                    roles.forEach { roleName ->
                        val academicRole = AcademicRole.fromName(roleName)
                        RoleBadge(academicRole)
                    }
                }

                if (personnel.bloque) {
                    Text("🔒 COMPTE BLOQUÉ", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold, fontSize = 10.sp, modifier = Modifier.padding(top = 4.dp))
                }
            }
            Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun RoleBadge(role: AcademicRole) {
    Surface(
        color = role.color.copy(alpha = 0.15f),
        contentColor = role.color,
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, role.color.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(role.icon, null, modifier = Modifier.size(12.dp))
            Text(role.name, fontSize = 10.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun DemandeItemCard(demande: DemandeInscriptionPersonnel, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("${demande.nom} ${demande.prenom}", fontWeight = FontWeight.Bold)
                Text("Poste actuel: ${demande.profilDemande}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                Text(demande.telephone1.toString(), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
            }
            Surface(
                color = Color(0xFFF1C40F).copy(alpha = 0.2f),
                shape = RoundedCornerShape(4.dp)
            ) {
                Text(
                    "EN ATTENTE", 
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    color = Color(0xFFF1C40F),
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ValidationTunnelContent(
    demande: DemandeInscriptionPersonnel,
    idAnneeScolaire: Long,
    availableMatieres: List<MatiereEntity>,
    onDismiss: () -> Unit,
    onValidate: (ValidationDemandePayload) -> Unit
) {
    var matricule by remember { mutableStateOf("") }
    var dateNais by remember { mutableStateOf("") }
    var lieuNais by remember { mutableStateOf("") }
    var sexe by remember { mutableStateOf("M") }
    var selectedRole by remember { mutableStateOf("ENSEIGNANT") }
    val roles = listOf("DIRECTEUR", "DIRECTEUR_DES_ETUDES", "SURVEILLANT_GENERAL", "ENSEIGNANT", "INTENDANT", "SECRETAIRE")

    // Surcharges
    var showPermAdjustment by remember { mutableStateOf(false) }
    val defaultPerms = remember(selectedRole) { AcademicRole.fromName(selectedRole).permissions }
    val removedPerms = remember { mutableStateListOf<String>() }
    val addedPerms = remember { mutableStateListOf<String>() }

    // Spécialités (si enseignant)
    val selectedMatiereIds = remember { mutableStateListOf<Long>() }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp).verticalScroll(rememberScrollState())) {
        Text("Détails du postulant", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
        Text("${demande.nom} ${demande.prenom}", style = MaterialTheme.typography.headlineSmall)
        Text("Tel: ${demande.telephone1} | Email: ${demande.email ?: "N/A"}", color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(modifier = Modifier.height(24.dp))
        Text("Attribution du rôle", fontWeight = FontWeight.Bold)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            roles.forEach { role ->
                FilterChip(
                    selected = selectedRole == role,
                    onClick = { selectedRole = role; removedPerms.clear(); addedPerms.clear() },
                    label = { Text(role) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primary,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                    )
                )
            }
        }

        if (selectedRole == "ENSEIGNANT") {
            Spacer(modifier = Modifier.height(16.dp))
            Text("Spécialités (Matières)", fontWeight = FontWeight.Bold)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                availableMatieres.forEach { matiere ->
                    val isChecked = selectedMatiereIds.contains(matiere.idServeur)
                    FilterChip(
                        selected = isChecked,
                        onClick = {
                            if (isChecked) selectedMatiereIds.remove(matiere.idServeur)
                            else if (selectedMatiereIds.size < 4) selectedMatiereIds.add(matiere.idServeur ?: 0L)
                        },
                        label = { Text(matiere.abreviation ?: matiere.libelleFr, fontSize = 10.sp) }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        
        // Accordéon Droits
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { showPermAdjustment = !showPermAdjustment },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Ajustement des permissions", style = MaterialTheme.typography.titleSmall)
                    Icon(if (showPermAdjustment) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null)
                }
                
                if (showPermAdjustment) {
                    Spacer(modifier = Modifier.height(8.dp))
                    PermissionGroupingList(
                        rolePerms = defaultPerms,
                        addedPerms = addedPerms,
                        removedPerms = removedPerms,
                        lang = "fr",
                        isScrollable = false
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        Text("Informations complémentaires", fontWeight = FontWeight.Bold)
        OutlinedTextField(
            value = matricule, onValueChange = { matricule = it },
            label = { Text("Matricule") }, modifier = Modifier.fillMaxWidth()
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = dateNais, onValueChange = { dateNais = it },
                label = { Text("Date Nais (AAAA-MM-JJ)") }, modifier = Modifier.weight(1f)
            )
            OutlinedTextField(
                value = lieuNais, onValueChange = { lieuNais = it },
                label = { Text("Lieu Nais") }, modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(32.dp))
        Button(
            onClick = {
                onValidate(ValidationDemandePayload(
                    idDemande = demande.idDemande,
                    idAnneeScolaire = idAnneeScolaire,
                    matricule = matricule,
                    dateNaissance = dateNais,
                    lieuNaissance = lieuNais,
                    sexe = sexe,
                    role = selectedRole,
                    permissionsAjoutees = addedPerms.toList(),
                    permissionsRetirees = removedPerms.toList()
                ))
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2ECC71)),
            shape = RoundedCornerShape(28.dp),
            enabled = matricule.isNotBlank() && dateNais.isNotBlank()
        ) {
            Text("Confirmer l'inscription")
        }
        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
fun RightsManagementContent(
    personnel: InscriptionPersonnelEntity,
    onDismiss: () -> Unit,
    onUpdate: (List<String>, List<String>) -> Unit
) {
    val rolePerms = remember { AcademicRole.fromName(personnel.role).permissions }
    
    // Initialise avec les surcharges existantes
    val addedPerms = remember { mutableStateListOf<String>().apply { addAll(personnel.permissionsAjoutees ?: emptyList()) } }
    val removedPerms = remember { mutableStateListOf<String>().apply { addAll(personnel.permissionsRetirees ?: emptyList()) } }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Text("Gérer les droits d'accès", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
        Text("${personnel.nom} ${personnel.prenom ?: ""}", style = MaterialTheme.typography.headlineSmall)
        Text("Rôle: ${personnel.role}", color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(modifier = Modifier.height(24.dp))

        Box(modifier = Modifier.weight(1f)) {
            PermissionGroupingList(
                rolePerms = rolePerms,
                addedPerms = addedPerms,
                removedPerms = removedPerms,
                lang = "fr"
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = { onUpdate(addedPerms.toList(), removedPerms.toList()) },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
        ) {
            Text("Enregistrer les modifications")
        }
        Spacer(modifier = Modifier.height(8.dp))
    }
}

@Composable
fun PermissionGroupingList(
    rolePerms: Set<AcademicPermission>,
    addedPerms: SnapshotStateList<String>,
    removedPerms: SnapshotStateList<String>,
    lang: String,
    isScrollable: Boolean = true
) {
    if (isScrollable) {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(PermissionGroups.groups) { group ->
                PermissionGroupItem(group, rolePerms, addedPerms, removedPerms, lang, depth = 0)
            }
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            PermissionGroups.groups.forEach { group ->
                PermissionGroupItem(group, rolePerms, addedPerms, removedPerms, lang, depth = 0)
            }
        }
    }
}

@Composable
fun PermissionGroupItem(
    group: PermissionGroup,
    rolePerms: Set<AcademicPermission>,
    addedPerms: SnapshotStateList<String>,
    removedPerms: SnapshotStateList<String>,
    lang: String,
    depth: Int
) {
    var expanded by remember { mutableStateOf(depth == 0) }
    
    val allPermsInGroup = remember(group) { getAllPermissionsInGroup(group) }
    val activeCount = allPermsInGroup.count { perm ->
        val isInherited = rolePerms.contains(perm)
        val isBonus = addedPerms.contains(perm.name)
        val isRevoked = removedPerms.contains(perm.name)
        (isInherited && !isRevoked) || isBonus
    }
    
    val isAllActive = activeCount == allPermsInGroup.size && allPermsInGroup.isNotEmpty()
    val isPartiallyActive = activeCount > 0 && activeCount < allPermsInGroup.size

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (depth == 0) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f) 
                else Color.Transparent, 
                RoundedCornerShape(8.dp)
            )
            .padding(if (depth == 0) 8.dp else 0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = !expanded }
                .padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = group.name(lang),
                    fontWeight = if (depth == 0) FontWeight.Bold else FontWeight.Medium,
                    fontSize = if (depth == 0) 16.sp else 14.sp
                )
                if (allPermsInGroup.isNotEmpty()) {
                    Text(
                        text = "$activeCount / ${allPermsInGroup.size} actifs",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            TriStateCheckbox(
                state = when {
                    isAllActive -> androidx.compose.ui.state.ToggleableState.On
                    isPartiallyActive -> androidx.compose.ui.state.ToggleableState.Indeterminate
                    else -> androidx.compose.ui.state.ToggleableState.Off
                },
                onClick = {
                    val targetActive = !isAllActive
                    allPermsInGroup.forEach { perm ->
                        val isInherited = rolePerms.contains(perm)
                        if (targetActive) {
                            if (isInherited) removedPerms.remove(perm.name) else addedPerms.add(perm.name)
                        } else {
                            if (isInherited) removedPerms.add(perm.name) else addedPerms.remove(perm.name)
                        }
                    }
                },
                colors = CheckboxDefaults.colors(checkedColor = MaterialTheme.colorScheme.primary)
            )
        }

        if (expanded) {
            Column(modifier = Modifier.padding(start = 16.dp)) {
                // Permissions directes
                group.permissions.forEach { perm ->
                    PermissionRow(perm, rolePerms, addedPerms, removedPerms, lang)
                }
                
                // Sous-groupes
                group.subGroups.forEach { subGroup ->
                    PermissionGroupItem(subGroup, rolePerms, addedPerms, removedPerms, lang, depth + 1)
                }
            }
        }
    }
}

@Composable
fun PermissionRow(
    perm: AcademicPermission,
    rolePerms: Set<AcademicPermission>,
    addedPerms: SnapshotStateList<String>,
    removedPerms: SnapshotStateList<String>,
    lang: String
) {
    val isInherited = rolePerms.contains(perm)
    val isBonus = addedPerms.contains(perm.name)
    val isRevoked = removedPerms.contains(perm.name)
    val isActive = (isInherited && !isRevoked) || isBonus
    
    var showDescription by remember { mutableStateOf(false) }

    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { showDescription = !showDescription }
                .padding(vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(perm.label(lang), fontSize = 13.sp)
                val statusText = when {
                    isBonus -> "Privilège accordé"
                    isRevoked -> "Droit révoqué"
                    isInherited -> "Hérité du rôle"
                    else -> "Non accordé"
                }
                val statusColor = when {
                    isBonus -> Color(0xFF2ECC71)
                    isRevoked -> MaterialTheme.colorScheme.error
                    isInherited -> MaterialTheme.colorScheme.onSurfaceVariant
                    else -> Color.Gray
                }
                Text(statusText, color = statusColor, fontSize = 9.sp)
            }
            Switch(
                checked = isActive,
                onCheckedChange = { active ->
                    if (isInherited) {
                        if (active) removedPerms.remove(perm.name) else removedPerms.add(perm.name)
                    } else {
                        if (active) addedPerms.add(perm.name) else addedPerms.remove(perm.name)
                    }
                },
                modifier = Modifier.scale(0.7f),
                colors = SwitchDefaults.colors(
                    checkedThumbColor = if (isBonus) Color(0xFF2ECC71) else MaterialTheme.colorScheme.primary
                )
            )
        }
        
        if (showDescription) {
            Surface(
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.05f),
                shape = RoundedCornerShape(4.dp),
                modifier = Modifier.padding(bottom = 8.dp, end = 8.dp)
            ) {
                Text(
                    text = perm.description(lang),
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(8.dp)
                )
            }
        }
    }
}

fun getAllPermissionsInGroup(group: PermissionGroup): List<AcademicPermission> {
    val perms = mutableListOf<AcademicPermission>()
    perms.addAll(group.permissions)
    group.subGroups.forEach { perms.addAll(getAllPermissionsInGroup(it)) }
    return perms
}
