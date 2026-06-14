package com.indiza.scholar.ui.grades

import com.indiza.scholar.model.*
import com.indiza.scholar.ui.reports.ReportPdfHelper
import com.itextpdf.kernel.colors.DeviceRgb
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
import com.itextpdf.layout.properties.VerticalAlignment
import java.io.OutputStream
import java.text.SimpleDateFormat
import java.util.*

data class PvData(
    val nomSequence: String,
    val nomSalle: String,
    val matieres: List<MatierePv>,
    val eleves: List<ElevePv>,
    val statsGlobales: PvGlobalStats? = null
)

data class MatierePv(
    val libelle: String,
    val coef: Double,
    val noteMax: Double? = null,
    val noteMin: Double? = null,
    val moyenneClasse: Double? = null,
    val pourcentageReussite: Double? = null
)

data class ElevePv(
    val nomComplet: String,
    val notes: Map<String, Double?>, // libelleMatiere -> note
    val totalNxC: Double,
    val totalCoef: Double,
    val moyenne: Double,
    val rang: String
)

data class PvGlobalStats(
    val moyMax: Double,
    val moyMin: Double,
    val moyGen: Double,
    val tauxReussite: Double,
    val effectifTotal: Int,
    val nbClasses: Int
)

object GradeReportGenerator {

    fun generatePV(
        outputStream: OutputStream,
        school: EtablissementEntity,
        payload: PvExportPayload,
        data: PvData
    ) {
        val writer = PdfWriter(outputStream)
        val pdf = PdfDocument(writer)
        pdf.defaultPageSize = PageSize.A4.rotate()
        val document = Document(pdf)
        document.setMargins(20f, 20f, 20f, 20f)

        // BLOC 1 : L'En-tête Officiel
        ReportPdfHelper.addStandardHeader(document, school)
        
        val titlePara = Paragraph("PROCES VERBAL DE SYNTHESE : ${data.nomSequence.uppercase()}")
            .setBold()
            .setFontSize(14f)
            .setTextAlignment(TextAlignment.CENTER)
        document.add(titlePara)
        
        val subtitlePara = Paragraph("Salle de classe : ${data.nomSalle}")
            .setBold()
            .setFontSize(12f)
            .setTextAlignment(TextAlignment.CENTER)
        document.add(subtitlePara)
        
        document.add(Paragraph("\n"))

        // BLOC 2 : La Grille Matricielle des Notes
        addGradeGrid(document, data)

        // BLOC 3 : Le Bloc Statistiques (Conditionnel)
        if (payload.exportType == PdfExportType.COMPLET) {
            addStatisticsBlock(document, data)
        }

        document.add(Paragraph("\nFait à ________________, le ${SimpleDateFormat("dd/MM/yyyy").format(Date())}"))
        document.add(Paragraph("Le Chef d'Établissement").setTextAlignment(TextAlignment.RIGHT).setBold().setMarginRight(40f))

        document.close()
    }

    private fun addGradeGrid(document: Document, data: PvData) {
        val nbMatieres = data.matieres.size
        val colWidths = mutableListOf(25f) // Nom
        for (i in 1..nbMatieres) colWidths.add(5f) // Notes
        colWidths.addAll(listOf(7f, 7f, 7f, 7f)) // Synthesis columns

        val table = Table(UnitValue.createPercentArray(colWidths.toFloatArray())).useAllAvailableWidth()

        // ─── Headers ───
        table.addHeaderCell(createCenteredCell("NOM ET PRENOMS", true))
        
        data.matieres.forEach { mat ->
            val cell = Cell().add(Paragraph(mat.libelle.uppercase())
                .setRotationAngle(Math.toRadians(90.0))
                .setFontSize(8f)
                .setBold())
            cell.setVerticalAlignment(VerticalAlignment.MIDDLE)
            cell.setTextAlignment(TextAlignment.CENTER)
            table.addHeaderCell(cell)
        }

        table.addHeaderCell(createCenteredCell("T.NxC", true, 8f))
        table.addHeaderCell(createCenteredCell("T.C", true, 8f))
        table.addHeaderCell(createCenteredCell("MOY.", true, 8f))
        table.addHeaderCell(createCenteredCell("RANG", true, 8f))

        // ─── Student Rows ───
        data.eleves.forEach { eleve ->
            // Row 1: Name and Grades
            table.addCell(Cell().add(Paragraph(eleve.nomComplet.uppercase()).setBold().setFontSize(9f)).setVerticalAlignment(VerticalAlignment.MIDDLE))
            
            data.matieres.forEach { mat ->
                val note = eleve.notes[mat.libelle]
                val noteStr = if (note != null) "%.2f".format(note) else "--"
                table.addCell(createCenteredCell(noteStr, true, 9f))
            }

            table.addCell(Cell(2, 1).add(Paragraph("%.1f".format(eleve.totalNxC)).setBold().setFontSize(9f)).setVerticalAlignment(VerticalAlignment.MIDDLE).setTextAlignment(TextAlignment.CENTER))
            table.addCell(Cell(2, 1).add(Paragraph("%.1f".format(eleve.totalCoef)).setBold().setFontSize(9f)).setVerticalAlignment(VerticalAlignment.MIDDLE).setTextAlignment(TextAlignment.CENTER))
            table.addCell(Cell(2, 1).add(Paragraph("%.2f".format(eleve.moyenne)).setBold().setFontSize(10f)).setVerticalAlignment(VerticalAlignment.MIDDLE).setTextAlignment(TextAlignment.CENTER))
            table.addCell(Cell(2, 1).add(Paragraph(eleve.rang).setBold().setFontSize(10f)).setVerticalAlignment(VerticalAlignment.MIDDLE).setTextAlignment(TextAlignment.CENTER))

            // Row 2: Coefs
            table.addCell(createLeftCell("Coef", false, 7f).setBackgroundColor(DeviceRgb(240, 240, 240)).setItalic())
            data.matieres.forEach { mat ->
                table.addCell(createCenteredCell("%.1f".format(mat.coef), false, 7f).setBackgroundColor(DeviceRgb(240, 240, 240)))
            }
            // Synthesis cells are already taken by rowspan=2
        }

        document.add(table)
    }

