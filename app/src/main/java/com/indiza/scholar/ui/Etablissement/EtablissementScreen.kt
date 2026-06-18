package com.indiza.scholar.ui.Etablissement

import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.indiza.scholar.model.AcademicPermission
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.model.EtablissementEntity

import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import com.indiza.scholar.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EtablissementScreen(
    viewModel: EtablissementViewModel,
    onBackClick: () -> Unit
) {
    val etablissementState by viewModel.etablissement.collectAsState()
    var showEditSheet by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val userRole = remember {
        val prefs = context.getSharedPreferences("user_session", Context.MODE_PRIVATE)
        AcademicRole.fromName(prefs.getString("role", null))
    }
    
    val schoolId = remember {
        context.getSharedPreferences("app_config", Context.MODE_PRIVATE).getLong("school_id", 0L)
    }

    LaunchedEffect(schoolId) {
        if (schoolId > 0L) {
            viewModel.loadSchool(schoolId)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.etablissement_label)) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = stringResource(R.string.retour))
                    }
                },
                actions = {
                    if (userRole.permissions.contains(AcademicPermission.EDIT_SCHOOL_INFO)) {
                        IconButton(onClick = { showEditSheet = true }) {
                            Icon(Icons.Default.Edit, contentDescription = stringResource(R.string.modifier))
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            etablissementState?.let { info ->
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    if (!info.logo.isNullOrBlank()) {
                        AsyncImage(
                            model = info.logo,
                            contentDescription = stringResource(R.string.logo),
                            modifier = Modifier.size(100.dp).clip(CircleShape).border(2.dp, MaterialTheme.colorScheme.primary, CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Icon(Icons.Default.Business, contentDescription = null, modifier = Modifier.size(100.dp), tint = Color.LightGray)
                    }
                }
                InfoCard(label = stringResource(R.string.nom_lv1), value = info.nomFr)
                InfoCard(label = stringResource(R.string.nom_lv2), value = info.nomEn ?: "-")
                InfoCard(label = stringResource(R.string.abreviation), value = info.abreviation ?: "-")
                InfoCard(label = stringResource(R.string.devise_monnaie), value = info.devise ?: "-")
                InfoCard(label = stringResource(R.string.motto_lv1), value = info.deviseFr ?: "-")
                InfoCard(label = stringResource(R.string.motto_lv2), value = info.deviseEn ?: "-")
                InfoCard(label = stringResource(R.string.arrete), value = info.arrete ?: "-")
                InfoCard(label = stringResource(R.string.telephone), value = info.telephone1.toString())
                InfoCard(label = stringResource(R.string.adresse), value = info.adresse ?: "-")
                InfoCard(label = stringResource(R.string.ville), value = info.ville ?: "-")
                InfoCard(label = stringResource(R.string.email), value = info.email ?: "-")
            } ?: Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
    }

    if (showEditSheet) {
        EtablissementBottomSheet(
            viewModel = viewModel,
            userRole = userRole,
            onDismiss = { showEditSheet = false }
        )
    }
}

@Composable
fun RequiredLabel(text: String) {
    Text(buildAnnotatedString {
        append(text)
        withStyle(style = SpanStyle(color = Color.Red)) {
            append(" *")
        }
    })
}

@Composable
fun InfoCard(label: String, value: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            Text(text = value, style = MaterialTheme.typography.bodyLarge)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EtablissementBottomSheet(
    viewModel: EtablissementViewModel,
    userRole: AcademicRole,
    onDismiss: () -> Unit
) {
    val etablissementState by viewModel.etablissement.collectAsState()
    val isUploading by viewModel.uploading.collectAsState()
    val context = LocalContext.current
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    
    val canEdit = userRole.permissions.contains(AcademicPermission.EDIT_SCHOOL_INFO)
    val canView = userRole.permissions.contains(AcademicPermission.DASHBOARD_ETABLISSEMENT) || canEdit

    if (!canView) {
        LaunchedEffect(Unit) { onDismiss() }
        return
    }

    // État local pour l'édition
    var info by remember { mutableStateOf(etablissementState ?: EtablissementEntity(nomFr = "", telephone1 = 0L)) }
    
    // Pour détecter les changements (Utilisation d'une comparaison détaillée pour éviter les problèmes d'objets)
    val hasChanged = remember(info, etablissementState) {
        if (etablissementState == null) true 
        else {
            val changed = info.nomFr != etablissementState?.nomFr ||
                    info.nomEn != etablissementState?.nomEn ||
                    info.abreviation != etablissementState?.abreviation ||
                    info.devise != etablissementState?.devise ||
                    info.deviseFr != etablissementState?.deviseFr ||
                    info.deviseEn != etablissementState?.deviseEn ||
                    info.arrete != etablissementState?.arrete ||
                    info.telephone1 != etablissementState?.telephone1 ||
                    info.logo != etablissementState?.logo ||
                    info.adresse != etablissementState?.adresse ||
                    info.ville != etablissementState?.ville ||
                    info.email != etablissementState?.email ||
                    info.siteWeb != etablissementState?.siteWeb ||
                    info.numBp != etablissementState?.numBp
            
            Log.d("EtabBottomSheet", "hasChanged: $changed (info vs state)")
            changed
        }
    }
    
    val isFormValid = remember(info) {
        val valid = info.nomFr.isNotBlank() && 
                    info.telephone1 > 0L
        
        Log.d("EtabBottomSheet", "isFormValid: $valid (nomFr: '${info.nomFr}', telephone1: ${info.telephone1})")
        valid
    }
    
    LaunchedEffect(etablissementState) {
        etablissementState?.let { info = it }
    }

    val launcher = rememberLauncherForActivityResult(contract = ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            viewModel.uploadLogo(it, context) { newLogoPath ->
                if (newLogoPath != null) {
                    info = info.copy(logo = newLogoPath)
                }
            }
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Business, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (canEdit) stringResource(R.string.configuration_ecole) else stringResource(R.string.informations_ecole),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
            }

            // Logo Selection
            Box(
                modifier = Modifier.fillMaxWidth().height(120.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier.size(100.dp).clip(CircleShape).background(Color.LightGray.copy(alpha = 0.3f))
                        .clickable(enabled = canEdit && !isUploading) { launcher.launch("image/*") },
                    contentAlignment = Alignment.Center
                ) {
                    if (!info.logo.isNullOrBlank()) {
                        AsyncImage(
                            model = info.logo,
                            contentDescription = stringResource(R.string.logo),
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    }
                    if (canEdit && !isUploading) {
                        Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.2f)), contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.AddAPhoto, contentDescription = null, tint = Color.White)
                        }
                    }
                    if (isUploading) {
                        CircularProgressIndicator(modifier = Modifier.size(32.dp))
                    }
                }
            }

            OutlinedTextField(
                value = info.nomFr,
                onValueChange = { if(canEdit) info = info.copy(nomFr = it) },
                label = { RequiredLabel(stringResource(R.string.nom_etablissement_lv1)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                readOnly = !canEdit
            )

            OutlinedTextField(
                value = info.nomEn ?: "",
                onValueChange = { if(canEdit) info = info.copy(nomEn = it) },
                label = { Text(stringResource(R.string.nom_etablissement_lv2)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                readOnly = !canEdit
            )

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = info.abreviation ?: "",
                    onValueChange = { if(canEdit) info = info.copy(abreviation = it) },
                    label = { Text(stringResource(R.string.abreviation)) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    readOnly = !canEdit
                )
                OutlinedTextField(
                    value = info.devise ?: "",
                    onValueChange = { if(canEdit) info = info.copy(devise = it) },
                    label = { Text(stringResource(R.string.devise_monnaie)) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    readOnly = !canEdit
                )
            }

            OutlinedTextField(
                value = info.deviseFr ?: "",
                onValueChange = { if(canEdit) info = info.copy(deviseFr = it) },
                label = { Text(stringResource(R.string.devise_lv1_motto)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                readOnly = !canEdit
            )

            OutlinedTextField(
                value = info.deviseEn ?: "",
                onValueChange = { if(canEdit) info = info.copy(deviseEn = it) },
                label = { Text(stringResource(R.string.devise_lv2_motto)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                readOnly = !canEdit
            )

            OutlinedTextField(
                value = info.description ?: "",
                onValueChange = { if(canEdit) info = info.copy(description = it) },
                label = { Text(stringResource(R.string.description)) },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
                readOnly = !canEdit
            )

            OutlinedTextField(
                value = info.arrete ?: "",
                onValueChange = { if(canEdit) info = info.copy(arrete = it) },
                label = { Text(stringResource(R.string.arrete_de_creation)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                readOnly = !canEdit
            )

            OutlinedTextField(
                value = info.telephone1.let { if (it == 0L) "" else it.toString() },
                onValueChange = { if(canEdit) info = info.copy(telephone1 = it.toLongOrNull() ?: 0L) },
                label = { RequiredLabel(stringResource(R.string.telephone_principal)) },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                singleLine = true,
                readOnly = !canEdit
            )

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = info.telephone2?.let { if (it == 0L) "" else it.toString() } ?: "",
                    onValueChange = { if(canEdit) info = info.copy(telephone2 = it.toLongOrNull() ?: 0L) },
                    label = { Text(stringResource(R.string.telephone_2)) },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    readOnly = !canEdit
                )
                OutlinedTextField(
                    value = info.telephone3?.let { if (it == 0L) "" else it.toString() } ?: "",
                    onValueChange = { if(canEdit) info = info.copy(telephone3 = it.toLongOrNull() ?: 0L) },
                    label = { Text(stringResource(R.string.telephone_3)) },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    readOnly = !canEdit
                )
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = info.fax?.let { if (it == 0L) "" else it.toString() } ?: "",
                    onValueChange = { if(canEdit) info = info.copy(fax = it.toLongOrNull() ?: 0L) },
                    label = { Text(stringResource(R.string.fax)) },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    readOnly = !canEdit
                )
                OutlinedTextField(
                    value = info.sise ?: "",
                    onValueChange = { if(canEdit) info = info.copy(sise = it) },
                    label = { Text(stringResource(R.string.sise)) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    readOnly = !canEdit
                )
            }

            OutlinedTextField(
                value = info.adresse ?: "",
                onValueChange = { if(canEdit) info = info.copy(adresse = it) },
                label = { Text(stringResource(R.string.adresse_physique)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                readOnly = !canEdit
            )

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = info.ville ?: "",
                    onValueChange = { if(canEdit) info = info.copy(ville = it) },
                    label = { Text(stringResource(R.string.ville)) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    readOnly = !canEdit
                )
                OutlinedTextField(
                    value = info.numBp?.toString() ?: "",
                    onValueChange = { if(canEdit) info = info.copy(numBp = it.toIntOrNull()) },
                    label = { Text(stringResource(R.string.bp)) },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    readOnly = !canEdit
                )
            }

            OutlinedTextField(
                value = info.email ?: "",
                onValueChange = { if(canEdit) info = info.copy(email = it) },
                label = { Text(stringResource(R.string.email)) },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
                readOnly = !canEdit
            )

            OutlinedTextField(
                value = info.siteWeb ?: "",
                onValueChange = { if(canEdit) info = info.copy(siteWeb = it) },
                label = { Text(stringResource(R.string.site_web)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                readOnly = !canEdit
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (canEdit) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(stringResource(R.string.annuler))
                    }
                    
                    Button(
                        onClick = {
                            viewModel.updateEtablissement(info)
                            onDismiss()
                        },
                        enabled = isFormValid && !isUploading && hasChanged,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text(if (etablissementState == null) stringResource(R.string.creer) else stringResource(R.string.mettre_a_jour))
                    }
                }
            } else {
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(stringResource(R.string.fermer))
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
