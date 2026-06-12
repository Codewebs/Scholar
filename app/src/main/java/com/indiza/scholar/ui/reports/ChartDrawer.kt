package com.indiza.scholar.ui.reports

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF

object ChartDrawer {

    fun drawPieChart(data: List<Pair<String, Double>>, colors: List<Int>): Bitmap {
        val size = 500
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.BLACK
            textSize = 14f
        }
        val rect = RectF(100f, 100f, size - 100f, size - 100f)

        val total = data.sumOf { it.second }
        var currentAngle = 0f

        data.forEachIndexed { index, pair ->
            val sweepAngle = ((pair.second / total) * 360f).toFloat()
            paint.color = colors[index % colors.size]
            canvas.drawArc(rect, currentAngle, sweepAngle, true, paint)
            
            // Draw small legend color box
            paint.style = Paint.Style.FILL
            canvas.drawRect(10f, 10f + index * 25f, 30f, 30f + index * 25f, paint)
            canvas.drawText("${pair.first} (${pair.second.toInt()}%)", 35f, 25f + index * 25f, textPaint)
            
            currentAngle += sweepAngle
        }

        return bitmap
    }

    fun drawBarChart(data: List<Pair<String, Double>>, colors: List<Int>): Bitmap {
        val width = 800
        val height = 500
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.BLACK
            textSize = 18f
            textAlign = Paint.Align.CENTER
        }

        val maxVal = data.maxOfOrNull { it.second } ?: 1.0
        val barWidth = (width - 100f) / data.size
        val scale = (height - 100f) / maxVal

        data.forEachIndexed { index, pair ->
            paint.color = colors[index % colors.size]
            val barHeight = (pair.second * scale).toFloat()
            val left = 50f + index * barWidth + 15f
            val top = height - 50f - barHeight
            val right = 50f + (index + 1) * barWidth - 15f
            val bottom = height - 50f
            
            canvas.drawRect(left, top, right, bottom, paint)
            
            // Labels
            canvas.drawText(pair.first, left + (right - left) / 2, height - 20f, textPaint)
        }
        
        // Baseline
        paint.color = Color.BLACK
        paint.strokeWidth = 2f
        canvas.drawLine(50f, height - 50f, width - 50f, height - 50f, paint)

        return bitmap
    }
}
