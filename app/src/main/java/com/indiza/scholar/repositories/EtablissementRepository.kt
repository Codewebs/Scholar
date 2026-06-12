package com.indiza.scholar.repositories

import android.content.Context
import android.net.Uri
import com.indiza.scholar.dao.EtablissementDao
import com.indiza.scholar.model.EtablissementEntity
import com.indiza.scholar.network.EtablissementApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.ByteArrayOutputStream

class EtablissementRepository(
    private val dao: EtablissementDao,
    private val api: EtablissementApi
) {
    val etablissement: Flow<EtablissementEntity?> = dao.getEtablissement()

    suspend fun updateLocal(etablissement: EtablissementEntity) {
        dao.insertOrUpdate(etablissement.copy(pendingSync = true))
    }

    suspend fun syncEtablissement(entity: EtablissementEntity) {
        try {
            val dto = com.indiza.scholar.network.EtablissementDto(
                idEtablissement = entity.idServeur,
                nomFr = entity.nomFr,
                nomEn = entity.nomEn,
                abreviation = entity.abreviation,
                adresse = entity.adresse,
                arrete = entity.arrete,
                description = entity.description,
                devise = entity.devise,
                deviseEn = entity.deviseEn,
                deviseFr = entity.deviseFr,
                email = entity.email,
                fax = entity.fax,
                logo = entity.logo,
                numBp = entity.numBp,
                sise = entity.sise,
                siteWeb = entity.siteWeb,
                telephone1 = entity.telephone1,
                telephone2 = entity.telephone2,
                telephone3 = entity.telephone3,
                ville = entity.ville
            )
            if (entity.idServeur != null) {
                api.updateEtablissement(entity.idServeur, dto)
                dao.insertOrUpdate(entity.copy(pendingSync = false))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun getUserSchools(userId: Long) = api.getUserSchools(userId)

    suspend fun fetchAndSaveSchool(schoolId: Long) {
        try {
            val dto = api.getSchoolById(schoolId)
            val entity = EtablissementEntity(
                idServeur = dto.idEtablissement,
                nomFr = dto.nomFr,
                nomEn = dto.nomEn,
                abreviation = dto.abreviation,
                adresse = dto.adresse,
                arrete = dto.arrete,
                description = dto.description,
                devise = dto.devise,
                deviseEn = dto.deviseEn,
                deviseFr = dto.deviseFr,
                email = dto.email,
                fax = dto.fax,
                logo = dto.logo,
                numBp = dto.numBp,
                sise = dto.sise,
                siteWeb = dto.siteWeb,
                telephone1 = dto.telephone1,
                telephone2 = dto.telephone2,
                telephone3 = dto.telephone3,
                ville = dto.ville
            )
            dao.insertOrUpdate(entity)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun uploadLogo(uri: Uri, context: Context): String? = withContext(Dispatchers.IO) {
        try {
            val file = compressAndSaveImage(uri, context) ?: return@withContext null
            val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("logo", file.name, requestFile)
            val response = api.uploadLogo(body)
            response.filename
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun compressAndSaveImage(uri: Uri, context: Context): File? {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri) ?: return null
            val originalBitmap = BitmapFactory.decodeStream(inputStream) ?: return null
            
            // Redimensionner si l'image est trop grande (max 1024px)
            val ratio = originalBitmap.width.toFloat() / originalBitmap.height.toFloat()
            val targetWidth = 1024
            val targetHeight = (targetWidth / ratio).toInt()
            
            val scaledBitmap = Bitmap.createScaledBitmap(originalBitmap, targetWidth, targetHeight, true)
            
            val file = File(context.cacheDir, "logo_${System.currentTimeMillis()}.jpg")
            val out = FileOutputStream(file)
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 80, out) // 80% qualité JPEG
            out.flush()
            out.close()
            
            file
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun uriToFile(uri: Uri, context: Context): File? {
        val contentResolver = context.contentResolver
        val inputStream = contentResolver.openInputStream(uri) ?: return null
        val file = File(context.cacheDir, "temp_logo_${System.currentTimeMillis()}.png")
        val outputStream = FileOutputStream(file)
        inputStream.use { input -> outputStream.use { output -> input.copyTo(output) } }
        return file
    }
}