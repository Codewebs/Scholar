package com.indiza.scholar.ui.finance

import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import com.indiza.scholar.model.FraisExigibleEntity
import com.indiza.scholar.model.FraisPeriscolaireEntity
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.theme.ScholarTheme
import kotlinx.coroutines.launch

class FinanceLibraryActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val api = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)

        setContent {
            ScholarTheme {
                FinanceLibraryScreen(api) { finish() }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FinanceLibraryScreen(api: ApiService, onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Exigibles", "Périscolaires")

    var exigiblesList by remember { mutableStateOf<List<FraisExigibleEntity>>(emptyList()) }
    var periscolairesList by remember { mutableStateOf<List<FraisPeriscolaireEntity>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }

    var showAddExigibleDialog by remember { mutableStateOf(false) }
    var showAddPeriscolaireDialog by remember { mutableStateOf(false) }
    
    var editingExigible by remember { mutableStateOf<FraisExigibleEntity?>(null) }
    var editingPeriscolaire by remember { mutableStateOf<FraisPeriscolaireEntity?>(null) }

    fun refreshData() {
        isLoading = true
        scope.launch {
            try {
                if (selectedTab == 0) {
                    val resp = api.getFraisExigiblesLibrary()
                    if (resp.isSuccessful) exigiblesList = resp.body() ?: emptyList()
                } else {
                    val resp = api.getFraisPeriscolairesLibrary()
                    if (resp.isSuccessful) periscolairesList = resp.body() ?: emptyList()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Erreur: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(selectedTab) {
        refreshData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Bibliothèque des Frais", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A))
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { 
                    if (selectedTab == 0) showAddExigibleDialog = true 
                    else showAddPeriscolaireDialog = true 
                }, 
                containerColor = Color(0xFF1ABC9C)
            ) {
                Icon(Icons.Default.Add, null, tint = Color.White)
            }
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color(0xFF2C3E50),
                contentColor = Color.White,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = Color(0xFF1ABC9C)
                    )
                }
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title) }
                    )
                }
            }

            if (isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF1ABC9C))
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (selectedTab == 0) {
                        items(exigiblesList) { item ->
                            FeeItemRow(
                                title = item.fraisFr,
                                subTitle = item.fraisEn,
                                onEdit = { editingExigible = item },
                                onDelete = {
                                    scope.launch {
                                        val resp = api.deleteFraisExigible(item.idFraisExigible)
                                        if (resp.isSuccessful) refreshData()
                                        else Toast.makeText(context, "Suppression impossible (utilisé)", Toast.LENGTH_LONG).show()
                                    }
                                }
                            )
                        }
                    } else {
                        items(periscolairesList) { item ->
                            FeeItemRow(
                                title = item.libelleFr,
                                subTitle = item.libelleEn ?: "",
                                onEdit = { editingPeriscolaire = item },
                                onDelete = {
                                    scope.launch {
                                        val resp = api.deleteFraisPeriscolaire(item.idFraisActivitePeriscolaire)
                                        if (resp.isSuccessful) refreshData()
                                        else Toast.makeText(context, "Suppression impossible", Toast.LENGTH_LONG).show()
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    // Dialogs
    if (showAddExigibleDialog || editingExigible != null) {
        AddEditFeeDialog(
            initialFr = editingExigible?.fraisFr ?: "",
            initialEn = editingExigible?.fraisEn ?: "",
            onDismiss = { showAddExigibleDialog = false; editingExigible = null },
            onSave = { fr, en ->
                scope.launch {
                    val item = FraisExigibleEntity(
                        idFraisExigible = editingExigible?.idFraisExigible ?: 0,
                        fraisFr = fr,
                        fraisEn = en
                    )
                    val resp = if (editingExigible == null) api.createFraisExigible(item)
                               else api.updateFraisExigible(item.idFraisExigible, item)
                    
                    if (resp.isSuccessful) {
                        refreshData()
                        showAddExigibleDialog = false
                        editingExigible = null
                    }
                }
            }
        )
    }

    if (showAddPeriscolaireDialog || editingPeriscolaire != null) {
        AddEditFeeDialog(
            initialFr = editingPeriscolaire?.libelleFr ?: "",
            initialEn = editingPeriscolaire?.libelleEn ?: "",
            onDismiss = { showAddPeriscolaireDialog = false; editingPeriscolaire = null },
            onSave = { fr, en ->
                scope.launch {
                    val item = FraisPeriscolaireEntity(
                        idFraisActivitePeriscolaire = editingPeriscolaire?.idFraisActivitePeriscolaire ?: 0,
                        libelleFr = fr,
                        libelleEn = en
                    )
                    val resp = if (editingPeriscolaire == null) api.createFraisPeriscolaire(item)
                               else api.updateFraisPeriscolaire(item.idFraisActivitePeriscolaire, item)
                    
                    if (resp.isSuccessful) {
                        refreshData()
                        showAddPeriscolaireDialog = false
                        editingPeriscolaire = null
                    }
                }
            }
        )
    }
}

@Composable
fun FeeItemRow(title: String, subTitle: String, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, color = Color.White, fontWeight = FontWeight.Bold)
                if (subTitle.isNotBlank()) Text(subTitle, color = Color.Gray, fontSize = 12.sp)
            }
            IconButton(onClick = onEdit) { Icon(Icons.Default.Edit, null, tint = Color(0xFF3498DB)) }
            IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, null, tint = Color(0xFFE74C3C)) }
        }
    }
}

@Composable
fun AddEditFeeDialog(initialFr: String, initialEn: String, onDismiss: () -> Unit, onSave: (String, String) -> Unit) {
    var fr by remember { mutableStateOf(initialFr) }
    var en by remember { mutableStateOf(initialEn) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Configuration du Frais") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = fr, onValueChange = { fr = it }, label = { Text("Libellé (Fr)") })
                OutlinedTextField(value = en, onValueChange = { en = it }, label = { Text("Libellé (En)") })
            }
        },
        confirmButton = {
            Button(onClick = { onSave(fr, en) }, enabled = fr.isNotBlank()) { Text("Enregistrer") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Annuler") }
        }
    )
}
