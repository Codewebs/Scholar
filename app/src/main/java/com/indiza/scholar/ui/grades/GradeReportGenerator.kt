package com.indiza.scholar.ui.grades

import com.indiza.scholar.model.EtablissementEntity
import com.itextpdf.kernel.geom.PageSize
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import java.io.OutputStream

object GradeReportGenerator {

    fun generatePV(outputStream: OutputStream, school: EtablissementEntity, type: String, data: String) {
        val writer = PdfWriter(outputStream)
        val pdf = PdfDocument(writer)
        
        // PV is usually Landscape
        pdf.defaultPageSize = PageSize.A4.rotate()
        
        val document = Document(pdf)
        
        // Add Header (Simplified for now)
        document.add(Paragraph(school.nomFr).setBold().setTextAlignment(TextAlignment.CENTER))
        document.add(Paragraph("PROCES VERBAL - $type").setBold().setFontSize(16f).setTextAlignment(TextAlignment.CENTER))
        
        document.add(Paragraph("\n"))
        
        // Dynamic Table based on data
        val table = Table(UnitValue.createPercentArray(floatArrayOf(10f, 30f, 10f, 10f, 10f, 10f, 20f))).useAllAvailableWidth()
        
        table.addHeaderCell(Cell().add(Paragraph("Rang")).setBold())
        table.addHeaderCell(Cell().add(Paragraph("Nom & Prénom")).setBold())
        table.addHeaderCell(Cell().add(Paragraph("Matière 1")).setBold())
        table.addHeaderCell(Cell().add(Paragraph("Matière 2")).setBold())
        table.addHeaderCell(Cell().add(Paragraph("Total")).setBold())
        table.addHeaderCell(Cell().add(Paragraph("Moyenne")).setBold())
        table.addHeaderCell(Cell().add(Paragraph("Mention")).setBold())
        
        // Dummy data for now
        for (i in 1..20) {
            table.addCell(Cell().add(Paragraph("$i")))
            table.addCell(Cell().add(Paragraph("Elève Exemple $i")))
            table.addCell(Cell().add(Paragraph("14.5")))
            table.addCell(Cell().add(Paragraph("12.0")))
            table.addCell(Cell().add(Paragraph("26.5")))
            table.addCell(Cell().add(Paragraph("13.25")))
            table.addCell(Cell().add(Paragraph("Assez Bien")))
        }
        
        document.add(table)
        
        document.add(Paragraph("\nFait à ________________, le ________________"))
        document.add(Paragraph("Le Chef d'Établissement").setTextAlignment(TextAlignment.RIGHT))
        
        document.close()
    }
    
    fun generateReportSheet(outputStream: OutputStream, school: EtablissementEntity, salle: String, matiere: String) {
        val writer = PdfWriter(outputStream)
        val pdf = PdfDocument(writer)
        val document = Document(pdf)
        
        document.add(Paragraph(school.nomFr).setBold().setTextAlignment(TextAlignment.CENTER))
        document.add(Paragraph("FICHE DE REPORT DES NOTES").setBold().setFontSize(16f).setTextAlignment(TextAlignment.CENTER))
        document.add(Paragraph("Salle: $salle | Matière: $matiere").setTextAlignment(TextAlignment.CENTER))
        
        document.add(Paragraph("\n"))
        
        val table = Table(UnitValue.createPercentArray(floatArrayOf(10f, 50f, 20f, 20f))).useAllAvailableWidth()
        table.addHeaderCell(Cell().add(Paragraph("N°")).setBold())
        table.addHeaderCell(Cell().add(Paragraph("Nom & Prénom")).setBold())
        table.addHeaderCell(Cell().add(Paragraph("Note /20")).setBold())
        table.addHeaderCell(Cell().add(Paragraph("Observation")).setBold())
        
        for (i in 1..40) {
            table.addCell(Cell().add(Paragraph("$i")))
            table.addCell(Cell().add(Paragraph("..................................................................")))
            table.addCell(Cell().add(Paragraph("")))
            table.addCell(Cell().add(Paragraph("")))
        }
        
        document.add(table)
        document.close()
    }
}