    private fun addStatisticsBlock(document: Document, data: PvData) {
        document.add(Paragraph("\nSTATISTIQUES PAR MATIERE").setBold().setUnderline().setFontSize(10f))
        
        val nbMatieres = data.matieres.size
        val colWidths = mutableListOf(25f)
        for (i in 1..nbMatieres) colWidths.add(5f)
        colWidths.addAll(listOf(7f, 7f, 7f, 7f))

        val statTable = Table(UnitValue.createPercentArray(colWidths.toFloatArray())).useAllAvailableWidth()

        // Row Max
        statTable.addCell(createLeftCell("NOTE MAX", true))
        data.matieres.forEach { mat -> statTable.addCell(createCenteredCell("%.1f".format(mat.noteMax ?: 0.0), false, 8f)) }
        statTable.addCell(Cell(1, 4).setBorder(Border.NO_BORDER))

        // Row Min
        statTable.addCell(createLeftCell("NOTE MIN", true))
        data.matieres.forEach { mat -> statTable.addCell(createCenteredCell("%.1f".format(mat.noteMin ?: 0.0), false, 8f)) }
        statTable.addCell(Cell(1, 4).setBorder(Border.NO_BORDER))

        // Row Moyenne
        statTable.addCell(createLeftCell("MOY. CLASSE", true))
        data.matieres.forEach { mat -> statTable.addCell(createCenteredCell("%.2f".format(mat.moyenneClasse ?: 0.0), true, 8f)) }
        statTable.addCell(Cell(1, 4).setBorder(Border.NO_BORDER))

        // Row % Success
        statTable.addCell(createLeftCell("% REUSSITE", true))
        data.matieres.forEach { mat -> statTable.addCell(createCenteredCell("%.1f%%".format(mat.pourcentageReussite ?: 0.0), false, 8f)) }
        statTable.addCell(Cell(1, 4).setBorder(Border.NO_BORDER))

        document.add(statTable)

        // Global Metrics Footer
        data.statsGlobales?.let { stats ->
            document.add(Paragraph("\nMETRIQUES GLOBALES DE LA SALLE").setBold().setFontSize(10f))
            val globalTable = Table(UnitValue.createPercentArray(floatArrayOf(16f, 16f, 16f, 17f, 17f, 18f))).useAllAvailableWidth()
            
            globalTable.addCell(createKpiCell("Moyenne Max", "%.2f".format(stats.moyMax)))
            globalTable.addCell(createKpiCell("Moyenne Min", "%.2f".format(stats.moyMin)))
            globalTable.addCell(createKpiCell("Moyenne Gén.", "%.2f".format(stats.moyGen)))
            globalTable.addCell(createKpiCell("Taux Réussite", "%.1f %%".format(stats.tauxReussite)))
            globalTable.addCell(createKpiCell("Effectif Total", stats.effectifTotal.toString()))
            globalTable.addCell(createKpiCell("Élèves Classés", stats.nbClasses.toString()))
            
            document.add(globalTable)
        }
    }

    private fun createCenteredCell(text: String, bold: Boolean = false, fontSize: Float = 9f): Cell {
        val p = Paragraph(text).setTextAlignment(TextAlignment.CENTER).setFontSize(fontSize)
        if (bold) p.setBold()
        return Cell().add(p).setVerticalAlignment(VerticalAlignment.MIDDLE)
    }

    private fun createLeftCell(text: String, bold: Boolean = false, fontSize: Float = 9f): Cell {
        val p = Paragraph(text).setTextAlignment(TextAlignment.LEFT).setFontSize(fontSize)
        if (bold) p.setBold()
        return Cell().add(p).setVerticalAlignment(VerticalAlignment.MIDDLE)
    }

    private fun createKpiCell(label: String, value: String): Cell {
        return Cell().add(Paragraph("$label\n$value").setTextAlignment(TextAlignment.CENTER).setFontSize(9f))
            .setBackgroundColor(DeviceRgb(240, 240, 240)).setVerticalAlignment(VerticalAlignment.MIDDLE)
    }

    fun generateReportSheet(outputStream: OutputStream, school: EtablissementEntity, salle: String, matiere: String) {
        val writer = PdfWriter(outputStream)
        val pdf = PdfDocument(writer)
        val document = Document(pdf)
        
        ReportPdfHelper.addStandardHeader(document, school)
        document.add(Paragraph("FICHE DE REPORT DES NOTES").setBold().setFontSize(16f).setTextAlignment(TextAlignment.CENTER))
        document.add(Paragraph("Salle: $salle | Matière: $matiere").setTextAlignment(TextAlignment.CENTER))
        
        document.add(Paragraph("\n"))
        
        val table = Table(UnitValue.createPercentArray(floatArrayOf(10f, 50f, 20f, 20f))).useAllAvailableWidth()
        table.addHeaderCell(createCenteredCell("N°", true))
        table.addHeaderCell(createCenteredCell("Nom & Prénom", true))
        table.addHeaderCell(createCenteredCell("Note /20", true))
        table.addHeaderCell(createCenteredCell("Observation", true))
        
        for (i in 1..40) {
            table.addCell(createCenteredCell("$i"))
            table.addCell(Cell().add(Paragraph("..................................................................")))
            table.addCell(Cell())
            table.addCell(Cell())
        }
        
        document.add(table)
        document.close()
    }
}
