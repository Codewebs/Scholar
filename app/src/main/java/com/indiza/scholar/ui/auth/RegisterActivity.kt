package com.indiza.scholar.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.LoginResponse
import com.indiza.scholar.model.Utilisateur
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.ScholarTitle
import com.indiza.scholar.ui.theme.ScholarTheme
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : ComponentActivity() {

    private val api by lazy {
        ApiClient.create {
            getSharedPreferences("user_session", MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ScholarTheme {
                RegisterScreen(
                    onRegister = { fn, ln, em, tel, pw, cpw -> handleRegister(fn, ln, em, tel, pw, cpw) },
                    onGoToLogin = {
                        startActivity(Intent(this, LoginActivity::class.java))
                        finish()
                    }
                )
            }
        }
    }

    private fun handleRegister(fname: String, lname: String, email: String, telephone: String, password: String, confirmPassword: String) {
        if (fname.isEmpty() || lname.isEmpty() || email.isEmpty() || telephone.isEmpty() || password.isEmpty() || confirmPassword.isEmpty()) {
            Toast.makeText(this, "Tous les champs sont obligatoires", Toast.LENGTH_SHORT).show()
            return
        }

        if (password != confirmPassword) {
            Toast.makeText(this, "Les mots de passe ne correspondent pas", Toast.LENGTH_SHORT).show()
            return
        }

        val user = Utilisateur(
            identifiant = "${fname.lowercase().trim()}.${lname.lowercase().trim()}",
            nom = "$fname $lname",
            email = email.trim(),
            telephone = telephone.toLongOrNull(),
            password = password,
            confirmPassword = confirmPassword
        )

        api.register(user).enqueue(object : Callback<LoginResponse> {
            override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                val body = response.body()
                if (response.isSuccessful && body?.status == "ok") {
                    Toast.makeText(this@RegisterActivity, "Compte créé ! Connectez-vous.", Toast.LENGTH_LONG).show()
                    startActivity(Intent(this@RegisterActivity, LoginActivity::class.java))
                    finish()
                } else {
                    Toast.makeText(this@RegisterActivity, body?.message ?: "Erreur d'inscription", Toast.LENGTH_SHORT).show()
                }
            }
            override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                Toast.makeText(this@RegisterActivity, "Erreur réseau : ${t.message}", Toast.LENGTH_LONG).show()
            }
        })
    }
}

@Composable
fun RegisterScreen(
    onRegister: (String, String, String, String, String, String) -> Unit,
    onGoToLogin: () -> Unit
) {
    var fname by remember { mutableStateOf("") }
    var lname by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var telephone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }
    var isRegistering by remember { mutableStateOf(false) }

    val infiniteTransition = rememberInfiniteTransition(label = "breathing")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.6f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "glow"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF1A0B2E), Color(0xFF4A148C), Color(0xFF311B92))
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // Glowing background elements
        Box(
            modifier = Modifier
                .size(400.dp)
                .offset(x = 100.dp, y = (-250).dp)
                .blur(100.dp)
                .background(Color(0xFF7B1FA2).copy(alpha = glowAlpha), RoundedCornerShape(200.dp))
        )

        Column(
            modifier = Modifier
                .padding(24.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(Color.White.copy(alpha = 0.1f))
                .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(24.dp))
                .padding(24.dp)
                .fillMaxWidth(0.95f)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            ScholarTitle(color = Color.White)
            Spacer(modifier = Modifier.height(24.dp))

            Text(
                "Inscription",
                style = TextStyle(
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    shadow = Shadow(color = Color.Black.copy(alpha = 0.3f), blurRadius = 8f)
                )
            )
            
            Spacer(modifier = Modifier.height(24.dp))

            GlassTextField(value = fname, onValueChange = { fname = it }, label = "Prénom")
            Spacer(modifier = Modifier.height(12.dp))
            GlassTextField(value = lname, onValueChange = { lname = it }, label = "Nom")
            Spacer(modifier = Modifier.height(12.dp))
            GlassTextField(value = email, onValueChange = { email = it }, label = "Email")
            Spacer(modifier = Modifier.height(12.dp))
            GlassTextField(value = telephone, onValueChange = { telephone = it }, label = "Téléphone")
            Spacer(modifier = Modifier.height(12.dp))
            
            GlassTextField(
                value = password,
                onValueChange = { password = it },
                label = "Mot de passe",
                isPassword = true,
                passwordVisible = passwordVisible,
                onPasswordToggle = { passwordVisible = !passwordVisible }
            )
            Spacer(modifier = Modifier.height(12.dp))
            
            GlassTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                label = "Confirmer le mot de passe",
                isPassword = true,
                passwordVisible = confirmPasswordVisible,
                onPasswordToggle = { confirmPasswordVisible = !confirmPasswordVisible }
            )

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = { 
                    isRegistering = true
                    onRegister(fname, lname, email, telephone, password, confirmPassword)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = !isRegistering,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White.copy(alpha = 0.2f),
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
            ) {
                if (isRegistering) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                } else {
                    Text("Créer mon compte", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            TextButton(onClick = onGoToLogin) {
                Text("Déjà un compte ? Se connecter", color = Color.White.copy(alpha = 0.7f))
            }
        }
    }
}
