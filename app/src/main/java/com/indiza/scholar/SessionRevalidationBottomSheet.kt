package com.indiza.scholar

import android.content.Context
import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.LoginResponse
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import kotlinx.coroutines.launch
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SessionRevalidationBottomSheet(
    userId: Long,
    onSuccess: (String) -> Unit,
    onLogout: () -> Unit
) {
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current

    ModalBottomSheet(onDismissRequest = { /* Empêcher la fermeture facile si nécessaire */ }) {
        Column(modifier = Modifier
            .padding(16.dp)
            .fillMaxWidth()
            .padding(bottom = 32.dp)) {
            Text("Session expirée", style = MaterialTheme.typography.headlineSmall)
            Text("Veuillez confirmer votre mot de passe pour continuer.", color = Color.Gray)

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { 
                    password = it 
                    errorMsg = null
                },
                label = { Text("Mot de passe") },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                isError = errorMsg != null
            )

            if (errorMsg != null) {
                Text(errorMsg!!, color = Color.Red, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    isLoading = true
                    errorMsg = null
                    val prefs = context.getSharedPreferences("user_session", Context.MODE_PRIVATE)
                    val identifiant = prefs.getString("identifiant", "") ?: ""

                    if (identifiant.isEmpty()) {
                        errorMsg = "Identifiant introuvable. Veuillez vous reconnecter normalement."
                        isLoading = false
                        return@Button
                    }

                    val apiService = ApiClient.create { null }.create(ApiService::class.java)
                    val loginRequest = mapOf("identifiant" to identifiant, "mdp" to password)

                    apiService.login(loginRequest).enqueue(object : Callback<LoginResponse> {
                        override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                            isLoading = false
                            val body = response.body()
                            if (response.isSuccessful && body != null && body.success) {
                                body.token?.let { newToken ->
                                    onSuccess(newToken)
                                } ?: run {
                                    errorMsg = "Erreur: Token non reçu"
                                }
                            } else {
                                errorMsg = body?.message ?: "Mot de passe incorrect ou erreur serveur"
                            }
                        }

                        override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                            isLoading = false
                            errorMsg = "Erreur réseau: ${t.localizedMessage}"
                            Log.e("Revalidation", "Erreur login", t)
                        }
                    })
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = password.isNotBlank() && !isLoading,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text("Reprendre la session")
                }
            }

            TextButton(
                onClick = onLogout, 
                modifier = Modifier.align(Alignment.CenterHorizontally),
                enabled = !isLoading
            ) {
                Text("Se déconnecter", color = Color.Red)
            }
        }
    }
}
