package com.indiza.scholar.ui.finance

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.PaiementPayload
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.settings.SaveState
import com.indiza.scholar.ui.student.EleveUiModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(
    idAnneeScolaire: Long,
    financeViewModel: FinanceViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val apiService = remember { 
        ApiClient.create {
            context.getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)
    }

    var searchQuery by remember { mutableStateOf("") }
    var paymentStatusFilter by remember { mutableStateOf("Tout afficher") }
    
    var allStudents by remember { mutableStateOf<List<EleveUiModel>>(emptyList()) }
    var filteredStudents by remember { mutableStateOf<List<EleveUiModel>>(emptyList()) }
    var selectedEleve by remember { mutableStateOf<EleveUiModel?>(null) }
    var isLoadingStudents by remember { mutableStateOf(false) }
    
    var showPaymentSheet by remember { mutableStateOf(false) }
    
    // Config states
    var hasExigiblesConfigured by remember { mutableStateOf(true) }
    var hasPeriscolairesConfigured by remember { mutableStateOf(true) }

    LaunchedEffect(idAnneeScolaire) {
        isLoadingStudents = true
        try {
            val response = apiService.getAllStudents(idAnneeScolaire)
            if (response.isSuccessful) {
                allStudents = response.body() ?: emptyList()
            }
            
            // On vérifie aussi si les frais sont configurés (exemple simplifié)
            val libraryResp = apiService.getFraisExigiblesLibrary()
            if (libraryResp.isSuccessful) {
                hasExigiblesConfigured = libraryResp.body()?.isNotEmpty() ?: false
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            isLoadingStudents = false
        }
    }

    LaunchedEffect(searchQuery, paymentStatusFilter, allStudents) {
        var result = allStudents
        
        if (searchQuery.isNotBlank()) {
            result = result.filter { 
                it.nomComplet.contains(searchQuery, ignoreCase = true) || 
                it.matricule.contains(searchQuery, ignoreCase = true) 
            }
        }
        
        result = when (paymentStatusFilter) {
            "Soldé" -> result.filter { it.isSolded }
            "Incomplet" -> result.filter { !it.isSolded && it.hasAnyPayment }
            "Aucun versement" -> result.filter { !it.hasAnyPayment }
            else -> result
        }
        
        filteredStudents = result
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Paiements Frais", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White) }
                },
                actions = {
                    var showMenu by remember { mutableStateOf(false) }
                    IconButton(onClick = { showMenu = true }) {
                        Icon(Icons.Default.MoreVert, null, tint = Color.White)
                    }
                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false },
                        containerColor = Color(0xFF2C3E50)
                    ) {
                        DropdownMenuItem(
                            text = { Text("Gérer Frais Exigibles", color = Color.White) },
                            onClick = { 
                                showMenu = false
                                context.startActivity(Intent(context, FinanceLibraryActivity::class.java))
                            },
                            leadingIcon = { Icon(Icons.Default.Settings, null, tint = Color(0xFF1ABC9C)) }
                        )
                        DropdownMenuItem(
                            text = { Text("Gérer Frais Périscolaires", color = Color.White) },
                            onClick = { 
                                showMenu = false
                                // TODO: Naviguer vers configuration périscolaire
                            },
                            leadingIcon = { Icon(Icons.Default.Settings, null, tint = Color(0xFF3498DB)) }
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A))
            )
        },
        floatingActionButton = {
            Column(horizontalAlignment = Alignment.End) {
                if (selectedEleve != null && !hasExigiblesConfigured) {
                    Text("Frais exigibles non configurés", color = Color.Red, fontSize = 10.sp, modifier = Modifier.padding(bottom = 4.dp))
                }
                ExtendedFloatingActionButton(
                    onClick = { if (selectedEleve != null && hasExigiblesConfigured) showPaymentSheet = true },
                    icon = { Icon(Icons.Default.Payments, null) },
                    text = { Text("Payer frais exigibles") },
                    expanded = selectedEleve != null,
                    containerColor = if (selectedEleve != null && hasExigiblesConfigured) Color(0xFF1ABC9C) else Color.Gray,
                    contentColor = Color.White,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                if (selectedEleve != null && !hasPeriscolairesConfigured) {
                    Text("Frais périscolaires non configurés", color = Color.Red, fontSize = 10.sp, modifier = Modifier.padding(bottom = 4.dp))
                }
                ExtendedFloatingActionButton(
                    onClick = { /* TODO: Périscolaire */ },
                    icon = { Icon(Icons.Default.CardGiftcard, null) },
                    text = { Text("Payer frais périscolaires") },
                    expanded = selectedEleve != null,
                    containerColor = if (selectedEleve != null && hasPeriscolairesConfigured) Color(0xFF3498DB) else Color.Gray,
                    contentColor = Color.White
                )
            }
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Rechercher un élève...") },
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Default.Search, null) },
                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
            )
            
            Spacer(modifier = Modifier.height(12.dp))

            // Groupe : Statut de Paiement
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("Tout afficher", "Soldé", "Incomplet", "Aucun versement").forEach { status ->
                    FilterChip(
                        selected = paymentStatusFilter == status,
                        onClick = { paymentStatusFilter = status },
                        label = { Text(status) },
                        colors = FilterChipDefaults.filterChipColors(
                            labelColor = Color.LightGray,
                            selectedLabelColor = Color.White,
                            selectedContainerColor = Color(0xFF1ABC9C)
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            if (isLoadingStudents) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF1ABC9C))
                }
            } else if (filteredStudents.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        if (searchQuery.isEmpty()) "Aucun élève inscrit pour cette année" else "Aucun résultat correspondant",
                        color = Color.Gray
                    )
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.weight(1f)) {
                    items(filteredStudents) { eleve ->
                        val isSelected = selectedEleve?.idEleve == eleve.idEleve
                        Card(
                            modifier = Modifier.fillMaxWidth().clickable { selectedEleve = eleve },
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected) Color(0xFF1ABC9C).copy(alpha = 0.2f) else Color(0xFF2C3E50)
                            ),
                            border = if (isSelected) BorderStroke(2.dp, Color(0xFF1ABC9C)) else null
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(eleve.nomComplet, color = Color.White, fontWeight = FontWeight.Bold)
                                    Text("${eleve.matricule} • ${eleve.classeLabel}", color = Color.LightGray, fontSize = 12.sp)
                                }
                                if (isSelected) Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF1ABC9C))
                                else Icon(Icons.Default.KeyboardArrowRight, null, tint = Color.Gray)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showPaymentSheet && selectedEleve != null) {
        PaymentBottomSheet(
            eleve = selectedEleve!!,
            idAnneeScolaire = idAnneeScolaire,
            viewModel = financeViewModel,
            onDismiss = { showPaymentSheet = false }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentBottomSheet(
    eleve: EleveUiModel,
    idAnneeScolaire: Long,
    viewModel: FinanceViewModel,
    onDismiss: () -> Unit
) {
    var montant by remember { mutableStateOf("") }
    val paymentState by viewModel.paymentState.collectAsState()
    val details by viewModel.studentPaymentDetails.collectAsState()

    LaunchedEffect(eleve.idEleve) {
        viewModel.loadStudentPaymentDetails(eleve.idEleve, idAnneeScolaire)
        viewModel.resetPaymentState()
    }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = Color(0xFF1E2A3A), contentColor = Color.White) {
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text("Paiement Frais Exigibles", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            
            // Header Info
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
                Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
                    Text(eleve.nomComplet, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(eleve.classeLabel, color = Color.LightGray, fontSize = 14.sp)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text("Déjà versé:", color = Color.Gray)
                        Text("${details?.totalDejaVerse ?: 0} CFA", color = Color(0xFF1ABC9C), fontWeight = FontWeight.Bold)
                    }
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text("Reste global:", color = Color.Gray)
                        Text("${details?.resteGlobal ?: 0} CFA", color = Color.Red, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Breakdown Table
            Text("Détail par frais (Priorité FIFO)", style = MaterialTheme.typography.titleMedium, color = Color(0xFF1ABC9C))
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
                Column(modifier = Modifier.padding(8.dp)) {
                    details?.frais?.forEach { f ->
                        Row(modifier = Modifier.padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (f.isComplet) Icons.Default.CheckCircle else Icons.Default.Pending,
                                contentDescription = null,
                                tint = if (f.isComplet) Color(0xFF2ECC71) else Color(0xFFF1C40F),
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(f.libelle, color = Color.White, modifier = Modifier.weight(1f), fontSize = 14.sp)
                            Column(horizontalAlignment = Alignment.End) {
                                Text("${f.montantPaye} / ${f.montantDu}", color = Color.LightGray, fontSize = 12.sp)
                                if (!f.isComplet && f.montantPaye > 0) {
                                    Text("Avance", color = Color(0xFFF1C40F), fontSize = 10.sp)
                                }
                            }
                        }
                        if (details?.frais?.last() != f) HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                    }
                }
            }

            OutlinedTextField(
                value = montant,
                onValueChange = { 
                    if(it.all { c -> c.isDigit() }) {
                        val m = it.toIntOrNull() ?: 0
                        if (m <= (details?.resteGlobal ?: 0)) {
                            montant = it
                        }
                    }
                },
                label = { Text("Montant du versement (CFA)") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF1ABC9C))
            )
            
            if (paymentState is SaveState.ERROR) {
                Text((paymentState as SaveState.ERROR).error, color = Color.Red, fontSize = 12.sp)
            }

            Button(
                onClick = {
                    val m = montant.toIntOrNull() ?: 0
                    if (m > 0) {
                        viewModel.effectuerPaiement(PaiementPayload(
                            idEleve = eleve.idEleve,
                            idAnneeScolaire = idAnneeScolaire,
                            idClasse = eleve.idClasse,
                            montantVerse = m
                        ))
                    }
                },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                enabled = montant.isNotBlank() && (montant.toIntOrNull() ?: 0) > 0 && paymentState !is SaveState.SAVING_REMOTE,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2ECC71))
            ) {
                if (paymentState is SaveState.SAVING_REMOTE) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                else Text("Valider le versement")
            }
            
            if (paymentState is SaveState.SUCCESS) {
                LaunchedEffect(Unit) {
                    montant = ""
                    // Success is handled by VM refreshing details via loadStudentPaymentDetails
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
