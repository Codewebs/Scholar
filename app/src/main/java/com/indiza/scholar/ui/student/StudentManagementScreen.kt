package com.indiza.scholar.ui.student

import android.content.Intent
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import android.widget.Toast
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.automirrored.filled.Sort
import kotlinx.coroutines.launch

@RequiresApi(Build.VERSION_CODES.O)
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentManagementScreen(
    idAnneeScolaireActive: Long,
    idSalleSelectionnee: Long,
    viewModel: StudentManagementViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    val salles by viewModel.sallesDisponibles.collectAsState()
    
    var isBottomSheetVisible by remember { mutableStateOf(false) }
    var selectedEleveForAction by remember { mutableStateOf<EleveUiModel?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    
    // Filtres
    var selectedClasseName by remember { mutableStateOf("Toutes les classes") }
    var selectedSalleName by remember { mutableStateOf("Toutes les salles") }
    var expandedClasse by remember { mutableStateOf(false) }
    var expandedSalle by remember { mutableStateOf(false) }
    
    // Tri
    var sortOrder by remember { mutableStateOf("Nom (A-Z)") }
    var expandedSort by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    // 🛡️ Logging des permissions à l'entrée
    LaunchedEffect(Unit) {
        val permissions = com.indiza.scholar.SessionManager.permissions.value
        val role = com.indiza.scholar.SessionManager.userRole.value
        android.util.Log.d("StudentManagement", "🔑 [Accès Menu Élèves] Utilisateur: ${role.name}")
        android.util.Log.d("StudentManagement", "📜 Permissions actives (${permissions.size}): ${permissions.map { it.name }}")
    }

    // 🔔 Observer les événements de synchronisation Remote-First
    LaunchedEffect(Unit) {
        viewModel.syncEvents.collect { message ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    LaunchedEffect(idAnneeScolaireActive) {
        viewModel.chargerElevesParSalle(idAnneeScolaireActive, 0L)
        viewModel.chargerSallesParAnnee(idAnneeScolaireActive)
    }

   Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Scaffold(
            containerColor = Color.Transparent,
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                TopAppBar(
                    title = { Text("Gestion des Élèves", color = MaterialTheme.colorScheme.onBackground) },
                    actions = {
                        IconButton(onClick = { expandedSort = true }) {
                            Icon(Icons.AutoMirrored.Filled.Sort, contentDescription = "Trier", tint = MaterialTheme.colorScheme.onBackground)
                        }
                        DropdownMenu(expanded = expandedSort, onDismissRequest = { expandedSort = false }) {
                            listOf("Nom (A-Z)", "Nom (Z-A)", "Récent au plus ancien").forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option) },
                                    onClick = { 
                                        sortOrder = option
                                        expandedSort = false
                                    }
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
                )
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp)
            ) {
                // Barre de Recherche
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Rechercher nom ou matricule", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)) },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = MaterialTheme.colorScheme.onBackground,
                        unfocusedTextColor = MaterialTheme.colorScheme.onBackground
                    )
                )

                // Filtres en cascade
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Filtre Classe
                    ExposedDropdownMenuBox(
                        expanded = expandedClasse,
                        onExpandedChange = { expandedClasse = !expandedClasse },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = selectedClasseName,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Classe") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedClasse) },
                            modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = MaterialTheme.colorScheme.onBackground,
                                unfocusedTextColor = MaterialTheme.colorScheme.onBackground
                            ),
                            textStyle = LocalTextStyle.current.copy(fontSize = 12.sp)
                        )
                        ExposedDropdownMenu(expanded = expandedClasse, onDismissRequest = { expandedClasse = false }) {
                            DropdownMenuItem(text = { Text("Toutes les classes") }, onClick = { selectedClasseName = "Toutes les classes"; selectedSalleName = "Toutes les salles"; expandedClasse = false })
                            salles.mapNotNull { it.classeLabel }.distinct().forEach { classe ->
                                DropdownMenuItem(text = { Text(classe) }, onClick = { selectedClasseName = classe; selectedSalleName = "Toutes les salles"; expandedClasse = false })
                            }
                        }
                    }

                    // Filtre Salle
                    ExposedDropdownMenuBox(
                        expanded = expandedSalle,
                        onExpandedChange = { expandedSalle = !expandedSalle },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = selectedSalleName,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Salle") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedSalle) },
                            modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = MaterialTheme.colorScheme.onBackground,
                                unfocusedTextColor = MaterialTheme.colorScheme.onBackground
                            ),
                            textStyle = LocalTextStyle.current.copy(fontSize = 12.sp)
                        )
                        ExposedDropdownMenu(expanded = expandedSalle, onDismissRequest = { expandedSalle = false }) {
                            DropdownMenuItem(text = { Text("Toutes les salles") }, onClick = { selectedSalleName = "Toutes les salles"; expandedSalle = false })
                            salles.filter { it.classeLabel == selectedClasseName || selectedClasseName == "Toutes les classes" }.forEach { salle ->
                                DropdownMenuItem(text = { Text("${salle.classeLabel} ${salle.nomSalle}") }, onClick = { selectedSalleName = salle.nomSalle; expandedSalle = false })
                            }
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Contenu (Tableau)
                when (val state = uiState) {
                    is StudentUIState.Loading -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = Color(0xFF1ABC9C))
                        }
                    }
                    is StudentUIState.Error -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(text = state.message, color = Color.Red)
                        }
                    }
                    is StudentUIState.Success -> {
                        var filteredList = state.listEleves.filter {
                            (it.nomComplet.contains(searchQuery, ignoreCase = true) || it.matricule.contains(searchQuery, ignoreCase = true)) &&
                            (selectedClasseName == "Toutes les classes" || it.classeLabel.contains(selectedClasseName)) &&
                            (selectedSalleName == "Toutes les salles" || it.classeLabel.contains(selectedSalleName))
                        }

                        // Tri
                        filteredList = when(sortOrder) {
                            "Nom (A-Z)" -> filteredList.sortedBy { it.nomComplet }
                            "Nom (Z-A)" -> filteredList.sortedByDescending { it.nomComplet }
                            "Récent au plus ancien" -> filteredList.sortedByDescending { it.dateInscription }
                            else -> filteredList 
                        }

                        if (filteredList.isEmpty()) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text("Aucun élève trouvé.", color = Color.LightGray)
                            }
                        } else {
                            StudentTableLayout(filteredList) { student ->
                                selectedEleveForAction = student
                            }
                        }
                    }
                }
            }
        }

        // 🚀 FORÇAGE DU FAB : Placé à la racine de la Box pour survoler TOUT l'écran
        val sm = com.indiza.scholar.SessionManager
        val canRegister = sm.hasPermission(com.indiza.scholar.model.AcademicPermission.REGISTER_STUDENT)
        val canEnroll = sm.hasPermission(com.indiza.scholar.model.AcademicPermission.ENROLL_STUDENT)

        if (canRegister || canEnroll) {
            FloatingActionButton(
                onClick = {
                    android.util.Log.d("StudentManagement", "🎯 [Interaction] Clic sur FAB Ajouter Élève")
                    android.util.Log.d("StudentManagement", "✅ Permission REGISTER_STUDENT: $canRegister, ENROLL_STUDENT: $canEnroll")
                    if (idAnneeScolaireActive > 0) {
                        isBottomSheetVisible = true
                    } else {
                        android.util.Log.w("StudentManagement", "⚠️ Action annulée: Aucune année scolaire sélectionnée")
                        scope.launch {
                            snackbarHostState.showSnackbar(
                                message = "Veuillez d'abord sélectionner une année scolaire.",
                                duration = SnackbarDuration.Short
                            )
                        }
                    }
                },
                containerColor = Color(0xFF1ABC9C),
                contentColor = Color.White,
                shape = CircleShape,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(bottom = 24.dp, end = 24.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Inscrire un élève")
            }
        }

        // BottomSheet d'inscription
        if (isBottomSheetVisible) {
            EnrollStudentBottomSheet(
                idAnneeScolaire = idAnneeScolaireActive,
                idSalleInitiale = idSalleSelectionnee,
                viewModel = viewModel,
                onDismiss = { isBottomSheetVisible = false }
            )
        }

        // BottomSheet d'actions élève
        if (selectedEleveForAction != null) {
            StudentActionBottomSheet(
                student = selectedEleveForAction!!,
                idAnneeScolaire = idAnneeScolaireActive,
                viewModel = viewModel,
                onDismiss = { selectedEleveForAction = null }
            )
        }
    }
}

