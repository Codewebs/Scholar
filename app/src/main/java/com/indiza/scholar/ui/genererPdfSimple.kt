package com.indiza.scholar.ui

import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import java.io.OutputStream

fun genererPdfDansFlux(outputStream: OutputStream) {
    try {
        // On initialise le PdfWriter directement avec le flux du MediaStore
        val pdfWriter = PdfWriter(outputStream)
        val pdfDoc = PdfDocument(pdfWriter)
        val document = Document(pdfDoc)

        // --- Contenu du PDF ---
        val titre = Paragraph("Mon Premier Document PDF")
            .setFontSize(20f)
            .setBold()
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(20f)
        document.add(titre)

        val paragraphe = Paragraph(
            "Ce bulletin a été enregistré dans le dossier public Documents de l'appareil."
        ).setFontSize(12f).setMarginBottom(15f)
        document.add(paragraphe)

        val tableau = Table(UnitValue.createPercentArray(floatArrayOf(50f, 50f))).useAllAvailableWidth()
        tableau.addHeaderCell(Cell().add(Paragraph("Option")).setBold())
        tableau.addHeaderCell(Cell().add(Paragraph("Valeur")).setBold())
        tableau.addCell(Cell().add(Paragraph("Statut du paiement")))
        tableau.addCell(Cell().add(Paragraph("Validé")))

        document.add(tableau)
        // ----------------------

        document.close() // Finalise et ferme le document
    } catch (e: Exception) {
        e.printStackTrace()
        throw e
    }
}