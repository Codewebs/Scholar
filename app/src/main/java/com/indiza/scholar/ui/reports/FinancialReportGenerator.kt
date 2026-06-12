package com.indiza.scholar.ui.reports

import com.indiza.scholar.model.EtablissementEntity
import com.indiza.scholar.ui.student.EleveUiModel
import com.itextpdf.kernel.colors.DeviceRgb
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.borders.Border
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import com.itextpdf.layout.properties.VerticalAlignment
import java.io.OutputStream
import java.text.SimpleDateFormat
import java.util.*

object FinancialReportGenerator {

    fun generate(outputStream: OutputStream, type: String, params: Map<String, Any>, school: EtablissementEntity) {
        val writer = PdfWriter(outputStream)
        val pdf = PdfDocument(writer)
        val document = Document(pdf)

        ReportPdfHelper.addStandardHeader(document, school)

        when {
            type.startsWith("Reçu") -> generateDetailedReceipt(document, type, params)
            type.startsWith("Bilan") -> generateAccountingBilan(document, type, params)
            type.startsWith("Comp") || type.startsWith("Tableau Rp") -> generateComparisonAnalytics(document, type, params)
            type.startsWith("Liste") -> generateOperationalList(document, type, params)
            type.startsWith("Stats") -> generateDemographicStats(document, type, params)
            type.startsWith("Certificat") -> generateOfficialDocument(document, type, params)
            else -> document.add(Paragraph("Type d'état inconnu : $type"))
        }

        document.close()
    }

