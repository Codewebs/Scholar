package com.indiza.scholar.ui.finance

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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.ClasseUiModel
import com.indiza.scholar.model.FraisStatItem
import com.indiza.scholar.ui.student.ClasseManagementViewModel
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer

import com.indiza.scholar.model.FraisExigibleEntity
import com.indiza.scholar.model.SaveTarifsPayload
import com.indiza.scholar.model.TarifItemPayload
import com.indiza.scholar.model.BulkApplyPayload
import com.indiza.scholar.model.ClasseApplication
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType

import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import com.indiza.scholar.model.FraisPeriscolaireEntity

@Composable
fun FeesManagementView(idAnneeScolaire: Long, viewModel: ClasseManagementViewModel) {
    val classes by viewModel.classes.collectAsState()
    var selectedClasse by remember { mutableStateOf<ClasseUiModel?>(null) }
    var showLibrary by remember { mutableStateOf(false) }

    if (showLibrary) {
        GlobalFeesLibraryScreen(viewModel) { showLibrary = false }
    } else if (selectedClasse == null) {
        Column(modifier = Modifier.fillMaxSize().background(Color(0xFF1E2A3A)).padding(16.dp)) {
            Button(
                onClick = { showLibrary = true },
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3498DB))
            ) {
                Icon(Icons.Default.Settings, null)
                Spacer(Modifier.width(8.dp))
                Text("Gérer les Bibliothèques des Frais")
            }

            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(classes) { classe ->
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { selectedClasse = classe },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(classe.libelleClasseFr, color = Color.White, fontWeight = FontWeight.Bold)
                                    if (classe.hasFees) {
                                        Spacer(Modifier.width(8.dp))
                                        Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF2ECC71), modifier = Modifier.size(16.dp))
                                    }
                                }
                                if (classe.totalCapacity > 0) {
                                    Text("Recouvrement: ${if(classe.totalEnrolled > 0) "..." else "0%"}", color = Color(0xFF1ABC9C), fontSize = 12.sp)
                                }
                            }
                            if (!classe.hasFees) {
                                Icon(Icons.Default.Warning, null, tint = Color.Yellow, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                            }
                            Icon(Icons.Default.KeyboardArrowRight, contentDescription = null, tint = Color.Gray)
                        }
                    }
                }
            }
        }
    } else {
        FeeDetailsScreen(idAnneeScolaire, selectedClasse!!, viewModel) { selectedClasse = null }
    }
}

