package com.indiza.scholar.ui.reports

import android.app.DatePickerDialog
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.model.EtablissementEntity
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.student.EleveUiModel
import com.indiza.scholar.ui.theme.ScholarTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.*
import java.io.OutputStream
import java.text.SimpleDateFormat

class ReportsActivity : ComponentActivity() {
    private lateinit var db: com.indiza.scholar.data.AppDatabase
    private var schoolEntity: EtablissementEntity? = null
    private lateinit var api: ApiService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = com.indiza.scholar.data.AppDatabase.getInstance(this)
        
        api = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)

        val schoolId = intent.getLongExtra("schoolId", 0L)
        val selectedAnneeId = intent.getLongExtra("idAnneeScolaire", 0L)
        val roleStr = intent.getStringExtra("userRole") ?: "ENSEIGNANT"
        val userRole = AcademicRole.fromName(roleStr)

        lifecycleScope.launch {
            schoolEntity = withContext(Dispatchers.IO) {
                db.etablissementDao().getEtablissement().firstOrNull()
            }
        }

        setContent {
            ScholarTheme {
                var currentCardId by remember { mutableStateOf<Int?>(null) }
                
                // Advanced Scope State
                var selectedScope by remember { mutableStateOf("ALL") } // ALL, CYCLE, CLASSE, SALLE
                var selectedScopeId by remember { mutableStateOf<Long?>(null) }
                var selectedPeriodeId by remember { mutableStateOf<Long?>(null) }

                Scaffold { padding ->
                    Box(modifier = Modifier.padding(padding)) {
                        AnimatedContent(
                            targetState = currentCardId,
                            transitionSpec = {
                                fadeIn() togetherWith fadeOut()
                            }, label = "ReportNavigation"
                        ) { targetCard ->
                            when (targetCard) {
                                null -> MainReportsScreen(
                                    scope = selectedScope,
                                    onScopeChange = { 
                                        selectedScope = it
                                        selectedScopeId = null 
                                    },
                                    selectedScopeId = selectedScopeId,
                                    onScopeIdChange = { selectedScopeId = it },
                                    selectedPeriodeId = selectedPeriodeId,
                                    onPeriodeIdChange = { selectedPeriodeId = it },
                                    anneeId = selectedAnneeId,
                                    api = api,
                                    onCardClick = { currentCardId = it }, 
                                    onBack = { finish() }
                                )
                                1 -> Card1PaiementsScreen(
                                    anneeId = selectedAnneeId,
                                    api = api,
                                    onBack = { currentCardId = null },
                                    onGenerate = { type, student, params -> generateReport(type, student, params) }
                                )
                                2 -> Card2BilansScreen(
                                    anneeId = selectedAnneeId,
                                    scope = selectedScope,
                                    scopeId = selectedScopeId,
                                    api = api,
                                    userRole = userRole,
                                    onBack = { currentCardId = null },
                                    onGenerate = { type, params -> generateReport(type, null, params) }
                                )
                                3 -> Card3ComparaisonsScreen(
                                    anneeId = selectedAnneeId,
                                    api = api,
                                    userRole = userRole,
                                    onBack = { currentCardId = null },
                                    onGenerate = { type, params -> generateReport(type, null, params) }
                                )
                                4 -> Card4ListesScreen(
                                    anneeId = selectedAnneeId,
                                    scope = selectedScope,
                                    scopeId = selectedScopeId,
                                    api = api,
                                    onBack = { currentCardId = null },
                                    onGenerate = { type, params -> generateReport(type, null, params) }
                                )
                                5 -> Card5AutresScreen(
                                    anneeId = selectedAnneeId,
                                    api = api,
                                    onBack = { currentCardId = null },
                                    onGenerate = { type, student, params -> generateReport(type, student, params) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    private fun generateReport(type: String, student: EleveUiModel?, params: Map<String, Any>) {
        val resolver = contentResolver
        val nomFichier = "${type.replace(" ", "_")}_${System.currentTimeMillis()}.pdf"

        lifecycleScope.launch {
            Toast.makeText(this@ReportsActivity, "Génération de l'état...", Toast.LENGTH_SHORT).show()

            val uriResultat: Uri? = withContext(Dispatchers.IO) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, nomFichier)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOCUMENTS + "/Scholar/Temp")
                }

                val uri = resolver.insert(MediaStore.Files.getContentUri("external"), contentValues)

                uri?.let { targetUri ->
                    try {
                        val outputStream: OutputStream? = resolver.openOutputStream(targetUri)
                        outputStream?.use { os ->
                            val school = schoolEntity ?: EtablissementEntity(nomFr = "Scholar School", telephone1 = 0L)
                            val finalParams = params.toMutableMap()
                            student?.let { finalParams["student"] = it }
                            FinancialReportGenerator.generate(os, type, finalParams, school)
                        }
                        targetUri
                    } catch (e: Exception) {
                        Log.e("ReportsActivity", "Erreur génération", e)
                        resolver.delete(targetUri, null, null)
                        null
                    }
                }
            }

            if (uriResultat != null) {
                val intent = Intent(this@ReportsActivity, com.indiza.scholar.ui.components.PdfViewerActivity::class.java).apply {
                    setDataAndType(uriResultat, "application/pdf")
                    putExtra(Intent.EXTRA_STREAM, uriResultat)
                    flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                }
                startActivity(intent)
            } else {
                Toast.makeText(this@ReportsActivity, "Erreur de génération.", Toast.LENGTH_LONG).show()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainReportsScreen(
    scope: String,
    onScopeChange: (String) -> Unit,
    selectedScopeId: Long?,
    onScopeIdChange: (Long?) -> Unit,
    selectedPeriodeId: Long?,
    onPeriodeIdChange: (Long?) -> Unit,
    anneeId: Long,
    api: ApiService,
    onCardClick: (Int) -> Unit, 
    onBack: () -> Unit
) {
    var cycles by remember { mutableStateOf<List<com.indiza.scholar.model.CycleEntity>>(emptyList()) }
    var classes by remember { mutableStateOf<List<com.indiza.scholar.model.ClasseUiModel>>(emptyList()) }
    var salles by remember { mutableStateOf<List<com.indiza.scholar.model.SalleEntity>>(emptyList()) }
    var periodes by remember { mutableStateOf<List<com.indiza.scholar.model.PeriodeEntity>>(emptyList()) }

    LaunchedEffect(anneeId) {
        val cRes = api.getCyclesByAnnee(anneeId)
        if (cRes.isSuccessful) cycles = cRes.body() ?: emptyList()
        
        val clRes = api.getClassesWithRoomStats(anneeId)
        if (clRes.isSuccessful) classes = clRes.body() ?: emptyList()
        
        val sRes = api.getSallesByAnnee(anneeId)
        if (sRes.isSuccessful) salles = sRes.body() ?: emptyList()

        val pRes = api.getPeriodesByAnnee(anneeId)
        if (pRes.isSuccessful) periodes = pRes.body() ?: emptyList()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("États & Rapports") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            // Niveau 1 : Boutons Segmentés
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp).background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(24.dp)).padding(4.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                listOf("ALL" to "Tout", "CYCLE" to "Cycle", "CLASSE" to "Classe", "SALLE" to "Salle").forEach { (id, label) ->
                    val selected = scope == id
                    Surface(
                        modifier = Modifier.weight(1f).clickable { onScopeChange(id) },
                        color = if (selected) MaterialTheme.colorScheme.primary else Color.Transparent,
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        Text(
                            label, 
                            modifier = Modifier.padding(vertical = 10.dp), 
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            color = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }

            // Niveau 3 : Contexte Temporel
            androidx.compose.foundation.lazy.LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    FilterChip(
                        selected = selectedPeriodeId == null,
                        onClick = { onPeriodeIdChange(null) },
                        label = { Text("Année Complète") }
                    )
                }
                items(periodes) { p ->
                    FilterChip(
                        selected = selectedPeriodeId == p.idServeur,
                        onClick = { onPeriodeIdChange(p.idServeur) },
                        label = { Text(p.libellePeriodeFr) }
                    )
                }
            }

            // Niveau 2 : Chips Dynamiques
            androidx.compose.foundation.lazy.LazyRow(
                modifier = Modifier.padding(vertical = 8.dp),
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (scope == "CYCLE") {
                    items(cycles) { c ->
                        FilterChip(
                            selected = selectedScopeId == c.idServeur,
                            onClick = { onScopeIdChange(c.idServeur) },
                            label = { Text(c.libelleCycleFr) }
                        )
                    }
                } else if (scope == "CLASSE") {
                    items(classes) { c ->
                        FilterChip(
                            selected = selectedScopeId == c.idClasse,
                            onClick = { onScopeIdChange(c.idClasse) },
                            label = { Text(c.libelleClasseFr) }
                        )
                    }
                } else if (scope == "SALLE") {
                    items(salles) { s ->
                        FilterChip(
                            selected = selectedScopeId == s.idServeur,
                            onClick = { onScopeIdChange(s.idServeur) },
                            label = { Text("${s.classeLabel ?: ""} ${s.nomSalle}") }
                        )
                    }
                }
            }

            Divider()

            val cards = listOf(
                ReportCategoryData("CARD 1 : Paiements", "Reçus individuels (Inscription, Scolarité, Globaux)", Icons.Default.Receipt, 1),
                ReportCategoryData("CARD 2 : Les Bilans", "Vue comptable & Chiffre d'affaires", Icons.Default.Summarize, 2),
                ReportCategoryData("CARD 3 : Les Comparaisons", "Vue analytique & Pilotage stratégique", Icons.Default.CompareArrows, 3),
                ReportCategoryData("CARD 4 : Liste des Élèves", "Démographie & Suivi des tranches", Icons.Default.People, 4),
                ReportCategoryData("CARD 5 : Autres États", "Certificats & Documents officiels", Icons.Default.Description, 5)
            )

            LazyColumn(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(cards) { card ->
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { onCardClick(card.id) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(card.icon, null, modifier = Modifier.size(36.dp), tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(16.dp))
                            Column {
                                Text(card.name, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                Text(card.description, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Card1PaiementsScreen(
    anneeId: Long,
    api: ApiService,
    onBack: () -> Unit,
    onGenerate: (String, EleveUiModel, Map<String, Any>) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var students by remember { mutableStateOf<List<EleveUiModel>>(emptyList()) }
    var selectedStudent by remember { mutableStateOf<EleveUiModel?>(null) }
    var showBottomSheet by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(anneeId) {
        val response = api.getAllStudents(anneeId)
        if (response.isSuccessful) {
            students = response.body() ?: emptyList()
        }
    }

    val filteredStudents = students.filter {
        it.nomComplet.contains(searchQuery, ignoreCase = true) || it.matricule.contains(searchQuery, ignoreCase = true)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("CARD 1 : Paiements") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Rechercher un élève (Nom ou Matricule)") },
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Default.Search, null) }
            )
            Spacer(modifier = Modifier.height(16.dp))
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(filteredStudents) { student ->
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable {
                            selectedStudent = student
                            showBottomSheet = true
                        },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        ListItem(
                            headlineContent = { Text(student.nomComplet) },
                            supportingContent = { Text("${student.matricule} - ${student.classeLabel}") },
                            trailingContent = { Icon(Icons.Default.ChevronRight, null) }
                        )
                    }
                }
            }
        }
    }

    if (showBottomSheet && selectedStudent != null) {
        ModalBottomSheet(onDismissRequest = { showBottomSheet = false }) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(selectedStudent!!.nomComplet, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Divider()
                ReportButton("1. Reçu d'Inscription") { 
                    scope.launch {
                        val response = api.getRegistrationReceiptData(selectedStudent!!.idEleve, anneeId)
                        if (response.isSuccessful) {
                            onGenerate("Reçu d'Inscription", selectedStudent!!, mapOf("receiptData" to response.body()!!))
                        }
                    }
                }
                ReportButton("2. Reçu Frais de Scolarité") { 
                    scope.launch {
                        val response = api.getStudentPaymentDetails(selectedStudent!!.idEleve, anneeId)
                        if (response.isSuccessful) {
                            onGenerate("Reçu Frais de Scolarité", selectedStudent!!, mapOf("paymentDetails" to response.body()!!))
                        }
                    }
                }
                ReportButton("3. Reçu Global Annuel") { 
                    scope.launch {
                        val response = api.getStudentPaymentDetails(selectedStudent!!.idEleve, anneeId)
                        if (response.isSuccessful) {
                            onGenerate("Reçu Global Annuel", selectedStudent!!, mapOf("paymentDetails" to response.body()!!))
                        }
                    }
                }
                ReportButton("4. Reçu Global Total (Historique)") { onGenerate("Reçu Global Total", selectedStudent!!, emptyMap()) }
                ReportButton("5. Reçu Frais Périscolaires") { onGenerate("Reçu Frais Périscolaires", selectedStudent!!, emptyMap()) }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Card2BilansScreen(
    anneeId: Long, 
    scope: String,
    scopeId: Long?,
    api: ApiService, 
    userRole: AcademicRole, 
    onBack: () -> Unit, 
    onGenerate: (String, Map<String, Any>) -> Unit
) {
    val context = LocalContext.current
    val scopeEffect = rememberCoroutineScope()
    var selectedDate by remember { mutableStateOf(Calendar.getInstance()) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("CARD 2 : Les Bilans") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            val params = mutableMapOf<String, Any>()
            if (scope != "ALL" && scopeId != null) {
                params["scope"] = scope
                params["scopeId"] = scopeId
            }

            BilanCard("1. Bilan des Encaissements Journalier", "Activity heure par heure", Icons.Default.Today) {
                scopeEffect.launch {
                    val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(selectedDate.time)
                    val response = api.getBilanJournalier(anneeId, dateStr)
                    if (response.isSuccessful) {
                        onGenerate("Bilan Journalier", params + mapOf("data" to response.body()!!))
                    } else {
                        Toast.makeText(context, "Erreur API", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            BilanCard("2. Bilan des Encaissements Mensuel", "Chiffre d'affaires quotidien", Icons.Default.CalendarMonth) {
                scopeEffect.launch {
                    val response = api.getBilanMensuel(anneeId, selectedDate.get(Calendar.MONTH) + 1, selectedDate.get(Calendar.YEAR))
                    if (response.isSuccessful) {
                        onGenerate("Bilan Mensuel", params + mapOf("data" to response.body()!!))
                    }
                }
            }
            
            if (userRole in listOf(AcademicRole.ADMINISTRATEUR, AcademicRole.FONDATEUR, AcademicRole.INTENDANT)) {
                BilanCard("3. Bilan des Encaissements Annuel", "Ventilation sur 12 mois", Icons.Default.EventNote) {
                    scopeEffect.launch {
                        val response = api.getBilanAnnuel(anneeId)
                        if (response.isSuccessful) {
                            onGenerate("Bilan Annuel", params + mapOf("data" to response.body()!!))
                        }
                    }
                }
            }
            
            BilanCard("4. Bilan Récapitulatif par Éléments", "Par Salle, Classe, Enseignement, Cycle", Icons.Default.Category) {
                onGenerate("Bilan Récap Eléments", emptyMap())
            }
            BilanCard("5. Bilan Détaillé des Paiements", "Grand livre de caisse (Par Salle)", Icons.Default.ListAlt) {
                onGenerate("Bilan Détail Salle", emptyMap())
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Card3ComparaisonsScreen(anneeId: Long, api: ApiService, userRole: AcademicRole, onBack: () -> Unit, onGenerate: (String, Map<String, Any>) -> Unit) {
    var useProportionality by remember { mutableStateOf(false) }
    var showRemediation by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    if (userRole !in listOf(AcademicRole.FONDATEUR, AcademicRole.ADMINISTRATEUR, AcademicRole.INTENDANT)) {
        LaunchedEffect(Unit) { onBack() }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("CARD 3 : Les Comparaisons") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showRemediation = true }, containerColor = MaterialTheme.colorScheme.secondary) {
                Icon(Icons.Default.Bolt, null)
            }
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Text("Switch de Proportionnalité", fontWeight = FontWeight.Medium)
                Spacer(modifier = Modifier.weight(1f))
                Switch(checked = useProportionality, onCheckedChange = { useProportionality = it })
            }
            Divider()
            ComparisonRow("Montant Encaissé vs Échéances") { onGenerate("Comp Echéances", mapOf("prop" to useProportionality)) }
            ComparisonRow("Panier Moyen par Élève") { onGenerate("Comp Panier Moyen", mapOf("prop" to useProportionality)) }
            ComparisonRow("Structure de la Dette") { onGenerate("Comp Dette", mapOf("prop" to useProportionality)) }
            ComparisonRow("Corrélation Finance / Pédagogie") { onGenerate("Comp FinancePeda", mapOf("prop" to useProportionality)) }
            ComparisonRow("Indice de Dispersion (Id)") { onGenerate("Comp Dispersion", mapOf("prop" to useProportionality)) }
            ComparisonRow("Vitesse de Recouvrement") { onGenerate("Comp Vitesse", mapOf("prop" to useProportionality)) }
            ComparisonRow("Le Panier Moyen Réel") { onGenerate("Comp Panier Reel", mapOf("prop" to useProportionality)) }
            ComparisonRow("Fragmentation des Paiements") { onGenerate("Comp Fragmentation", mapOf("prop" to useProportionality)) }
            Divider()
            ComparisonRow("Tableau Ratio de Performance (Rp)") { 
                scope.launch {
                    val response = api.getPerformanceComparison(anneeId)
                    if (response.isSuccessful) {
                        onGenerate("Tableau Rp", mapOf("prop" to useProportionality, "data" to response.body()!!))
                    }
                }
            }
        }
    }

    if (showRemediation) {
        AlertDialog(
            onDismissRequest = { showRemediation = false },
            title = { Text("Pilotage Avancé & Remédiation") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Ratio : Salle rentable ?", fontWeight = FontWeight.Bold)
                    Button(onClick = { /* SMS Action */ }, modifier = Modifier.fillMaxWidth()) { Text("Relance Mobile (Salle)") }
                    
                    Text("Volatilité : Flux stable ?", fontWeight = FontWeight.Bold)
                    Text("Besoin Trésorerie : +12.5M", color = MaterialTheme.colorScheme.primary)
                    
                    Text("Concentration : Familles à risque ?", fontWeight = FontWeight.Bold)
                    Button(onClick = { /* List families */ }, modifier = Modifier.fillMaxWidth(), enabled = useProportionality) { Text("Extraire Familles à Risque") }
                }
            },
            confirmButton = { TextButton(onClick = { showRemediation = false }) { Text("Fermer") } }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Card4ListesScreen(
    anneeId: Long, 
    scope: String,
    scopeId: Long?,
    api: ApiService, 
    onBack: () -> Unit, 
    onGenerate: (String, Map<String, Any>) -> Unit
) {
    val scopeEffect = rememberCoroutineScope()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("CARD 4 : Liste des Élèves") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            val params = mutableMapOf<String, Any>()
            if (scope != "ALL" && scopeId != null) {
                params["scope"] = scope
                params["scopeId"] = scopeId
            }

            Text("Suivi des Tranches", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            BilanCard("Élèves Insolvables", "Filtrer par tranche & périmètre", Icons.Default.FilterList) { 
                scopeEffect.launch {
                    // Pour le test, on prend la tranche 1
                    val response = api.getInsolvablesList(anneeId, 1L, idSalle = if(scope == "SALLE") scopeId else null) 
                    if (response.isSuccessful) {
                        onGenerate("Liste Insolvables", params + mapOf("data" to response.body()!!))
                    }
                }
            }
            BilanCard("Élèves Solvables", "Liste des élèves en règle", Icons.Default.CheckCircle) { onGenerate("Liste Solvables", emptyMap()) }
            
            Divider()
            Text("Listes Administratives", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            BilanCard("Listes Nominatives", "Avec raccord parent unique", Icons.Default.AssignmentInd) { onGenerate("Liste Nominative", emptyMap()) }
            BilanCard("Bilan d'Exclusion Pédagogique", "Liste d'émargement contrôle", Icons.Default.NoAccounts) { onGenerate("Liste Exclusion", emptyMap()) }
            
            Divider()
            Text("Démographie & Statistiques", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            BilanCard("Pyramide & Histogramme des Âges", "Analyse du surâge", Icons.Default.BarChart) { onGenerate("Stats Ages", emptyMap()) }
            BilanCard("Parité Filles / Garçons", "Répartition par sexe", Icons.Default.PieChart) { onGenerate("Stats Parite", emptyMap()) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Card5AutresScreen(
    anneeId: Long,
    api: ApiService,
    onBack: () -> Unit,
    onGenerate: (String, EleveUiModel, Map<String, Any>) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var students by remember { mutableStateOf<List<EleveUiModel>>(emptyList()) }
    var selectedStudent by remember { mutableStateOf<EleveUiModel?>(null) }
    var showBottomSheet by remember { mutableStateOf(false) }

    LaunchedEffect(anneeId) {
        val response = api.getAllStudents(anneeId)
        if (response.isSuccessful) {
            students = response.body() ?: emptyList()
        }
    }

    val filteredStudents = students.filter {
        it.nomComplet.contains(searchQuery, ignoreCase = true) || it.matricule.contains(searchQuery, ignoreCase = true)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("CARD 5 : Autres États") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Sélectionner un élève") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(16.dp))
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(filteredStudents) { student ->
                    Card(modifier = Modifier.fillMaxWidth().clickable {
                        selectedStudent = student
                        showBottomSheet = true
                    }) {
                        ListItem(headlineContent = { Text(student.nomComplet) }, supportingContent = { Text(student.classeLabel) })
                    }
                }
            }
        }
    }

    if (showBottomSheet && selectedStudent != null) {
        ModalBottomSheet(onDismissRequest = { showBottomSheet = false }) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                ReportButton("Certificat de Scolarité") { onGenerate("Certificat de Scolarité", selectedStudent!!, emptyMap()) }
                ReportButton("Certificat de Promotion") { onGenerate("Certificat de Promotion", selectedStudent!!, emptyMap()) }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

data class ReportCategoryData(val name: String, val description: String, val icon: ImageVector, val id: Int)

@Composable
fun BilanCard(title: String, desc: String, icon: ImageVector, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().clickable { onClick() }) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Bold)
                Text(desc, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.Default.ChevronRight, null)
        }
    }
}

@Composable
fun ComparisonRow(title: String, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().clickable { onClick() }) {
        ListItem(
            headlineContent = { Text(title) },
            trailingContent = { Icon(Icons.Default.PieChart, null, tint = MaterialTheme.colorScheme.primary) }
        )
    }
}

@Composable
fun ReportButton(label: String, onClick: () -> Unit) {
    Button(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(8.dp)) {
        Text(label)
    }
}