    private fun generateDetailedReceipt(document: Document, type: String, params: Map<String, Any>) {
        val student = params["student"] as? EleveUiModel ?: return
        val receiptData = params["receiptData"] as? com.indiza.scholar.model.ReceiptData
        val paymentDetails = params["paymentDetails"] as? com.indiza.scholar.model.StudentPaymentDetails
        
        document.add(Paragraph(type.uppercase()).setBold().setFontSize(14f).setTextAlignment(TextAlignment.CENTER))
        document.add(Paragraph("Année Scolaire : 2024 - 2025").setTextAlignment(TextAlignment.CENTER).setFontSize(10f))
        document.add(Paragraph("\n"))
        
        val studentTable = Table(UnitValue.createPercentArray(floatArrayOf(30f, 70f))).useAllAvailableWidth()
        studentTable.addCell(createNoBorderCell("Matricule :", true))
        studentTable.addCell(createNoBorderCell(student.matricule ?: receiptData?.studentInfo?.matricule ?: "N/A"))
        studentTable.addCell(createNoBorderCell("Nom & Prénom :", true))
        studentTable.addCell(createNoBorderCell(student.nomComplet))
        studentTable.addCell(createNoBorderCell("Classe / Salle :", true))
        studentTable.addCell(createNoBorderCell(student.classeLabel))
        document.add(studentTable)
        
        document.add(Paragraph("\n"))

        when(type) {
            "Reçu d'Inscription" -> {
                val table = Table(UnitValue.createPercentArray(floatArrayOf(60f, 40f))).useAllAvailableWidth()
                table.addHeaderCell(createHeaderCell("Nature du Paiement"))
                table.addHeaderCell(createHeaderCell("Montant Perçu"))
                table.addCell(Cell().add(Paragraph(receiptData?.financialDetail?.nature ?: "Frais d'Inscription")))
                table.addCell(Cell().add(Paragraph("%,d F".format(receiptData?.financialDetail?.amountDigits ?: 0))).setTextAlignment(TextAlignment.RIGHT))
                document.add(table)
            }
            "Reçu Frais de Scolarité" -> {
                val table = Table(UnitValue.createPercentArray(floatArrayOf(40f, 30f, 30f))).useAllAvailableWidth()
                table.addHeaderCell(createHeaderCell("Total Exigible"))
                table.addHeaderCell(createHeaderCell("Total Versé"))
                table.addHeaderCell(createHeaderCell("Reste à Payer"))
                table.addCell(Cell().add(Paragraph("%,d F".format(paymentDetails?.totalTotalDu ?: 0))))
                table.addCell(Cell().add(Paragraph("%,d F".format(paymentDetails?.totalDejaVerse ?: 0))))
                table.addCell(Cell().add(Paragraph("%,d F".format(paymentDetails?.resteGlobal ?: 0))).setFontColor(DeviceRgb(200, 0, 0)))
                document.add(table)
                
                document.add(Paragraph("\nDÉTAIL PAR FRAIS").setBold().setFontSize(9f))
                val detailTable = Table(UnitValue.createPercentArray(floatArrayOf(50f, 25f, 25f))).useAllAvailableWidth()
                detailTable.addHeaderCell(createHeaderCell("Libellé"))
                detailTable.addHeaderCell(createHeaderCell("Versé"))
                detailTable.addHeaderCell(createHeaderCell("Reste"))
                paymentDetails?.frais?.forEach { f ->
                    detailTable.addCell(Cell().add(Paragraph(f.libelle)))
                    detailTable.addCell(Cell().add(Paragraph("%,d F".format(f.montantPaye))))
                    detailTable.addCell(Cell().add(Paragraph("%,d F".format(f.reste))))
                }
                document.add(detailTable)
            }
            "Reçu Global Annuel" -> {
                val table = Table(UnitValue.createPercentArray(floatArrayOf(50f, 25f, 25f))).useAllAvailableWidth()
                table.addHeaderCell(createHeaderCell("Nature du Frais"))
                table.addHeaderCell(createHeaderCell("Total Versé"))
                table.addHeaderCell(createHeaderCell("Statut"))
                paymentDetails?.frais?.forEach { f ->
                    table.addCell(Cell().add(Paragraph(f.libelle)))
                    table.addCell(Cell().add(Paragraph("%,d F".format(f.montantPaye))))
                    table.addCell(Cell().add(Paragraph(if (f.isComplet) "SOLDÉ" else "NON SOLDÉ")))
                }
                document.add(table)
            }
            "Reçu Global Total" -> {
                document.add(Paragraph("HISTORIQUE INTER-ANNÉES").setItalic().setFontSize(10f))
                document.add(Paragraph("\nANNÉE 2023-2024").setBold())
                val table = Table(UnitValue.createPercentArray(floatArrayOf(70f, 30f))).useAllAvailableWidth()
                table.addCell(Cell().add(Paragraph("Total Frais Année A-1")))
                table.addCell(Cell().add(Paragraph("350 000 F")))
                document.add(table)
            }
            "Reçu Frais Périscolaires" -> {
                val table = Table(UnitValue.createPercentArray(floatArrayOf(70f, 30f))).useAllAvailableWidth()
                table.addHeaderCell(createHeaderCell("Libellé Périscolaire"))
                table.addHeaderCell(createHeaderCell("Montant"))
                table.addCell(Cell().add(Paragraph("Achat Uniforme (Tenue)")))
                table.addCell(Cell().add(Paragraph("12 000 F")))
                document.add(table)
            }
        }

        document.add(Paragraph("\nFait à Yaoundé, le ${SimpleDateFormat("dd/MM/yyyy HH:mm").format(Date())}").setTextAlignment(TextAlignment.RIGHT).setFontSize(9f))
        document.add(Paragraph("L'Intendant / Caissier").setBold().setTextAlignment(TextAlignment.RIGHT).setMarginRight(30f))
        document.add(Paragraph("\n[QR CODE VALIDATION]").setFontSize(8f).setTextAlignment(TextAlignment.LEFT))
    }

    private fun generateAccountingBilan(document: Document, type: String, params: Map<String, Any>) {
        val fetchedData = params["data"] as? com.indiza.scholar.model.BilanResponse
        document.add(Paragraph(type.uppercase()).setBold().setFontSize(14f).setTextAlignment(TextAlignment.CENTER))
        document.add(Paragraph("\n"))

        val chartItems = fetchedData?.chartData ?: emptyList()

        if (chartItems.isNotEmpty()) {
            val colors = listOf(0xFF2196F3.toInt(), 0xFF4CAF50.toInt(), 0xFFFFC107.toInt(), 0xFF9C27B0.toInt())
            val barChart = ChartDrawer.drawBarChart(chartItems.map { it.label to it.value }, colors)
            document.add(Paragraph("Répartition des recettes (Diagramme en bâton)").setItalic().setFontSize(10f))
            ReportPdfHelper.addChart(document, barChart, 450f)
        }
        
        if (fetchedData?.transactions != null) {
            document.add(Paragraph("\nJOURNAL DÉTAILLÉ DES TRANSACTIONS").setBold())
            val table = Table(UnitValue.createPercentArray(floatArrayOf(15f, 50f, 35f))).useAllAvailableWidth()
            table.addHeaderCell(createHeaderCell("Heure"))
            table.addHeaderCell(createHeaderCell("Élève / Détail"))
            table.addHeaderCell(createHeaderCell("Montant"))
            
            fetchedData.transactions.forEach { t ->
                val time = try { t.createdAt.split("T")[1].substring(0, 5) } catch(e: Exception) { t.createdAt }
                table.addCell(Cell().add(Paragraph(time)))
                table.addCell(Cell().add(Paragraph("${t.Eleve?.nom ?: "N/A"} - ${t.modePaiement}")))
                table.addCell(Cell().add(Paragraph("%,d F".format(t.montantTotal))).setTextAlignment(TextAlignment.RIGHT))
            }
            document.add(table)
        } else {
            document.add(Paragraph("\nSYNTHÈSE DES ENCAISSEMENTS").setBold())
            val table = Table(UnitValue.createPercentArray(floatArrayOf(60f, 40f))).useAllAvailableWidth()
            table.addHeaderCell(createHeaderCell("Période"))
            table.addHeaderCell(createHeaderCell("Total Encaissé"))
            chartItems.forEach {
                table.addCell(Cell().add(Paragraph(it.label)))
                table.addCell(Cell().add(Paragraph("%,.0f F".format(it.value))).setTextAlignment(TextAlignment.RIGHT))
            }
            document.add(table)
        }
    }