@Composable
fun FeeDetailsScreen(idAnneeScolaire: Long, classe: ClasseUiModel, viewModel: ClasseManagementViewModel, onBack: () -> Unit) {
    val statsResponse by viewModel.recouvrementStats.collectAsState()
    val library by viewModel.fraisLibrary.collectAsState()
    var isLoading by remember { mutableStateOf(false) }
    var isEditing by remember { mutableStateOf(false) }
    
    var selectedFraisForBulk by remember { mutableStateOf<FraisStatItem?>(null) }

    LaunchedEffect(classe.idClasse) {
        isLoading = true
        viewModel.loadRecouvrementStats(classe.idClasse, idAnneeScolaire)
        viewModel.loadFraisLibrary()
        isLoading = false
    }

    if (isEditing) {
        EditFeesScreen(idAnneeScolaire, classe, viewModel) { isEditing = false }
    } else {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 16.dp)) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White) }
                Text("Tarifs: ${classe.libelleClasseFr}", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                IconButton(onClick = { isEditing = true }) { Icon(Icons.Default.Edit, null, tint = Color(0xFF1ABC9C)) }
            }

            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally), color = Color(0xFF1ABC9C))
            } else {
                val stats = statsResponse?.stats ?: emptyList()
                if (stats.isEmpty() && !isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Aucun frais configuré.", color = Color.Gray)
                            Button(onClick = { isEditing = true }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))) {
                                Text("Configurer maintenant")
                            }
                        }
                    }
                }
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(stats) { item ->
                        Box(modifier = Modifier.pointerInput(Unit) {
                            detectTapGestures(onLongPress = { selectedFraisForBulk = item })
                        }) {
                            FeeStatCard(item)
                        }
                    }
                }
            }
        }
    }

    if (selectedFraisForBulk != null) {
        // Obtenir les infos techniques du frais depuis la library
        val fullFrais = library.find { it.fraisFr == selectedFraisForBulk!!.libelle }
        if (fullFrais != null) {
            BulkApplyBottomSheet(
                idFrais = fullFrais.idFraisExigible,
                libelle = fullFrais.fraisFr,
                montant = selectedFraisForBulk!!.montantUnitaire,
                idAnneeScolaire = idAnneeScolaire,
                viewModel = viewModel,
                onDismiss = { selectedFraisForBulk = null }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BulkApplyBottomSheet(
    idFrais: Long,
    libelle: String,
    montant: Int,
    idAnneeScolaire: Long,
    viewModel: ClasseManagementViewModel,
    onDismiss: () -> Unit
) {
    val missingClasses by viewModel.missingClasses.collectAsState()
    val selectedClasses = remember { mutableStateListOf<Long>() }
    val classOrders = remember { mutableStateMapOf<Long, Int>() }

    LaunchedEffect(idFrais) {
        viewModel.loadClassesMissingFrais(idFrais, idAnneeScolaire)
    }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = Color(0xFF1E2A3A), contentColor = Color.White) {
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
            Text("Appliquer '$libelle' à d'autres classes", style = MaterialTheme.typography.titleLarge)
            Text("Montant: $montant CFA", color = Color.Gray, fontSize = 14.sp)
            
            Spacer(Modifier.height(16.dp))
            
            if (missingClasses.isEmpty()) {
                Text("Toutes les classes ont déjà ce frais.", modifier = Modifier.padding(vertical = 32.dp).align(Alignment.CenterHorizontally))
            } else {
                LazyColumn(modifier = Modifier.weight(1f, fill = false).heightIn(max = 400.dp)) {
                    items(missingClasses) { item ->
                        val isSelected = selectedClasses.contains(item.idClasse)
                        val currentOrder = classOrders[item.idClasse] ?: (item.currentFrais.size + 1)
                        
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable { 
                                if(isSelected) selectedClasses.remove(item.idClasse) else selectedClasses.add(item.idClasse)
                            },
                            colors = CardDefaults.cardColors(containerColor = if(isSelected) Color(0xFF1ABC9C).copy(alpha = 0.2f) else Color(0xFF2C3E50))
                        ) {
                            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(checked = isSelected, onCheckedChange = { 
                                    if(it) selectedClasses.add(item.idClasse) else selectedClasses.remove(item.idClasse)
                                })
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.libelleClasse, fontWeight = FontWeight.Bold)
                                    Text("${item.currentFrais.size} frais existants", fontSize = 11.sp, color = Color.Gray)
                                }
                                
                                // Ordre Control
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    IconButton(onClick = { 
                                        val newO = (currentOrder - 1).coerceAtLeast(1)
                                        classOrders[item.idClasse] = newO
                                    }, enabled = isSelected && currentOrder > 1) { 
                                        Icon(Icons.Default.ArrowUpward, null, modifier = Modifier.size(16.dp)) 
                                    }
                                    Text(currentOrder.toString(), fontWeight = FontWeight.Bold, color = Color(0xFF1ABC9C))
                                    IconButton(onClick = { 
                                        val newO = currentOrder + 1
                                        classOrders[item.idClasse] = newO
                                    }, enabled = isSelected) { 
                                        Icon(Icons.Default.ArrowDownward, null, modifier = Modifier.size(16.dp)) 
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(24.dp))
            
            Button(
                onClick = {
                    val apps = selectedClasses.map { id ->
                        ClasseApplication(id, classOrders[id] ?: (missingClasses.find { it.idClasse == id }?.currentFrais?.size ?: 0) + 1)
                    }
                    viewModel.bulkApplyTarif(BulkApplyPayload(
                        idFrais = idFrais,
                        idAnneeScolaire = idAnneeScolaire,
                        montant = montant,
                        dateLimite = "2024-12-31", // Default, could be picked
                        dateAlerte = "2024-11-30",
                        applications = apps
                    )) { onDismiss() }
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                enabled = selectedClasses.isNotEmpty(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2ECC71))
            ) {
                Text("Appliquer à ${selectedClasses.size} classes")
            }
            
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
fun EditFeesScreen(idAnneeScolaire: Long, classe: ClasseUiModel, viewModel: ClasseManagementViewModel, onCancel: () -> Unit) {
    val library by viewModel.fraisLibrary.collectAsState()
    val currentTarifs by viewModel.currentClassTarifs.collectAsState()
    
    // local editing state
    val selectedTarifs = remember { mutableStateListOf<TarifItemPayload>() }
    var showAddFraisDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadFraisLibrary()
        viewModel.loadTarifsByClasse(classe.idClasse, idAnneeScolaire)
    }

    LaunchedEffect(currentTarifs) {
        selectedTarifs.clear()
        selectedTarifs.addAll(currentTarifs.map { 
            TarifItemPayload(it.idFraisExigible, it.montantFraisExigible, it.ordrePaiement, it.dateLimite, it.dateAlerte)
        })
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onCancel) { Icon(Icons.Default.Close, null, tint = Color.White) }
            Text("Configuration des frais", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        }

        LazyColumn(modifier = Modifier.weight(1f).padding(vertical = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(selectedTarifs) { item ->
                val fraisName = library.find { it.idFraisExigible == item.idFrais }?.fraisFr ?: "Frais inconnu"
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF34495E))) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                            Text(fraisName, color = Color.White, fontWeight = FontWeight.Bold)
                            IconButton(onClick = { selectedTarifs.remove(item) }, modifier = Modifier.size(24.dp)) { 
                                Icon(Icons.Default.Delete, null, tint = Color.Red, modifier = Modifier.size(16.dp)) 
                            }
                        }
                        OutlinedTextField(
                            value = item.montant.toString(),
                            onValueChange = { val m = it.toIntOrNull() ?: 0; val idx = selectedTarifs.indexOf(item); if(idx != -1) selectedTarifs[idx] = item.copy(montant = m) },
                            label = { Text("Montant (CFA)") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = item.dateLimite,
                                onValueChange = { val idx = selectedTarifs.indexOf(item); if(idx != -1) selectedTarifs[idx] = item.copy(dateLimite = it) },
                                label = { Text("Date Limite") },
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = item.ordre.toString(),
                                onValueChange = { val o = it.toIntOrNull() ?: 1; val idx = selectedTarifs.indexOf(item); if(idx != -1) selectedTarifs[idx] = item.copy(ordre = o) },
                                label = { Text("Ordre") },
                                modifier = Modifier.width(60.dp),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                            )
                        }
                    }
                }
            }
            item {
                Button(
                    onClick = { showAddFraisDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF34495E))
                ) {
                    Icon(Icons.Default.Add, null)
                    Text("Ajouter un type de frais")
                }
            }
        }

        Button(
            onClick = {
                viewModel.saveClassTarifs(SaveTarifsPayload(classe.idClasse, idAnneeScolaire, selectedTarifs.toList())) {
                    onCancel()
                }
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2ECC71))
        ) {
            Text("Enregistrer la configuration")
        }
    }

    if (showAddFraisDialog) {
        AlertDialog(
            onDismissRequest = { showAddFraisDialog = false },
            title = { Text("Sélectionner le type de frais") },
            text = {
                LazyColumn {
                    items(library.filter { lib -> !selectedTarifs.any { it.idFrais == lib.idFraisExigible } }) { lib ->
                        Text(lib.fraisFr, modifier = Modifier.fillMaxWidth().clickable {
                            selectedTarifs.add(TarifItemPayload(lib.idFraisExigible, 0, selectedTarifs.size + 1, "2024-12-31", "2024-11-30"))
                            showAddFraisDialog = false
                        }.padding(16.dp))
                    }
                }
            },
            confirmButton = {}
        )
    }
}

