package com.indiza.scholar.network

import android.util.Log
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.converter.moshi.MoshiConverterFactory


object ApiClient {
    private const val DEFAULT_BASE_URL = "http://192.168.0.50:4000/"
    private var currentBaseUrl: String? = null

    fun getBaseUrl(context: android.content.Context? = null): String {
        if (currentBaseUrl != null) return currentBaseUrl!!
        
        context?.let {
            val prefs = it.getSharedPreferences("app_config", android.content.Context.MODE_PRIVATE)
            val savedIp = prefs.getString("server_ip", null)
            if (!savedIp.isNullOrBlank()) {
                currentBaseUrl = if (savedIp.startsWith("http")) savedIp else "http://$savedIp:4000/"
                return currentBaseUrl!!
            }
        }
        return DEFAULT_BASE_URL
    }

    fun init(context: android.content.Context) {
        getBaseUrl(context)
    }

    fun updateBaseUrl(newIp: String) {
        currentBaseUrl = if (newIp.startsWith("http")) newIp else "http://$newIp:4000/"
    }

    fun create(tokenProvider: () -> String?): Retrofit {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                var request = chain.request()
                
                // --- Dynamic Base URL Rewriting ---
                val newBaseUrl = getBaseUrl().toHttpUrlOrNull()
                if (newBaseUrl != null) {
                    val newUrl = request.url.newBuilder()
                        .scheme(newBaseUrl.scheme)
                        .host(newBaseUrl.host)
                        .port(newBaseUrl.port)
                        .build()
                    request = request.newBuilder().url(newUrl).build()
                }

                Log.d("ApiClient", "🚀 Envoi ${request.method} vers ${request.url}")
                
                val builder = request.newBuilder()
                tokenProvider()?.let { t ->
                    builder.addHeader("Authorization", "Bearer $t")
                }
                builder.addHeader("Accept", "application/json")
                val response = chain.proceed(builder.build())
                
                Log.d("ApiClient", "⬅️ Reçu ${response.code} pour ${request.url}")

                if (response.code == 401) {
                    Log.e("ApiClient", "⚠️ SESSION EXPIRÉE : Le token n'est plus valide.")


                    CoroutineScope(Dispatchers.IO).launch {
                        NotificationEventBus.emit(NotificationEvent.SessionExpired)
                    }
                }

                if (response.code == 403) {
                    val bodyString = response.peekBody(Long.MAX_VALUE).string()
                    if (bodyString.contains("USER_BLOCKED")) {
                        Log.w("ApiClient", "🚫 Utilisateur bloqué détecté !")
                    }
                }
                
                response
            }
            .build()

        val moshi = Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()

        return Retrofit.Builder()
            .baseUrl(getBaseUrl())
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }
}
