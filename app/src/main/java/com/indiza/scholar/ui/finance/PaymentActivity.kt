package com.indiza.scholar.ui.finance

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.indiza.scholar.data.AppDatabase
import com.indiza.scholar.model.EtablissementEntity
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.reports.FinancialReportGenerator
import com.indiza.scholar.ui.theme.ScholarTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.OutputStream

class PaymentActivity : ComponentActivity() {
    private lateinit var api: ApiService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val idAnnee = intent.getLongExtra("idAnneeScolaire", 0L)

        api = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)

        val financeViewModel = ViewModelProvider(this, object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return FinanceViewModel(api) as T
            }
        })[FinanceViewModel::class.java]

        setContent {
            ScholarTheme {
                PaymentScreen(idAnnee, financeViewModel, 
                    onBack = { finish() },
                    onShowReceipt = { idEleve, idAnneeScolaire ->
                        generateAndShowReceipt(idEleve, idAnneeScolaire)
                    }
                )
            }
        }
    }

    private fun generateAndShowReceipt(idEleve: Long, idAnneeScolaire: Long) {
        lifecycleScope.launch {
            try {
                val receiptResp = api.getRegistrationReceiptData(idEleve, idAnneeScolaire)
                val detailsResp = api.getStudentPaymentDetails(idEleve, idAnneeScolaire)

                if (receiptResp.isSuccessful && detailsResp.isSuccessful) {
                    val school = withContext(Dispatchers.IO) {
                        AppDatabase.getInstance(this@PaymentActivity).etablissementDao().getEtablissementSync()
                    } ?: EtablissementEntity(nomFr = "Scholar School", telephone1 = 0L)

                    val params = mapOf(
                        "receiptData" to receiptResp.body()!!,
                        "paymentDetails" to detailsResp.body()!!
                    )

                    val uri = withContext(Dispatchers.IO) {
                        val resolver = contentResolver
                        val contentValues = android.content.ContentValues().apply {
                            put(MediaStore.MediaColumns.DISPLAY_NAME, "Recu_${System.currentTimeMillis()}.pdf")
                            put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOCUMENTS + "/Scholar/Receipts")
                        }
                        val targetUri = resolver.insert(MediaStore.Files.getContentUri("external"), contentValues)
                        targetUri?.let {
                            resolver.openOutputStream(it)?.use { os ->
                                FinancialReportGenerator.generate(os, "Reçu Frais de Scolarité", params, school)
                            }
                            it
                        }
                    }

                    if (uri != null) {
                        val intent = Intent(this@PaymentActivity, com.indiza.scholar.ui.components.PdfViewerActivity::class.java).apply {
                            setDataAndType(uri, "application/pdf")
                            putExtra(Intent.EXTRA_STREAM, uri)
                            flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                        }
                        startActivity(intent)
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(this@PaymentActivity, "Erreur: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