@Composable
fun StudentTableLayout(eleves: List<EleveUiModel>, onStudentClick: (EleveUiModel) -> Unit) {
    val horizontalScrollState = rememberScrollState()

    // Configuration des largeurs fixes par colonne (Modifiable selon vos besoins)
    val matriculeWidth = 110.dp
    val nomWidth = 180.dp
    val classeWidth = 100.dp
    val sexeWidth = 50.dp
    val statutWidth = 90.dp

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(horizontalScrollState) // Permet au tableau de glisser si l'écran est petit
    ) {
        // ─── ENTÊTE DU TABLEAU ───
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface, shape = RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp))
                .padding(vertical = 12.dp, horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "Matricule", widthModifier = Modifier.width(matriculeWidth), isHeader = true)
            Text(text = "Nom complet", widthModifier = Modifier.width(nomWidth), isHeader = true)
            Text(text = "Classe", widthModifier = Modifier.width(classeWidth), isHeader = true, textAlign = TextAlign.Center)
            Text(text = "Sexe", widthModifier = Modifier.width(sexeWidth), isHeader = true, textAlign = TextAlign.Center)
            Text(text = "Statut", widthModifier = Modifier.width(statutWidth), isHeader = true, textAlign = TextAlign.Center)
        }

        // ─── LIGNES DE DONNÉES ───
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.3f))
        ) {
            items(eleves) { eleve ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onStudentClick(eleve) }
                        .padding(vertical = 12.dp, horizontal = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Cellule Matricule
                    Text(text = eleve.matricule, modifier = Modifier.width(matriculeWidth), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)

                    // Cellule Nom
                    Text(text = eleve.nomComplet, modifier = Modifier.width(nomWidth), color = MaterialTheme.colorScheme.onSurface)

                    // Cellule Classe
                    Text(
                        text = "${eleve.classeLabel} ${eleve.salleLabel ?: ""}",
                        modifier = Modifier.width(classeWidth),
                        color = MaterialTheme.colorScheme.secondary,
                        textAlign = TextAlign.Center
                    )

                    // Cellule Sexe
                    Text(
                        text = eleve.sexe,
                        modifier = Modifier.width(sexeWidth),
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        textAlign = TextAlign.Center
                    )

                    // Cellule Statut (Badge de validation)
                    Box(modifier = Modifier.width(statutWidth), contentAlignment = Alignment.Center) {
                        Surface(
                            color = Color(0xFF2ECC71).copy(alpha = 0.2f),
                            contentColor = Color(0xFF2ECC71),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = eleve.statutInscription,
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
                // Ligne de séparation fine entre les lignes d'élèves
                HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f), thickness = 1.dp)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentActionBottomSheet(
    student: EleveUiModel,
    idAnneeScolaire: Long,
    viewModel: StudentManagementViewModel,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showDetailsDialog by remember { mutableStateOf(false) }
    val context = LocalContext.current

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = student.nomComplet,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            
            Text(
                text = "Matricule: ${student.matricule} | Classe: ${student.classeLabel}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )

            HorizontalDivider()

            val sm = com.indiza.scholar.SessionManager
            
            // 1. Infos de base (Dossier)
            val hasDossierPerm = sm.hasPermission(com.indiza.scholar.model.AcademicPermission.STUDENT_DOSSIER)
            android.util.Log.d("StudentAction", "👤 [Actions Élève] ${student.nomComplet} (ID: ${student.idEleve})")
            android.util.Log.d("StudentAction", "🔎 Vérification permission STUDENT_DOSSIER: $hasDossierPerm")
            if (hasDossierPerm) {
                ActionItem(
                    icon = Icons.Default.Info,
                    label = "Infos détaillées de l'élève",
                    onClick = { 
                        android.util.Log.d("StudentAction", "👉 Action: Voir détails")
                        showDetailsDialog = true 
                    }
                )
            }

            // 2. Modifier
            val hasEditPerm = sm.hasPermission(com.indiza.scholar.model.AcademicPermission.EDIT_STUDENT_INFO)
            android.util.Log.d("StudentAction", "🔎 Vérification permission EDIT_STUDENT_INFO: $hasEditPerm")
            if (hasEditPerm) {
                ActionItem(
                    icon = Icons.Default.Edit,
                    label = "Modifier les informations",
                    onClick = { 
                        android.util.Log.d("StudentAction", "👉 Action: Modifier infos")
                        showEditDialog = true 
                    }
                )
            }

            // 3. Re-imprimer le reçu
            val hasPrintPerm = sm.hasPermission(com.indiza.scholar.model.AcademicPermission.PRINT_STUDENT_INFO)
            android.util.Log.d("StudentAction", "🔎 Vérification permission PRINT_STUDENT_INFO: $hasPrintPerm")
            if (hasPrintPerm) {
                ActionItem(
                    icon = Icons.Default.Print,
                    label = "Fiche d'Inscription (Sans finance)",
                    onClick = {
                        android.util.Log.d("StudentAction", "👉 Action: Imprimer fiche inscription")
                        viewModel.getReceiptData(student.idEleve, idAnneeScolaire, isSimple = true) { data ->
                            if (data != null) {
                                com.indiza.scholar.utils.ReceiptUtils.generateAndOpenRegistrationReceipt(context, data)
                            } else {
                                Toast.makeText(context, "Erreur lors de la récupération de la fiche.", Toast.LENGTH_LONG).show()
                            }
                        }
                    }
                )
                
                ActionItem(
                    icon = Icons.Default.Print,
                    label = "Reçu de Paiement (Complet)",
                    onClick = {
                        android.util.Log.d("StudentAction", "👉 Action: Imprimer reçu paiement")
                        viewModel.getReceiptData(student.idEleve, idAnneeScolaire, isSimple = false) { data ->
                            if (data != null) {
                                com.indiza.scholar.utils.ReceiptUtils.generateAndOpenRegistrationReceipt(context, data)
                            } else {
                                Toast.makeText(context, "Erreur lors de la récupération du reçu.", Toast.LENGTH_LONG).show()
                            }
                        }
                    }
                )
            }

            // 4. Supprimer / Désactiver
            val hasUnenrollPerm = sm.hasPermission(com.indiza.scholar.model.AcademicPermission.UNENROLL_STUDENT)
            android.util.Log.d("StudentAction", "🔎 Vérification permission UNENROLL_STUDENT: $hasUnenrollPerm")
            if (hasUnenrollPerm) {
                ActionItem(
                    icon = Icons.Default.Delete,
                    label = "Désactiver l'inscription",
                    color = Color.Red,
                    onClick = { 
                        android.util.Log.d("StudentAction", "👉 Action: Désactiver inscription")
                        showDeleteConfirm = true 
                    }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Confirmer la suppression") },
            text = { Text("Voulez-vous vraiment désactiver l'inscription de ${student.nomComplet} pour cette année scolaire ?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteEnrollment(student.idEleve, idAnneeScolaire) { success, error ->
                            if (success) onDismiss()
                            else Toast.makeText(context, error ?: "Erreur lors de la suppression.", Toast.LENGTH_LONG).show()
                        }
                        showDeleteConfirm = false
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = Color.Red)
                ) { Text("Désactiver") }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) { Text("Annuler") }
            }
        )
    }

    if (showDetailsDialog) {
        StudentDetailsDialog(student = student, onDismiss = { showDetailsDialog = false })
    }

    if (showEditDialog) {
        EnrollStudentBottomSheet(
            idAnneeScolaire = idAnneeScolaire,
            idSalleInitiale = student.idSalle,
            viewModel = viewModel,
            studentToEdit = student,
            onDismiss = { showEditDialog = false; onDismiss() }
        )
    }
}