@Composable
fun GlobalFeesLibraryScreen(viewModel: ClasseManagementViewModel, onBack: () -> Unit) {
    val library by viewModel.fraisLibrary.collectAsState()
    val periLibrary by viewModel.periscolaireLibrary.collectAsState()
    
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Exigibles", "Périscolaires")

    var showAddDialog by remember { mutableStateOf(false) }
    var newFraisFr by remember { mutableStateOf("") }
    var newFraisEn by remember { mutableStateOf("") }

    LaunchedEffect(selectedTab) { 
        if (selectedTab == 0) viewModel.loadFraisLibrary() 
        else viewModel.loadPeriscolaireLibrary()
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFF1E2A3A))) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(16.dp)) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White) }
            Text("Bibliothèques des Frais", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        }

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

        LazyColumn(modifier = Modifier.weight(1f).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            val list = if (selectedTab == 0) library else periLibrary.map { FraisExigibleEntity(it.idFraisActivitePeriscolaire, it.libelleFr, it.libelleEn ?: "") }
            
            items(list) { frais ->
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(frais.fraisFr, color = Color.White, fontWeight = FontWeight.Bold)
                            Text(frais.fraisEn, color = Color.Gray, fontSize = 12.sp)
                        }
                        IconButton(onClick = { 
                            if (selectedTab == 0) viewModel.deleteLibraryFrais(frais.idFraisExigible)
                            else viewModel.deletePeriscolaireLibraryFrais(frais.idFraisExigible)
                        }) { Icon(Icons.Default.Delete, null, tint = Color.Red) }
                    }
                }
            }
        }

        Button(
            onClick = { showAddDialog = true },
            modifier = Modifier.fillMaxWidth().padding(16.dp).height(50.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
        ) {
            Icon(Icons.Default.Add, null)
            Text(if (selectedTab == 0) "Nouveau type de frais" else "Nouvelle activité")
        }
    }

    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text(if (selectedTab == 0) "Ajouter un type de frais" else "Ajouter une activité") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = newFraisFr, onValueChange = { newFraisFr = it }, label = { Text("Nom (FR)") })
                    OutlinedTextField(value = newFraisEn, onValueChange = { newFraisEn = it }, label = { Text("Nom (EN)") })
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (selectedTab == 0) {
                        viewModel.createLibraryFrais(FraisExigibleEntity(fraisFr = newFraisFr, fraisEn = newFraisEn))
                    } else {
                        viewModel.createPeriscolaireLibraryFrais(FraisPeriscolaireEntity(libelleFr = newFraisFr, libelleEn = newFraisEn))
                    }
                    showAddDialog = false
                    newFraisFr = ""
                    newFraisEn = ""
                }) { Text("Ajouter") }
            }
        )
    }
}

@Composable
fun FeeStatCard(item: FraisStatItem) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF34495E))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Text(item.libelle, color = Color.White, fontWeight = FontWeight.Medium)
                Text("${item.encaisse} / ${item.attendu} CFA", color = Color.LightGray, fontSize = 12.sp)
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Jauge horizontale
            Box(modifier = Modifier.fillMaxWidth().height(12.dp).clip(RoundedCornerShape(6.dp)).background(Color.DarkGray)) {
                Box(modifier = Modifier
                    .fillMaxWidth(item.pourcentage.coerceIn(0f, 1f))
                    .fillMaxHeight()
                    .background(if (item.pourcentage >= 1f) Color(0xFF2ECC71) else Color(0xFF1ABC9C))
                )
            }
            
            Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth().padding(top = 4.dp)) {
                Text("${(item.pourcentage * 100).toInt()}%", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
