package com.indiza.scholar.ui.grades

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.indiza.scholar.data.AppDatabase
import com.indiza.scholar.model.EtablissementEntity
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.theme.ScholarTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class GradeManagementActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val idAnneeScolaire = intent.getLongExtra("idAnneeScolaire", 0L)

        val retrofit = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE)
                .getString("token", null)
        }
        val api = retrofit.create(ApiService::class.java)

        val viewModel = ViewModelProvider(this, object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return GradeManagementViewModel(api) as T
            }
        })[GradeManagementViewModel::class.java]

        setContent {
            ScholarTheme {
                GradeManagementScreen(
                    idAnneeScolaire = idAnneeScolaire,
                    viewModel = viewModel,
                    onBack = { finish() },
                    onGenerateReportSheet = { salle, rep ->
                        generateAndOpenReportSheet(salle.nomSalle, rep?.detailsMatiere?.libelleFr ?: "Matière")
                    },
                    onGeneratePV = { payload, salle ->
                        generateAndOpenPV(payload, salle.nomSalle, idAnneeScolaire)
                    }
                )
            }
        }
    }

    private fun generateAndOpenPV(payload: com.indiza.scholar.model.PvExportPayload, salle: String, idAnneeScolaire: Long) {
        val resolver = contentResolver
        val fileName = "PV_${payload.exportType.name}_${salle}.pdf"

        lifecycleScope.launch {
            val db = AppDatabase.getInstance(this@GradeManagementActivity)
            val school = withContext(Dispatchers.IO) { db.etablissementDao().getEtablissementSync() }
                ?: EtablissementEntity(nomFr = "Établissement", telephone1 = 0L)

            val annee = withContext(Dispatchers.IO) {
                db.anneeScolaireDao().getAll().find { it.idServeur == idAnneeScolaire }
            }
            val finalPayload = payload.copy(anneeScolaire = annee?.libelleAnneeScolaire ?: "N/A")

            // Construction de données de test pour la démonstration du PV
            val mockData = PvData(
                nomSequence = finalPayload.anneeScolaire, // À remplacer par le vrai nom de la séquence
                nomSalle = salle,
                matieres = listOf(
                    MatierePv("Informatique", 2.0, 18.5, 5.0, 12.4, 75.0),
                    MatierePv("Mathématiques", 4.0, 19.0, 2.0, 10.5, 55.0),
                    MatierePv("Français", 3.0, 16.0, 7.0, 11.2, 85.0),
                    MatierePv("Anglais", 3.0, 17.5, 4.0, 13.0, 90.0)
                ),
                eleves = listOf(
                    ElevePv("ADA NKOLO VIRGINIE", mapOf("Informatique" to 15.0, "Mathématiques" to 12.0, "Français" to 14.0, "Anglais" to 16.0), 173.0, 12.0, 14.41, "1ère"),
                    ElevePv("BELLA MBARGA JEAN", mapOf("Informatique" to 10.0, "Mathématiques" to 8.5, "Français" to 11.0, "Anglais" to 9.0), 115.0, 12.0, 9.58, "12e"),
                    ElevePv("ETOUNDI PASCAL", mapOf("Informatique" to 18.0, "Mathématiques" to 17.0, "Français" to 15.0, "Anglais" to 14.0), 195.0, 12.0, 16.25, "2e")
                ),
                statsGlobales = PvGlobalStats(18.5, 6.2, 11.4, 68.5, 45, 42)
            )

            val uriResult: Uri? = withContext(Dispatchers.IO) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOCUMENTS + "/Scholar/PV")
                }
                val uri = resolver.insert(MediaStore.Files.getContentUri("external"), contentValues)
                uri?.let { targetUri ->
                    try {
                        resolver.openOutputStream(targetUri)?.use { os ->
                            GradeReportGenerator.generatePV(os, school, finalPayload, mockData)
                        }
                        targetUri
                    } catch (e: Exception) {
                        resolver.delete(targetUri, null, null)
                        null
                    }
                }
            }

            if (uriResult != null) {
                val intent = Intent(this@GradeManagementActivity, com.indiza.scholar.ui.components.PdfViewerActivity::class.java).apply {
                    setDataAndType(uriResult, "application/pdf")
                    putExtra(Intent.EXTRA_STREAM, uriResult)
                    flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                }
                startActivity(intent)
            }
        }
    }

    private fun generateAndOpenReportSheet(salle: String, matiere: String) {
        val resolver = contentResolver
        val fileName = "Fiche_Report_${salle}_${matiere}.pdf"

        lifecycleScope.launch {
            val db = AppDatabase.getInstance(this@GradeManagementActivity)
            val school = withContext(Dispatchers.IO) { db.etablissementDao().getEtablissementSync() }
                ?: EtablissementEntity(nomFr = "Établissement", telephone1 = 0L)

            val uriResult: Uri? = withContext(Dispatchers.IO) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOCUMENTS + "/Scholar/Reports")
                }
                val uri = resolver.insert(MediaStore.Files.getContentUri("external"), contentValues)
                uri?.let { targetUri ->
                    try {
                        resolver.openOutputStream(targetUri)?.use { os ->
                            GradeReportGenerator.generateReportSheet(os, school, salle, matiere)
                        }
                        targetUri
                    } catch (e: Exception) {
                        resolver.delete(targetUri, null, null)
                        null
                    }
                }
            }

            if (uriResult != null) {
                val intent = Intent(this@GradeManagementActivity, com.indiza.scholar.ui.components.PdfViewerActivity::class.java).apply {
                    setDataAndType(uriResult, "application/pdf")
                    putExtra(Intent.EXTRA_STREAM, uriResult)
                    flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                }
                startActivity(intent)
            } else {
                Toast.makeText(this@GradeManagementActivity, "Erreur de génération", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
