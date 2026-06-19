package com.indiza.scholar.ui.student

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import android.widget.Toast
import android.content.Intent
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Class
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.ExposedDropdownMenuDefaults.textFieldColors
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.StudentRegistrationPayload
import com.indiza.scholar.ui.salle.SalleManagementActivity
import com.indiza.scholar.ui.settings.SaveState
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@RequiresApi(Build.VERSION_CODES.O)
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EnrollStudentBottomSheet(
    idAnneeScolaire: Long,
    idSalleInitiale: Long,
    viewModel: StudentManagementViewModel,
    studentToEdit: com.indiza.scholar.ui.student.EleveUiModel? = null,
    onDismiss: () -> Unit
) {
    val registrationState by viewModel.registrationState.collectAsState()
    val sallesDisponibles by viewModel.sallesDisponibles.collectAsState()
    val hasClasses by viewModel.hasClasses.collectAsState()
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val context = LocalContext.current

    // État des champs
    var matricule by remember { mutableStateOf(studentToEdit?.matricule ?: "") }
    var nom by remember { mutableStateOf(studentToEdit?.nom ?: "") }
    var prenom by remember { mutableStateOf(studentToEdit?.prenom ?: "") }
    var dateNaissance by remember { mutableStateOf(studentToEdit?.dateNaissance ?: "2010-01-01") }
    var lieuNaissance by remember { mutableStateOf(studentToEdit?.lieuNaissance ?: "") }
    var sexe by remember { mutableStateOf(studentToEdit?.sexe ?: "M") }
    var quartier by remember { mutableStateOf(studentToEdit?.quartier ?: "") }

    var nomPere by remember { mutableStateOf(studentToEdit?.nomPere ?: "") }
    var telephonePere by remember { mutableStateOf(studentToEdit?.telephonePere?.toString() ?: "") }
    var nomMere by remember { mutableStateOf(studentToEdit?.nomMere ?: "") }
    var telephoneMere by remember { mutableStateOf(studentToEdit?.telephoneMere?.toString() ?: "") }
    var nomTuteur by remember { mutableStateOf(studentToEdit?.nomTuteur ?: "") }
    var telephoneTuteur by remember { mutableStateOf(studentToEdit?.telephoneTuteur?.toString() ?: "") }

    // Nouveaux champs pour le bloc parent direct
    var parentType by remember { mutableStateOf("Tuteur") } // Pere, Mere, Tuteur
    var parentDirectNom by remember { mutableStateOf("") }
    var parentDirectTel by remember { mutableStateOf("") }

    var ancienEtablissement by remember { mutableStateOf(studentToEdit?.ancienEtablissement ?: "") }

    // Sélection de la salle
    var selectedSalleId by remember { mutableLongStateOf(studentToEdit?.idSalle ?: idSalleInitiale) }
    val initialSalleId = remember { studentToEdit?.idSalle ?: idSalleInitiale }

    LaunchedEffect(studentToEdit) {
        if (studentToEdit != null) {
            // Logic to determine parentType
            if (studentToEdit.nomPere != null) {
                parentType = "Père"; parentDirectNom = studentToEdit.nomPere; parentDirectTel = studentToEdit.telephonePere?.toString() ?: ""
            } else if (studentToEdit.nomMere != null) {
                parentType = "Mère"; parentDirectNom = studentToEdit.nomMere; parentDirectTel = studentToEdit.telephoneMere?.toString() ?: ""
            } else {
                parentType = "Tuteur"; parentDirectNom = studentToEdit.nomTuteur ?: ""; parentDirectTel = studentToEdit.telephoneTuteur?.toString() ?: ""
            }
        }
    }

    LaunchedEffect(idAnneeScolaire) {
        viewModel.chargerSallesParAnnee(idAnneeScolaire)
    }

    // Vérification de la disponibilité des salles
    LaunchedEffect(sallesDisponibles) {
        if (sallesDisponibles.isEmpty() && registrationState == SaveState.IDLE) {
            // Optionnel : on pourrait forcer la redirection ou juste informer
        }
    }
    @Composable
    fun LabelWithAsterisk(label: String) {
        Text(buildAnnotatedString {
            append(label)
            withStyle(style = SpanStyle(color = Color.Red)) {
                append(" *")
            }
        })
    }

    @Composable
    fun SectionTitle(title: String) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelMedium,
            color = Color(0xFF1ABC9C),
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = 8.dp)
        )
    }

    @Composable
    fun RadioButtonGroup(
        label: String,
        value: String,
        selectedValue: String,
        onSelected: (String) -> Unit
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            RadioButton(
                selected = selectedValue == value,
                onClick = { onSelected(value) },
                colors = RadioButtonDefaults.colors(selectedColor = Color(0xFF1ABC9C))
            )
            Text(
                label,
                modifier = Modifier.padding(start = 4.dp),
                color = Color.Black,
                fontSize = 14.sp
            )
        }
    }

    @Composable
    fun DatePickerField(
        value: String,
        onDateSelected: (String) -> Unit,
        label: @Composable () -> Unit,
        isError: Boolean = false,
        supportingText: @Composable (() -> Unit)? = null
    ) {
        var showDialog by remember { mutableStateOf(false) }
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = try {
                LocalDate.parse(value).atStartOfDay(ZoneId.systemDefault()).toInstant()
                    .toEpochMilli()
            } catch (e: Exception) {
                System.currentTimeMillis()
            }
        )

        OutlinedTextField(
            value = value,
            onValueChange = {},
            readOnly = true,
            label = label,
            modifier = Modifier.fillMaxWidth().clickable { showDialog = true },
            trailingIcon = {
                IconButton(onClick = { showDialog = true }) {
                    Icon(Icons.Default.DateRange, contentDescription = "Choisir une date")
                }
            },
            isError = isError,
            supportingText = supportingText,
            colors = textFieldColors(),
            enabled = true
        )

        if (showDialog) {
            DatePickerDialog(
                onDismissRequest = { showDialog = false },
                confirmButton = {
                    TextButton(onClick = {
                        datePickerState.selectedDateMillis?.let {
                            val date = Instant.ofEpochMilli(it).atZone(ZoneId.systemDefault())
                                .toLocalDate()
                            onDateSelected(date.format(DateTimeFormatter.ISO_LOCAL_DATE))
                        }
                        showDialog = false
                    }) { Text("OK") }
                },
                dismissButton = {
                    TextButton(onClick = { showDialog = false }) { Text("Annuler") }
                }
            ) {
                DatePicker(state = datePickerState)
            }
        }
    }

    @Composable
    fun textFieldColors() = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = Color(0xFF1ABC9C),
        unfocusedBorderColor = Color.Gray,
        focusedLabelColor = Color(0xFF1ABC9C),
        cursorColor = Color(0xFF1ABC9C),
        errorBorderColor = Color.Red
    )

    // États d'erreurs locales pour la validation du formulaire
    var errors by remember { mutableStateOf<Map<String, String>>(emptyMap()) }

    fun validate(): Boolean {
        val newErrors = mutableMapOf<String, String>()
        if (nom.isBlank()) newErrors["nom"] = "Champ obligatoire"
        if (dateNaissance.isBlank()) newErrors["date"] = "Champ obligatoire"
        if (lieuNaissance.isBlank()) newErrors["lieu"] = "Champ obligatoire"
        if (parentDirectNom.isBlank()) newErrors["parentNom"] = "Nom du parent obligatoire"
        if (parentDirectTel.isBlank()) newErrors["parentTel"] = "Téléphone du parent obligatoire"

        if (idAnneeScolaire <= 0) {
            Toast.makeText(
                context,
                "Erreur : L'année scolaire n'est pas valide côté serveur.",
                Toast.LENGTH_LONG
            ).show()
            return false
        }
        if (selectedSalleId <= 0) {
            Toast.makeText(context, "Erreur : Aucune salle sélectionnée.", Toast.LENGTH_LONG).show()
            return false
        }

        errors = newErrors
        return newErrors.isEmpty()
    }

    ModalBottomSheet(
        onDismissRequest = {
            viewModel.resetRegistrationState()
            onDismiss()
        },
        sheetState = sheetState,
        containerColor = Color(0xF2F2FFF2),
        contentColor = Color.Black,
        dragHandle = { BottomSheetDefaults.DragHandle(color = Color.Gray) }
    ) {
        val scrollState = rememberScrollState()
        val isFormValid =
            nom.isNotBlank() && dateNaissance.isNotBlank() && lieuNaissance.isNotBlank() &&
                    parentDirectNom.isNotBlank() && parentDirectTel.isNotBlank() && selectedSalleId > 0

        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .verticalScroll(scrollState),
                verticalArrangement = Arrangement.spacedBy(15.dp)
            ) {
                if (sallesDisponibles.isEmpty() && registrationState == SaveState.IDLE) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                        horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = Color.Red,
                            modifier = Modifier.size(48.dp)
                        )

                        Text(
                            text = if (!hasClasses) "Structure Académique Vide" else "Aucune salle de classe",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.Red,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )

                        Text(
                            text = if (!hasClasses)
                                "Vous devez d'abord définir vos cycles et classes dans les paramètres."
                            else "Veuillez configurer les frais de scolarité pour vos classes dans le Dashboard Classes afin de pouvoir inscrire des élèves.",
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            color = Color.Black
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Button(
                            onClick = {
                                val intent = if (!hasClasses) {
                                    Intent(context, com.indiza.scholar.SettingsActivity::class.java)
                                } else {
                                    Intent(
                                        context,
                                        com.indiza.scholar.ui.salle.SalleManagementActivity::class.java
                                    )
                                }
                                intent.putExtra("idAnneeScolaire", idAnneeScolaire)
                                context.startActivity(intent)
                                onDismiss()
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (!hasClasses) Color(0xFF1ABC9C) else Color(
                                    0xFF3498DB
                                )
                            )
                        ) {
                            Text(if (!hasClasses) "Aller aux Paramètres" else "Gérer les Salles")
                        }
                    }
                } else if (selectedSalleId == 0L && registrationState == SaveState.IDLE) {
                    // Étape de sélection de salle si aucune n'est présélectionnée
                    Text(
                        text = "Choisir une salle",
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color(0xFF2C3E50),
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        "Veuillez sélectionner la salle où inscrire le nouvel élève :",
                        color = Color.Gray
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    LazyColumn(
                        modifier = Modifier.fillMaxWidth().heightIn(max = 400.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(sallesDisponibles) { salle ->
                            val isNearCapacity =
                                salle.capacite?.let { (salle.elevesInscrits.toFloat() / it) > 0.9 }
                                    ?: false

                            Card(
                                modifier = Modifier.fillMaxWidth()
                                    .clickable { selectedSalleId = salle.idServeur ?: 0L },
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    Color.LightGray
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        val fullLabel = if (salle.classeLabel != null) {
                                            "${salle.classeLabel} ${salle.nomSalle}"
                                        } else {
                                            salle.nomSalle
                                        }
                                        Text(
                                            fullLabel,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.Black
                                        )
                                        Text(
                                            "Inscrits: ${salle.elevesInscrits} / ${salle.capacite ?: "?"}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color.Gray
                                        )
                                    }
                                    if (isNearCapacity) {
                                        Text(
                                            "Pleine !",
                                            color = Color.Red,
                                            style = MaterialTheme.typography.labelSmall
                                        )
                                    }
                                    Icon(
                                        Icons.Default.ArrowForward,
                                        contentDescription = null,
                                        tint = Color(0xFF1ABC9C)
                                    )
                                }
                            }
                        }
                    }
                } else {
                    Text(
                        text = if (studentToEdit != null) "Modifier l'Élève" else "Nouvelle Inscription",
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color(0xFF2C3E50),
                        fontWeight = FontWeight.Bold
                    )

                    val selectedSalle = sallesDisponibles.find { it.idServeur == selectedSalleId }
                    if (selectedSalle != null) {
                        Surface(
                            color = Color(0xFF1ABC9C).copy(alpha = 0.1f),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.Class,
                                    contentDescription = null,
                                    tint = Color(0xFF1ABC9C)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                // 📝 Concaténation : Classe + Salle (ex: 6eme A)
                                val displayLabel = if (selectedSalle.classeLabel != null) {
                                    "${selectedSalle.classeLabel} ${selectedSalle.nomSalle}"
                                } else {
                                    selectedSalle.nomSalle
                                }
                                Text(
                                    "Inscription en : $displayLabel",
                                    fontWeight = FontWeight.Medium,
                                    color = Color(0xFF1ABC9C)
                                )
                                Spacer(modifier = Modifier.weight(1f))
                                if (idSalleInitiale == 0L || studentToEdit != null) {
                                    TextButton(onClick = {
                                        if (studentToEdit != null) {
                                            viewModel.checkStudentTransfer(studentToEdit.idEleve, idAnneeScolaire) { canChange, reason ->
                                                if (canChange) {
                                                    selectedSalleId = 0L
                                                } else {
                                                    Toast.makeText(context, reason ?: "Changement impossible.", Toast.LENGTH_LONG).show()
                                                }
                                            }
                                        } else {
                                            selectedSalleId = 0L
                                        }
                                    }) {
                                        Text("Changer", color = Color.Gray)
                                    }
                                }
                            }
                        }
                    }

                    // Gestion des états de chargement / erreur serveur
                    when (registrationState) {
                        is SaveState.SAVING_REMOTE -> LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth(),
                            color = Color(0xFF1ABC9C)
                        )

                        is SaveState.ERROR -> {
                            val errorMsg = (registrationState as SaveState.ERROR).error
                            LaunchedEffect(errorMsg) {
                                Toast.makeText(context, "Erreur: $errorMsg", Toast.LENGTH_LONG)
                                    .show()
                            }
                            Text(
                                text = errorMsg,
                                color = Color.Red,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }

                        is SaveState.SUCCESS -> {
                            LaunchedEffect(Unit) {
                                Toast.makeText(context, "Inscription réussie !", Toast.LENGTH_SHORT)
                                    .show()
                                viewModel.resetRegistrationState()
                                onDismiss()
                            }
                        }

                        else -> {}
                    }

                    SectionTitle("Informations de l'élève")

                    OutlinedTextField(
                        value = matricule,
                        onValueChange = { matricule = it },
                        label = { Text("Matricule (Optionnel)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors()
                    )

                    OutlinedTextField(
                        value = nom,
                        onValueChange = { nom = it; errors = errors - "nom" },
                        label = { LabelWithAsterisk("Nom de l'élève") },
                        modifier = Modifier.fillMaxWidth(),
                        isError = errors.containsKey("nom"),
                        supportingText = {
                            if (errors.containsKey("nom")) Text(
                                errors["nom"]!!,
                                color = Color.Red
                            )
                        },
                        colors = textFieldColors()
                    )

                    OutlinedTextField(
                        value = prenom,
                        onValueChange = { prenom = it },
                        label = { Text("Prénom") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        DatePickerField(
                            value = dateNaissance,
                            onDateSelected = { dateNaissance = it; errors = errors - "date" },
                            label = { LabelWithAsterisk("Date Naissance") },
                            isError = errors.containsKey("date"),
                            supportingText = {
                                if (errors.containsKey("date")) Text(
                                    errors["date"]!!,
                                    color = Color.Red
                                )
                            }
                        )
                    }

                    OutlinedTextField(
                        value = lieuNaissance,
                        onValueChange = { lieuNaissance = it; errors = errors - "lieu" },
                        label = { LabelWithAsterisk("Lieu Naissance") },
                        modifier = Modifier.fillMaxWidth(),
                        isError = errors.containsKey("lieu"),
                        supportingText = {
                            if (errors.containsKey("lieu")) Text(
                                errors["lieu"]!!,
                                color = Color.Red
                            )
                        },
                        colors = textFieldColors()
                    )

                    Text("Sexe *", style = MaterialTheme.typography.labelLarge, color = Color.Gray)
                    Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                        RadioButtonGroup("Masculin", "M", sexe) { sexe = it }
                        RadioButtonGroup("Féminin", "F", sexe) { sexe = it }
                    }

                    // Bloc Parent/Tuteur Direct
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            Color(0xFF1ABC9C).copy(alpha = 0.3f)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                "Responsable Direct *",
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1ABC9C)
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                RadioButtonGroup("Père", "Père", parentType) {
                                    parentType = it
                                    if (it == "Père") {
                                        nomPere = parentDirectNom; telephonePere = parentDirectTel
                                    }
                                }
                                RadioButtonGroup("Mère", "Mère", parentType) {
                                    parentType = it
                                    if (it == "Mère") {
                                        nomMere = parentDirectNom; telephoneMere = parentDirectTel
                                    }
                                }
                                RadioButtonGroup("Tuteur", "Tuteur", parentType) {
                                    parentType = it
                                    if (it == "Tuteur") {
                                        nomTuteur = parentDirectNom; telephoneTuteur =
                                            parentDirectTel
                                    }
                                }
                            }

                            OutlinedTextField(
                                value = parentDirectNom,
                                onValueChange = {
                                    parentDirectNom = it; errors = errors - "parentNom"
                                    when (parentType) {
                                        "Père" -> nomPere = it
                                        "Mère" -> nomMere = it
                                        "Tuteur" -> nomTuteur = it
                                    }
                                },
                                label = { Text("Nom ($parentType)") },
                                modifier = Modifier.fillMaxWidth(),
                                isError = errors.containsKey("parentNom"),
                                colors = textFieldColors()
                            )

                            OutlinedTextField(
                                value = parentDirectTel,
                                onValueChange = {
                                    parentDirectTel = it; errors = errors - "parentTel"
                                    when (parentType) {
                                        "Père" -> telephonePere = it
                                        "Mère" -> telephoneMere = it
                                        "Tuteur" -> telephoneTuteur = it
                                    }
                                },
                                label = { Text("Téléphone ($parentType)") },
                                modifier = Modifier.fillMaxWidth(),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                isError = errors.containsKey("parentTel"),
                                colors = textFieldColors()
                            )
                        }
                    }

                    OutlinedTextField(
                        value = quartier,
                        onValueChange = { quartier = it },
                        label = { Text("Quartier") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors()
                    )

                    HorizontalDivider(color = Color.Gray.copy(alpha = 0.3f))
                    SectionTitle("Autres Informations (Facultatif)")

                    OutlinedTextField(
                        value = nomPere,
                        onValueChange = { nomPere = it },
                        label = { Text("Nom du Père") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = parentType != "Père",
                        colors = textFieldColors()
                    )
                    OutlinedTextField(
                        value = telephonePere,
                        onValueChange = { telephonePere = it },
                        label = { Text("Téléphone Père") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = parentType != "Père",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        colors = textFieldColors()
                    )

                    OutlinedTextField(
                        value = nomMere,
                        onValueChange = { nomMere = it },
                        label = { Text("Nom de la Mère") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = parentType != "Mère",
                        colors = textFieldColors()
                    )
                    OutlinedTextField(
                        value = telephoneMere,
                        onValueChange = { telephoneMere = it },
                        label = { Text("Téléphone Mère") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = parentType != "Mère",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        colors = textFieldColors()
                    )

                    OutlinedTextField(
                        value = nomTuteur,
                        onValueChange = { nomTuteur = it },
                        label = { Text("Nom du Tuteur") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = parentType != "Tuteur",
                        colors = textFieldColors()
                    )
                    OutlinedTextField(
                        value = telephoneTuteur,
                        onValueChange = { telephoneTuteur = it },
                        label = { Text("Téléphone Tuteur") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = parentType != "Tuteur",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        colors = textFieldColors()
                    )

                    OutlinedTextField(
                        value = ancienEtablissement,
                        onValueChange = { ancienEtablissement = it },
                        label = { Text("Ancien établissement") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors()
                    )

                    Spacer(modifier = Modifier.height(80.dp)) // Espace pour le FAB
                }

                // Floating Action Button persistant
                if (sallesDisponibles.isNotEmpty() && selectedSalleId > 0L) {
                    val isAtBottom =
                        scrollState.value >= scrollState.maxValue && scrollState.maxValue > 0

                    Box(
                        modifier = Modifier.fillMaxSize().padding(16.dp),
                        contentAlignment = Alignment.BottomEnd
                    ) {
                        androidx.compose.animation.AnimatedVisibility(
                            visible = true,
                            enter = fadeIn(),
                            exit = fadeOut()
                        ) {
                            ExtendedFloatingActionButton(
                                onClick = {
                                    if (validate()) {
                                        val payload = StudentRegistrationPayload(
                                            matricule = matricule.ifEmpty { null },
                                            nom = nom,
                                            prenom = prenom.ifEmpty { null },
                                            dateNaissance = dateNaissance,
                                            lieuNaissance = lieuNaissance,
                                            sexe = sexe,
                                            nomPere = nomPere.ifEmpty { null },
                                            telephonePere = telephonePere.toLongOrNull(),
                                            nomMere = nomMere.ifEmpty { null },
                                            telephoneMere = telephoneMere.toLongOrNull(),
                                            nomTuteur = nomTuteur.ifEmpty { null },
                                            telephoneTuteur = telephoneTuteur.toLongOrNull(),
                                            idAnneeScolaire = idAnneeScolaire,
                                            idSalle = selectedSalleId,
                                            ancienEtablissement = ancienEtablissement.ifEmpty { null },
                                            quartier = quartier.ifEmpty { null },
                                            nouveau = studentToEdit == null
                                        )
                                        if (studentToEdit != null) {
                                            viewModel.updateStudent(studentToEdit.idEleve, payload) { success, error ->
                                                if (success) {
                                                    Toast.makeText(context, "Mise à jour réussie !", Toast.LENGTH_SHORT).show()
                                                    onDismiss()
                                                } else {
                                                    Toast.makeText(context, error ?: "Échec de la mise à jour.", Toast.LENGTH_LONG).show()
                                                }
                                            }
                                        } else {
                                            viewModel.registerAndEnrollStudent(payload)
                                        }
                                    }
                                },
                                icon = {
                                    Icon(
                                        Icons.AutoMirrored.Filled.Send,
                                        contentDescription = null
                                    )
                                },
                                text = { Text(if (studentToEdit != null) "Mettre à jour" else "Inscrire l'élève") },
                                containerColor = if (isFormValid) Color(0xFF2ECC71) else Color.Gray,
                                contentColor = Color.White,
                                expanded = true
                            )
                        }
                    }
                }
            }
        }
    }
}
