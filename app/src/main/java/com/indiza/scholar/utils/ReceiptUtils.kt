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
import com.indiza.scholar.model.SyncConfig
import com.itextpdf.kernel.colors.Color
import com.itextpdf.kernel.colors.ColorConstants
import com.itextpdf.kernel.colors.DeviceRgb
import com.itextpdf.kernel.geom.PageSize
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.kernel.pdf.canvas.draw.DashedLine
import com.itextpdf.layout.Document
import com.itextpdf.layout.borders.Border
import com.itextpdf.layout.borders.DashedBorder
import com.itextpdf.layout.borders.SolidBorder
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.LineSeparator
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.element.Text
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import com.itextpdf.layout.properties.VerticalAlignment
import java.io.OutputStream

object ReceiptUtils {
    private const val TAG = "ReceiptUtils"

    fun generateAndOpenRegistrationReceipt(context: Context, data: ReceiptData) {
        val fileName = "Recu_${data.receiptInfo.receiptNo}_${System.currentTimeMillis()}.pdf"
        val resolver = context.contentResolver

        Log.d(TAG, "Génération du reçu: $fileName")
        Log.d(TAG, "Données transmises (ReceiptData): $data")

        try {
            var uri = createPdfUri(context, fileName, Environment.DIRECTORY_DOCUMENTS)
            if (uri == null) {
                uri = createPdfUri(context, fileName, Environment.DIRECTORY_DOWNLOADS)
            }

            if (uri != null) {
                Log.d(TAG, "Fichier créé avec succès à l'URI: $uri")
                resolver.openOutputStream(uri)?.use { outputStream ->
                    writeReceiptToStream(data, outputStream)
                }
                ouvrirPdfDepuisUri(context, uri)
            } else {
                Log.e(TAG, "Échec de la création de l'URI pour le fichier PDF")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erreur lors de la génération du reçu: ${e.message}", e)
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
            null
        }
    }

    private fun writeReceiptToStream(data: ReceiptData, outputStream: OutputStream) {
        val pdfWriter = PdfWriter(outputStream)
        val pdfDoc = PdfDocument(pdfWriter)

        val isDouble = SyncConfig.doubleReceipts
        val pageSize = if (isDouble) PageSize.A4 else PageSize.A5.rotate()
        pdfDoc.defaultPageSize = pageSize

        val document = Document(pdfDoc)
        document.setMargins(10f, 15f, 10f, 15f)

        try {
            if (isDouble) {
                drawSingleReceipt(document, data, "Reçu parent")

                document.add(Paragraph("\n"))
                val line = LineSeparator(DashedLine(1f))
                document.add(line)
                document.add(Paragraph("------------------------------------------------------------------------------------------------------------------------------------")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(8f)
                    .setMarginTop(-8f)
                    .setFontColor(DeviceRgb(100, 100, 100)))

                document.add(Paragraph("\n"))
                drawSingleReceipt(document, data, "Reçu établissement")
            } else {
                drawSingleReceipt(document, data, "Reçu parent")
            }
        } finally {
            document.close()
        }
    }

    private fun drawSingleReceipt(document: Document, data: ReceiptData, sideLabel: String) {
        val grayHeader = DeviceRgb(100, 100, 100)
        val lightGray = DeviceRgb(240, 240, 240)
        val inputGray = DeviceRgb(215, 215, 215)
        val redColor = DeviceRgb(190, 20, 60)
        val yellowColor = DeviceRgb(210, 255, 0)
        val blackColor = DeviceRgb(0, 0, 0)

        // Conteneur principal avec la bordure extérieure globale de la maquette image_44f56a.png
        val containerTable = Table(UnitValue.createPercentArray(floatArrayOf(97.5f, 2.5f))).useAllAvailableWidth()
        containerTable.setBorder(SolidBorder(blackColor, 1f))

        val leftContentCell = Cell().setBorder(Border.NO_BORDER).setPadding(8f)

        // --- 1. INSTITUTIONAL HEADER ---
        val headerTable = Table(UnitValue.createPercentArray(floatArrayOf(15f, 65f, 20f))).useAllAvailableWidth()
        headerTable.setBorder(Border.NO_BORDER)

        val logoCell = Cell().setBorder(Border.NO_BORDER).setVerticalAlignment(VerticalAlignment.MIDDLE)
        logoCell.add(Paragraph("[ LOGO ]").setFontSize(8f).setTextAlignment(TextAlignment.CENTER))
        headerTable.addCell(logoCell)

        val centerTextCell = Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER)
        centerTextCell.add(Paragraph(data.schoolInfo.name.uppercase()).setBold().setFontSize(10f).setMargin(0f))
        centerTextCell.add(Paragraph(data.schoolInfo.devise ?: data.schoolInfo.motto ?: "Discipline - Travail - Succès").setItalic().setBold().setFontSize(7f).setMargin(0f))
        centerTextCell.add(Paragraph("BP : ${data.schoolInfo.bp ?: "----"} ${data.schoolInfo.address ?: ""} Tél : ${data.schoolInfo.phones ?: "----"}").setFontSize(6.5f).setMargin(0f))
        headerTable.addCell(centerTextCell)

        val rightSchoolYearCell = Cell().setBorder(Border.NO_BORDER).setVerticalAlignment(VerticalAlignment.BOTTOM).setTextAlignment(TextAlignment.RIGHT)
        rightSchoolYearCell.add(Paragraph("Année Scolaire : ").setFontSize(7f).add(Text(data.receiptInfo.schoolYear).setBold()))
        headerTable.addCell(rightSchoolYearCell)
        leftContentCell.add(headerTable)

        // --- 2. TITLE BANNER ---
        val titleTable = Table(UnitValue.createPercentArray(floatArrayOf(100f))).useAllAvailableWidth().setMarginTop(2f)
        val titleCell = Cell().setVerticalAlignment(VerticalAlignment.MIDDLE).setTextAlignment(TextAlignment.CENTER)
            .setBackgroundColor(lightGray)
            .setBorder(SolidBorder(blackColor, 0.5f))
            .setPadding(2f)

        val titlePara = Paragraph("RECU DE PAIEMENT N° : ").setBold().setFontSize(10f)
        titlePara.add(Text(data.receiptInfo.receiptNo).setFontColor(redColor).setBold())
        titleCell.add(titlePara)
        titleTable.addCell(titleCell)
        leftContentCell.add(titleTable)

        // --- 3. STUDENT METADATA ---
        val metaTable = Table(UnitValue.createPercentArray(floatArrayOf(50f, 50f))).useAllAvailableWidth().setMarginTop(2f)
        
        metaTable.addCell(createMetaCell("Noms et Prénoms : ", data.studentInfo.fullName.uppercase(), TextAlignment.LEFT))
        metaTable.addCell(createMetaCell("Matricule : ", data.studentInfo.matricule, TextAlignment.RIGHT))

        metaTable.addCell(createMetaCell("Date et Lieu de naissance : ", "${data.studentInfo.dateNaissance ?: "----"} à ${data.studentInfo.lieuNaissance ?: "----"} | Sexe : ${data.studentInfo.sexe ?: "--"} | Classe : ${data.studentInfo.classLabel}", TextAlignment.LEFT))
        metaTable.addCell(createMetaCell("Date opération : ", "${data.receiptInfo.dateTime} à ${data.receiptInfo.operationTime ?: "HH:mm:ss"}", TextAlignment.RIGHT))
        
        metaTable.addCell(createMetaCell("Motif : Paiement frais de scolarité | La somme de : ", "${data.financialDetail.amountDigits} FCFA", TextAlignment.LEFT, redColor))
        metaTable.addCell(createMetaCell("Pénalités : ", "${data.financialDetail.penalties} FCFA", TextAlignment.RIGHT, redColor))
        leftContentCell.add(metaTable)

        // --- 3b. PARENTAL ACCESS INFO ---
        val accessTable = Table(UnitValue.createPercentArray(floatArrayOf(100f))).useAllAvailableWidth().setMarginTop(1f)
        val accessCell = Cell().setBackgroundColor(DeviceRgb(240, 245, 255)).setBorder(DashedBorder(DeviceRgb(100, 100, 255), 0.5f)).setPadding(2f)
        val accessPara = Paragraph().setFontSize(7f)
            .add(Text("ACCÈS ESPACE PARENT : ").setBold().setFontColor(DeviceRgb(0, 0, 150)))
            .add(Text(" PIN École : ").setFontSize(6.5f))
            .add(Text(data.schoolInfo.pinSecurite ?: "****").setBold())
            .add(Text(" | Code Élève : ").setFontSize(6.5f))
            .add(Text(data.studentInfo.codeInscription ?: "N/A").setBold())
        accessCell.add(accessPara)
        accessTable.addCell(accessCell)
        leftContentCell.add(accessTable)

        // --- 4. DATA TABLES ---
        val tablesContainer = Table(UnitValue.createPercentArray(floatArrayOf(30f, 70f))).useAllAvailableWidth().setMarginTop(2f)

        // LEFT TABLE
        val leftTable = Table(UnitValue.createPercentArray(floatArrayOf(60f, 40f))).useAllAvailableWidth()
        leftTable.addHeaderCell(createCell("Répartition du montant reçu", true, 6f, 2, TextAlignment.CENTER).setBackgroundColor(grayHeader).setFontColor(ColorConstants.WHITE))
        data.financialDetail.todayBreakdown.forEach { item ->
            leftTable.addCell(createCell(item.libelle, false, 6.5f))
            leftTable.addCell(createCell(item.montantAlloue.toString(), false, 6.5f, align = TextAlignment.CENTER))
        }
        leftTable.addCell(createCell("Total", true, 7f).setBackgroundColor(lightGray))
        leftTable.addCell(createCell("${data.financialDetail.amountDigits}", true, 7f, align = TextAlignment.CENTER).setBackgroundColor(yellowColor))
        tablesContainer.addCell(Cell().add(leftTable).setBorder(Border.NO_BORDER).setPaddingRight(4f))

        // RIGHT TABLE
        val rightTable = Table(UnitValue.createPercentArray(floatArrayOf(5f, 25f, 13f, 12f, 11f, 12f, 12f))).useAllAvailableWidth()
        rightTable.addHeaderCell(createCell("Etat actuel des frais de scolarité", true, 6f, 7, TextAlignment.CENTER).setBackgroundColor(grayHeader).setFontColor(ColorConstants.WHITE))
        val headers = arrayOf("Ordre", "Frais", "Montant", "Augm.", "Réduc.", "Payé", "Reste")
        headers.forEach { rightTable.addHeaderCell(createCell(it, true, 6f, align = TextAlignment.CENTER).setBackgroundColor(lightGray)) }

        var totalDu = 0; var totalDeja = 0; var totalReste = 0
        data.financialDetail.fullHistory.forEach { item ->
            rightTable.addCell(createCell(item.ordre.toString(), false, 6.5f, align = TextAlignment.CENTER))
            rightTable.addCell(createCell(item.libelle, false, 6.5f))
            rightTable.addCell(createCell(item.montantTotal.toString(), false, 6.5f, align = TextAlignment.CENTER))
            rightTable.addCell(createCell(item.augmentation.toString(), false, 6.5f, align = TextAlignment.CENTER))
            rightTable.addCell(createCell(item.reduction.toString(), false, 6.5f, align = TextAlignment.CENTER))
            rightTable.addCell(createCell(item.dejaPaye.toString(), false, 6.5f, align = TextAlignment.CENTER))
            rightTable.addCell(createCell(item.reste.toString(), false, 6.5f, align = TextAlignment.CENTER))
            totalDu += item.montantTotal; totalDeja += item.dejaPaye; totalReste += item.reste
        }
        rightTable.addCell(createCell("Total", true, 7f, colSpan = 2, align = TextAlignment.CENTER).setBackgroundColor(lightGray))
        rightTable.addCell(createCell(totalDu.toString(), true, 6.5f, align = TextAlignment.CENTER).setBackgroundColor(lightGray))
        rightTable.addCell(createCell("0", true, 6.5f, align = TextAlignment.CENTER).setBackgroundColor(lightGray))
        rightTable.addCell(createCell("0", true, 6.5f, align = TextAlignment.CENTER).setBackgroundColor(lightGray))
        rightTable.addCell(createCell(totalDeja.toString(), true, 7f, align = TextAlignment.CENTER).setBackgroundColor(yellowColor))
        rightTable.addCell(createCell(totalReste.toString(), true, 7f, align = TextAlignment.CENTER).setBackgroundColor(lightGray))
        tablesContainer.addCell(Cell().add(rightTable).setBorder(Border.NO_BORDER))
        leftContentCell.add(tablesContainer)

        // --- 5. FOOTER ---
        val footerTable = Table(UnitValue.createPercentArray(floatArrayOf(60f, 40f))).useAllAvailableWidth().setMarginTop(2f)
        val sumCell = Cell().setBorder(Border.NO_BORDER)
        sumCell.add(Paragraph("Total déjà payé : ").setFontSize(8f).setBold().add(Text(" $totalDeja ").setBackgroundColor(yellowColor)))
        sumCell.add(Paragraph("Total reste à payer : ").setFontSize(8f).setBold().add(Text(" $totalReste ").setBackgroundColor(lightGray)))
        footerTable.addCell(sumCell)
        footerTable.addCell(Cell().add(Paragraph("Signature et cachet").setItalic().setFontSize(7f).setTextAlignment(TextAlignment.CENTER)).setBorder(DashedBorder(blackColor, 0.5f)).setHeight(25f))
        leftContentCell.add(footerTable)

        val finalTable = Table(UnitValue.createPercentArray(floatArrayOf(25f, 50f, 25f))).useAllAvailableWidth().setMarginTop(2f)
        finalTable.addCell(createCell(java.text.SimpleDateFormat("dd/MM/yyyy HH.mm.ss").format(java.util.Date()), false, 6f).setBorder(Border.NO_BORDER))
        finalTable.addCell(createCell("NB : Ce document n'est valable qu'avec le cachet et la signature.", false, 6f, align = TextAlignment.CENTER).setBorder(Border.NO_BORDER))
        finalTable.addCell(createCell("Imprimé par : ${data.financialDetail.printedBy.uppercase()}", false, 6f, align = TextAlignment.RIGHT).setBorder(Border.NO_BORDER))
        leftContentCell.add(finalTable)

        containerTable.addCell(leftContentCell)
        containerTable.addCell(Cell().add(Paragraph(sideLabel).setRotationAngle(Math.toRadians(90.0)).setFontSize(6f).setBold().setFontColor(DeviceRgb(100, 100, 100))).setBorder(Border.NO_BORDER))

        document.add(containerTable)
    }