@Composable
private fun ActionItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit,
    color: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = if (color == Color.Red) Color.Red else MaterialTheme.colorScheme.primary)
        Text(text = label, color = color, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
fun StudentDetailsDialog(student: EleveUiModel, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(text = "Détails de l'élève", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                DetailRow(label = "Matricule", value = student.matricule)
                DetailRow(label = "Nom Complet", value = student.nomComplet)
                DetailRow(label = "Classe", value = student.classeLabel)
                student.salleLabel?.let { DetailRow(label = "Salle", value = it) }
                DetailRow(label = "Sexe", value = if (student.sexe == "M") "Masculin" else "Féminin")
                student.dateNaissance?.let { DetailRow(label = "Date Naissance", value = it) }
                student.lieuNaissance?.let { DetailRow(label = "Lieu Naissance", value = it) }
                student.quartier?.let { DetailRow(label = "Quartier", value = it) }
                
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                Text(text = "Responsables", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                student.nomPere?.let { DetailRow(label = "Père", value = "$it (${student.telephonePere ?: "N/A"})") }
                student.nomMere?.let { DetailRow(label = "Mère", value = "$it (${student.telephoneMere ?: "N/A"})") }
                student.nomTuteur?.let { DetailRow(label = "Tuteur", value = "$it (${student.telephoneTuteur ?: "N/A"})") }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Fermer") }
        }
    )
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Text(text = "$label : ", fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
        Text(text = value, modifier = Modifier.weight(1.5f))
    }
}

// Extension interne d'aide pour factoriser le style des cellules de texte
@Composable
private fun Text(
    text: String,
    widthModifier: Modifier,
    isHeader: Boolean = false,
    color: Color = Color.Unspecified,
    fontWeight: FontWeight? = null,
    textAlign: TextAlign = TextAlign.Start
) {
    Text(
        text = text,
        modifier = widthModifier,
        color = if (isHeader) Color.LightGray else color,
        fontWeight = if (isHeader) FontWeight.Bold else fontWeight,
        style = if (isHeader) MaterialTheme.typography.bodyMedium else MaterialTheme.typography.bodySmall,
        textAlign = textAlign
    )
}

@Composable
fun StudentRowItem(eleve: EleveUiModel) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = eleve.nomComplet, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text(text = "Matricule: ${eleve.matricule}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                Text(text = "Classe: ${eleve.classeLabel} | Sexe: ${eleve.sexe}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
            }

            // Badge statut d'inscription
            Surface(
                color = Color(0xFF2ECC71).copy(alpha = 0.2f),
                contentColor = Color(0xFF2ECC71),
                shape = RoundedCornerShape(4.dp),
                modifier = Modifier.padding(4.dp)
            ) {
                Text(
                    text = eleve.statutInscription,
                    style = MaterialTheme.typography.labelSmall,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}