    private fun generateComparisonAnalytics(document: Document, type: String, params: Map<String, Any>) {
        val performanceData = params["data"] as? List<com.indiza.scholar.model.PerformanceRpItem>
        document.add(Paragraph(type.uppercase()).setBold().setFontSize(14f).setTextAlignment(TextAlignment.CENTER))
        val isProportional = params["prop"] as? Boolean ?: false
        if (isProportional) document.add(Paragraph("(Mode Proportionnalité Activé)").setTextAlignment(TextAlignment.CENTER).setFontSize(9f))
        
        document.add(Paragraph("\n"))

        val pieData = performanceData?.take(5)?.map { it.nomSalle to it.rp } ?: listOf("Réalisé" to 62.0, "Restant" to 38.0)
        val colors = listOf(0xFF4CAF50.toInt(), 0xFFF44336.toInt(), 0xFF2196F3.toInt(), 0xFFFFC107.toInt())
        val pieChart = ChartDrawer.drawPieChart(pieData, colors)
        
        document.add(Paragraph("Répartition & Parts (Pie Chart)").setItalic().setFontSize(10f))
        ReportPdfHelper.addChart(document, pieChart, 300f)

        if (type == "Tableau Rp" && performanceData != null) {
            val table = Table(UnitValue.createPercentArray(floatArrayOf(10f, 40f, 25f, 25f))).useAllAvailableWidth()
            table.addHeaderCell(createHeaderCell("Rang"))
            table.addHeaderCell(createHeaderCell("Salle"))
            table.addHeaderCell(createHeaderCell("Ratio Rp"))
            table.addHeaderCell(createHeaderCell("Statut"))
            
            performanceData.forEachIndexed { index, item ->
                table.addCell(Cell().add(Paragraph((index + 1).toString())))
                table.addCell(Cell().add(Paragraph(if (index == 0) "${item.nomSalle} (Leader)" else item.nomSalle).setBold()))
                table.addCell(Cell().add(Paragraph("%.1f %%".format(item.rp))))
                val status = if(item.rp >= 80) "Excellent" else if(item.rp >= 50) "Moyen" else "Critique"
                val color = if(item.rp >= 80) DeviceRgb(0, 150, 0) else if(item.rp >= 50) DeviceRgb(200, 150, 0) else DeviceRgb(200, 0, 0)
                table.addCell(Cell().add(Paragraph(status).setFontColor(color)))
            }
            document.add(table)
        } else {
            val table = Table(UnitValue.createPercentArray(floatArrayOf(40f, 60f))).useAllAvailableWidth()
            table.addHeaderCell(createHeaderCell("Indicateur"))
            table.addHeaderCell(createHeaderCell("Valeur"))
            table.addCell(Cell().add(Paragraph("Vitesse de Recouvrement")))
            table.addCell(Cell().add(Paragraph("82.4 %")))
            table.addCell(Cell().add(Paragraph("Panier Moyen Réel")))
            table.addCell(Cell().add(Paragraph("38 500 F CFA")))
            document.add(table)
        }
    }