    private fun createCell(text: String, bold: Boolean, size: Float, colSpan: Int = 1, align: TextAlignment = TextAlignment.LEFT): Cell {
        val p = Paragraph(text).setFontSize(size).setTextAlignment(align)
        if (bold) p.setBold()
        val cell = Cell(1, colSpan).add(p).setVerticalAlignment(VerticalAlignment.MIDDLE)
        cell.setBorder(SolidBorder(DeviceRgb(0, 0, 0), 0.5f)) // Lignes intérieures noires fines
        return cell
    }

    private fun createMetaCell(label: String, value: String, align: TextAlignment, valueColor: Color = ColorConstants.BLACK): Cell {
        val p = Paragraph().setFontSize(8.5f).setTextAlignment(align)
            .add(Text(label))
            .add(Text(value).setBold().setFontColor(valueColor))
        return Cell().add(p).setBorder(Border.NO_BORDER)
    }

    private fun ouvrirPdfDepuisUri(context: Context, uri: Uri) {
        Log.d(TAG, "Ouverture du PDF depuis l'URI: $uri")
        try {
            val intent = Intent(context, com.indiza.scholar.ui.components.PdfViewerActivity::class.java).apply {
                setDataAndType(uri, "application/pdf")
                putExtra(Intent.EXTRA_STREAM, uri)
                flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
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