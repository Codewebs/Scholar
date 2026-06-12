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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.MainActivity
import com.indiza.scholar.model.LoginResponse
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.ScholarTitle
import com.indiza.scholar.ui.theme.ScholarTheme
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LoginActivity : ComponentActivity() {

    private val api by lazy {
        ApiClient.create {
            getSharedPreferences("user_session", MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = getSharedPreferences("user_session", MODE_PRIVATE)
        if (prefs.getString("token", null) != null) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        setContent {
            ScholarTheme {
                LoginScreen(
                    onLogin = { ident, mdp -> handleLogin(ident, mdp) },
                    onRegister = { startActivity(Intent(this, RegisterActivity::class.java)) }
                )
            }
        }
    }

    private fun handleLogin(identifiant: String, mdp: String) {
        if (identifiant.isEmpty() || mdp.isEmpty()) {
            Toast.makeText(this, "Veuillez remplir tous les champs", Toast.LENGTH_SHORT).show()
            return
        }

        api.login(mapOf("identifiant" to identifiant, "mdp" to mdp)).enqueue(object : Callback<LoginResponse> {
            override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                val body = response.body()
                if (response.isSuccessful && body?.success == true) {
                    getSharedPreferences("user_session", MODE_PRIVATE).edit().apply {
                        putString("token", body.token)
                        putLong("userId", body.userId ?: -1)
                        putString("identifiant", identifiant)
                        putString("name", body.name)
                        putString("role", body.role)
                        putString("email", body.email)
                        putLong("telephone", body.telephone ?: 0L)
                        apply()
                    }
                    startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                    finish()
                } else {
                    Toast.makeText(this@LoginActivity, "Identifiants invalides", Toast.LENGTH_SHORT).show()
                }
            }
            override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                Toast.makeText(this@LoginActivity, "Erreur réseau : ${t.message}", Toast.LENGTH_LONG).show()
            }
        })
    }
}

@Composable
fun LoginScreen(onLogin: (String, String) -> Unit, onRegister: () -> Unit) {
    var identifiant by remember { mutableStateOf("") }
    var mdp by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    // Breathing Animation
    val infiniteTransition = rememberInfiniteTransition(label = "breathing")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "glow"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF1A0B2E), Color(0xFF3B125A), Color(0xFF5E1B89))
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // Decorative glowing circles
        Box(
            modifier = Modifier
                .size(300.dp)
                .offset(x = (-100).dp, y = (-200).dp)
                .blur(80.dp)
                .background(Color(0xFF8E24AA).copy(alpha = glowAlpha), RoundedCornerShape(150.dp))
        )
        Box(
            modifier = Modifier
                .size(250.dp)
                .offset(x = 150.dp, y = 250.dp)
                .blur(70.dp)
                .background(Color(0xFF311B92).copy(alpha = glowAlpha), RoundedCornerShape(125.dp))
        )

        Column(
            modifier = Modifier
                .padding(24.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(Color.White.copy(alpha = 0.1f))
                .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(24.dp))
                .padding(32.dp)
                .fillMaxWidth(0.9f),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            ScholarTitle(color = Color.White)
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                "Connexion",
                style = TextStyle(
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    shadow = Shadow(color = Color.Black.copy(alpha = 0.3f), blurRadius = 8f)
                )
            )
            
            Spacer(modifier = Modifier.height(32.dp))

            GlassTextField(
                value = identifiant,
                onValueChange = { identifiant = it },
                label = "Email ou Identifiant"
            )

            Spacer(modifier = Modifier.height(16.dp))

            GlassTextField(
                value = mdp,
                onValueChange = { mdp = it },
                label = "Mot de passe",
                isPassword = true,
                passwordVisible = passwordVisible,
                onPasswordToggle = { passwordVisible = !passwordVisible }
            )

            Spacer(modifier = Modifier.height(40.dp))

            Button(
                onClick = { onLogin(identifiant, mdp) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White.copy(alpha = 0.2f),
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
            ) {
                Text("Se connecter", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
            }

            Spacer(modifier = Modifier.height(16.dp))

            TextButton(onClick = onRegister) {
                Text("Créer un compte", color = Color.White.copy(alpha = 0.7f))
            }
        }
    }
}
