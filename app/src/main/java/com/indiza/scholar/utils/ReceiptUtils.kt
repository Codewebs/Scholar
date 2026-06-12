package com.indiza.scholar.utils

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.widget.Toast
import com.indiza.scholar.model.ReceiptData
import com.itextpdf.kernel.geom.PageSize
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.borders.Border
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import java.io.OutputStream

object ReceiptUtils {
    private const val TAG = "ReceiptUtils"

    /**
     * Génère le reçu et l'enregistre via MediaStore dans Documents ou Downloads.
     * Déclenche ensuite l'ouverture du fichier.
     */
    fun generateAndOpenRegistrationReceipt(context: Context, data: ReceiptData) {
        val fileName = "Recu_${data.receiptInfo.receiptNo}_${System.currentTimeMillis()}.pdf"
        val resolver = context.contentResolver

        try {
            Log.d(TAG, "Début génération reçu: $fileName")

            // Tentative de sauvegarde dans Documents
            var uri = createPdfUri(context, fileName, Environment.DIRECTORY_DOCUMENTS)
            
            // Si échec (peu probable sur versions récentes), tentative dans Downloads
            if (uri == null) {
                Log.w(TAG, "Échec création dans Documents, tentative dans Downloads")
                uri = createPdfUri(context, fileName, Environment.DIRECTORY_DOWNLOADS)
            }

            if (uri != null) {
                resolver.openOutputStream(uri)?.use { outputStream ->
                    writeReceiptToStream(data, outputStream)
                }
                Log.i(TAG, "Reçu enregistré avec succès à l'URI: $uri")
                Toast.makeText(context, "Reçu sauvegardé", Toast.LENGTH_SHORT).show()
                ouvrirPdfDepuisUri(context, uri)
            } else {
                Log.e(TAG, "Impossible de créer l'URI pour le fichier. L'utilisateur devra peut-être choisir manuellement.")
                // Note: Dans une application réelle, on pourrait lancer ACTION_CREATE_DOCUMENT ici.
                Toast.makeText(context, "Erreur de création du fichier", Toast.LENGTH_LONG).show()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erreur globale lors de la génération: ${e.message}", e)
            Toast.makeText(context, "Erreur: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
        }
    }

    private fun createPdfUri(context: Context, fileName: String, relativePath: String): Uri? {
        return try {
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath)
                }
            }
            context.contentResolver.insert(MediaStore.Files.getContentUri("external"), contentValues)
        } catch (e: Exception) {
            Log.e(TAG, "Erreur lors de la création de l'URI dans $relativePath: ${e.message}")
            null
        }
    }

    private fun writeReceiptToStream(data: ReceiptData, outputStream: OutputStream) {
        val pdfWriter = PdfWriter(outputStream)
        val pdfDoc = PdfDocument(pdfWriter)
        val document = Document(pdfDoc, PageSize.A5)
        document.setMargins(30f, 30f, 30f, 30f)

        try {
            // --- EN-TÊTE ---
            document.add(Paragraph("REÇU D'INSCRIPTION - SCHOLAR")
                .setTextAlignment(TextAlignment.CENTER)
                .setBold()
                .setFontSize(16f))
            
            document.add(Paragraph("Année Scolaire : ${data.receiptInfo.schoolYear}")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(10f))
            
            document.add(Paragraph("------------------------------------------------------------------")
                .setTextAlignment(TextAlignment.CENTER))

            // --- CORPS DU REÇU ---
            document.add(Paragraph("\n"))
            document.add(Paragraph("N° Reçu : ${data.receiptInfo.receiptNo}").setFontSize(11f))
            document.add(Paragraph("Élève : ${data.studentInfo.fullName}").setBold().setFontSize(12f))
            document.add(Paragraph("Classe : ${data.studentInfo.classLabel}").setFontSize(11f))
            
            document.add(Paragraph("\n")) // Espacement

            // --- DÉTAILS FINANCIERS ---
            document.add(Paragraph("MONTANT VERSÉ : ${data.financialDetail.amountDigits} F CFA")
                .setBold()
                .setFontSize(14f))
            
            document.add(Paragraph("Soit : ${data.financialDetail.amountWords}")
                .setItalic()
                .setFontSize(10f))

            document.add(Paragraph("\n\n")) // Espacement

            // --- SIGNATURES ---
            val table = Table(UnitValue.createPercentArray(floatArrayOf(50f, 50f))).useAllAvailableWidth()
            
            table.addCell(Cell().add(Paragraph("Le Parent"))
                .setBorder(Border.NO_BORDER))
            
            table.addCell(Cell().add(Paragraph("La Caisse"))
                .setTextAlignment(TextAlignment.RIGHT)
                .setBorder(Border.NO_BORDER))
            
            document.add(table)
            
            document.add(Paragraph("\n\n\nEncaisseur : ${data.validation.cashierName}")
                .setFontSize(8f)
                .setTextAlignment(TextAlignment.LEFT))

        } finally {
            document.close()
        }
    }

    private fun ouvrirPdfDepuisUri(context: Context, uri: Uri) {
        try {
            // On utilise notre propre lecteur interne
            val intent = Intent(context, com.indiza.scholar.ui.components.PdfViewerActivity::class.java).apply {
                setDataAndType(uri, "application/pdf")
                putExtra(Intent.EXTRA_STREAM, uri)
                flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Erreur lors de l'ouverture du lecteur interne: ${e.message}")
            // Fallback sur le sélecteur système si notre lecteur échoue
            try {
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "application/pdf")
                    flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(Intent.createChooser(intent, "Ouvrir le reçu avec..."))
            } catch (e2: Exception) {
                Toast.makeText(context, "Aucun lecteur PDF trouvé", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
