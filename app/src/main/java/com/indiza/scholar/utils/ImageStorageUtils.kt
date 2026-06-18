package com.indiza.scholar.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

object ImageStorageUtils {
    
    fun saveUserPhoto(context: Context, uri: Uri, userId: Long): String? {
        val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
        val bitmap = BitmapFactory.decodeStream(inputStream)
        
        val directory = File(context.filesDir, "user_photos")
        if (!directory.exists()) directory.mkdirs()
        
        val file = File(directory, "user_$userId.jpg")
        return try {
            val out = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
            out.flush()
            out.close()
            file.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    fun getUserPhoto(context: Context, userId: Long): File? {
        val file = File(context.filesDir, "user_photos/user_$userId.jpg")
        return if (file.exists()) file else null
    }

    fun deleteUserPhoto(context: Context, userId: Long): Boolean {
        val file = File(context.filesDir, "user_photos/user_$userId.jpg")
        return if (file.exists()) file.delete() else false
    }
}
