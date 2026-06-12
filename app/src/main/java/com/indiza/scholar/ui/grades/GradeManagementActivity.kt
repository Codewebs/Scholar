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
                    onGeneratePV = { type, salle ->
                        generateAndOpenPV(type, salle.nomSalle)
                    }
                )
            }
        }
    }

    private fun generateAndOpenPV(type: String, salle: String) {
        val resolver = contentResolver
        val fileName = "PV_${type}_${salle}.pdf"

        lifecycleScope.launch {
            val db = AppDatabase.getInstance(this@GradeManagementActivity)
            val school = withContext(Dispatchers.IO) { db.etablissementDao().getEtablissementSync() }
                ?: EtablissementEntity(nomFr = "Établissement", telephone1 = 0L)

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
                            GradeReportGenerator.generatePV(os, school, type, "DUMMY_DATA")
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