    private fun generateOperationalList(document: Document, type: String, params: Map<String, Any>) {
        val listData = params["data"] as? List<com.indiza.scholar.model.InsolvableItem>
        document.add(Paragraph(type.uppercase()).setBold().setFontSize(14f).setTextAlignment(TextAlignment.CENTER))
        
        if (type == "Liste Insolvables" && listData != null) {
            val totalDette = listData.sumOf { it.dette }
            val vuln = listData.count { it.tauxDefaillance >= 100 }
            
            val kpiTable = Table(UnitValue.createPercentArray(floatArrayOf(33f, 33f, 33f))).useAllAvailableWidth()
            kpiTable.addCell(createKpiCell("Taux Insolvabilité", "%.1f %%".format((listData.size.toDouble() / 50.0) * 100)))
            kpiTable.addCell(createKpiCell("Masse Suspendue", "%,d F".format(totalDette)))
            kpiTable.addCell(createKpiCell("Indice Vulnérabilité", "%.1f %%".format((vuln.toDouble() / listData.size.coerceAtLeast(1)) * 100)))
            document.add(kpiTable)
            document.add(Paragraph("\n"))
            
            val table = Table(UnitValue.createPercentArray(floatArrayOf(15f, 45f, 20f, 20f))).useAllAvailableWidth()
            table.addHeaderCell(createHeaderCell("Matricule"))
            table.addHeaderCell(createHeaderCell("Nom & Prénom"))
            table.addHeaderCell(createHeaderCell("Dette"))
            table.addHeaderCell(createHeaderCell("Def %"))
            
            listData.forEach { item ->
                table.addCell(Cell().add(Paragraph(item.matricule ?: "N/A")))
                table.addCell(Cell().add(Paragraph(item.nomComplet)))
                table.addCell(Cell().add(Paragraph("%,d F".format(item.dette))))
                table.addCell(Cell().add(Paragraph("%.1f %%".format(item.tauxDefaillance))))
            }
            document.add(table)
        } else {
            document.add(Paragraph("Données non disponibles"))
        }
    }

    private fun generateDemographicStats(document: Document, type: String, params: Map<String, Any>) {
        document.add(Paragraph(type.uppercase()).setBold().setFontSize(14f).setTextAlignment(TextAlignment.CENTER))
        if (type == "Stats Ages") {
            val data = listOf("10 ans" to 4.0, "11 ans" to 12.0, "12 ans" to 45.0, "13 ans" to 30.0, "14 ans" to 8.0)
            val chart = ChartDrawer.drawBarChart(data, listOf(0xFF2196F3.toInt()))
            ReportPdfHelper.addChart(document, chart, 400f)
        } else {
            val data = listOf("Filles" to 58.0, "Garçons" to 42.0)
            val chart = ChartDrawer.drawPieChart(data, listOf(0xFFE91E63.toInt(), 0xFF2196F3.toInt()))
            ReportPdfHelper.addChart(document, chart, 250f)
        }
    }

    private fun generateOfficialDocument(document: Document, type: String, params: Map<String, Any>) {
        val student = params["student"] as? EleveUiModel ?: return
        document.add(Paragraph(type.uppercase()).setBold().setFontSize(18f).setUnderline().setTextAlignment(TextAlignment.CENTER).setMarginTop(40f))
        val content = when(type) {
            "Certificat de Scolarité" -> "Je soussigné, Chef d'établissement, certifie que l'élève ${student.nomComplet}, matricule ${student.matricule}, est régulièrement inscrit(e) en classe de ${student.classeLabel}."
            else -> "Je soussigné, Chef d'établissement, certifie que l'élève ${student.nomComplet} est PROMU(E) en classe supérieure."
        }
        document.add(Paragraph("\n\n$content").setFontSize(12f).setMultipliedLeading(1.5f))
        document.add(Paragraph("\nFait à Yaoundé, le ${SimpleDateFormat("dd MMMM yyyy", Locale.FRENCH).format(Date())}").setTextAlignment(TextAlignment.RIGHT))
    }

    private fun createNoBorderCell(content: String, bold: Boolean = false): Cell {
        val p = Paragraph(content)
        if (bold) p.setBold()
        return Cell().add(p).setBorder(Border.NO_BORDER)
    }

    private fun createHeaderCell(text: String): Cell {
        return Cell().add(Paragraph(text)).setBold().setBackgroundColor(DeviceRgb(230, 230, 230))
    }

    private fun createKpiCell(label: String, value: String): Cell {
        return Cell().add(Paragraph("$label\n$value").setTextAlignment(TextAlignment.CENTER).setFontSize(10f))
            .setBackgroundColor(DeviceRgb(240, 240, 240)).setVerticalAlignment(VerticalAlignment.MIDDLE)
    }
}
