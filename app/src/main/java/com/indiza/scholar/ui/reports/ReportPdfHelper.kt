package com.indiza.scholar.ui.reports

import android.graphics.Bitmap
import com.indiza.scholar.model.EtablissementEntity
import com.indiza.scholar.model.SyncConfig
import com.itextpdf.io.image.ImageDataFactory
import com.itextpdf.layout.Document
import com.itextpdf.layout.borders.Border
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.Image
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import com.itextpdf.layout.properties.VerticalAlignment
import java.io.ByteArrayOutputStream

object ReportPdfHelper {

    fun addStandardHeader(document: Document, school: EtablissementEntity) {
        val nbPhones = SyncConfig.nbTelephones
        val phones = mutableListOf<String>()
        phones.add(school.telephone1.toString())
        if (nbPhones >= 2 && school.telephone2 != null) phones.add(school.telephone2.toString())
        if (nbPhones >= 3 && school.telephone3 != null) phones.add(school.telephone3.toString())
        val phoneStr = "Tél: ${phones.joinToString(" / ")}"

        val headerTable = Table(UnitValue.createPercentArray(floatArrayOf(35f, 30f, 35f))).useAllAvailableWidth()
        headerTable.setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)

        // Left Side (French)
        val leftCell = Cell().add(Paragraph("REPUBLIQUE DU CAMEROUN\nPaix - Travail - Patrie\n----------\nMINISTERE DES ENSEIGNEMENTS SECONDAIRES")
            .setTextAlignment(TextAlignment.CENTER)
            .setBold()
            .setFontSize(7f))
            .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
        headerTable.addCell(leftCell)

        // Center Side (School Logo/Name)
        val centerContainer = Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
            .setVerticalAlignment(VerticalAlignment.MIDDLE)
            .setTextAlignment(TextAlignment.CENTER)
            
        centerContainer.add(Paragraph(school.nomFr.uppercase())
            .setBold()
            .setFontSize(11f)
            .setMarginBottom(0f))
            
        if (!school.nomEn.isNullOrBlank()) {
            centerContainer.add(Paragraph(school.nomEn.uppercase())
                .setBold()
                .setFontSize(11f)
                .setMarginTop(0f))
        }
        
        centerContainer.add(Paragraph(phoneStr)
            .setFontSize(8f)
            .setItalic())
            
        headerTable.addCell(centerContainer)

        // Right Side (English)
        val rightCell = Cell().add(Paragraph("REPUBLIC OF CAMEROON\nPeace - Work - Fatherland\n----------\nMINISTRY OF SECONDARY EDUCATION")
            .setTextAlignment(TextAlignment.CENTER)
            .setBold()
            .setFontSize(7f))
            .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
        headerTable.addCell(rightCell)

        document.add(headerTable)
        document.add(Paragraph("----------------------------------------------------------------------------------------------------------------------------------")
            .setFontSize(6f)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginTop(-5f))
    }

    fun addChart(document: Document, bitmap: Bitmap, width: Float? = null) {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
        val imageData = ImageDataFactory.create(stream.toByteArray())
        val image = Image(imageData)
        if (width != null) {
            image.setWidth(width)
        } else {
            image.setAutoScale(true)
        }
        image.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER)
        document.add(image)
    }
}
