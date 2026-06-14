package com.indiza.scholar.ui.auth

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.MainActivity
import com.indiza.scholar.model.LoginResponse
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.setup.ServerConfigBottomSheet
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
            var isDarkMode by remember { mutableStateOf(false) } // This should ideally come from a DataStore/Prefs
            ScholarTheme(darkTheme = isDarkMode) {
                LoginScreen(
                    onLogin = { ident, mdp -> handleLogin(ident, mdp) },
                    onRegister = { startActivity(Intent(this, RegisterActivity::class.java)) },
                    isDark = isDarkMode,
                    onThemeToggle = { isDarkMode = !isDarkMode }
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLogin: (String, String) -> Unit, 
    onRegister: () -> Unit,
    isDark: Boolean,
    onThemeToggle: () -> Unit
) {
    var identifiant by remember { mutableStateOf("") }
    var mdp by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoggingIn by remember { mutableStateOf(false) }
    var showServerConfig by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = { /* Could go to a welcome/intro screen */ }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    ServerConfigIcon(onClick = { showServerConfig = true })
                    ThemeToggleIcon(isDark = isDark, onToggle = onThemeToggle)
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface,
                    actionIconContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.surface
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(24.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "Let's Sign you in.",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Black,
                color = MaterialTheme.colorScheme.onSurface,
                lineHeight = 44.sp
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Welcome back.",
                style = MaterialTheme.typography.titleLarge,
                color = Color(0xFF9E9E9E)
            )
            Text(
                text = "You've been missed!",
                style = MaterialTheme.typography.titleLarge,
                color = Color(0xFF9E9E9E)
            )

            Spacer(modifier = Modifier.height(48.dp))

            ModernTextField(
                value = identifiant,
                onValueChange = { identifiant = it },
                label = "Username or Email",
                placeholder = "Enter your username"
            )

            Spacer(modifier = Modifier.height(24.dp))

            ModernTextField(
                value = mdp,
                onValueChange = { mdp = it },
                label = "Password",
                placeholder = "Enter your password",
                isPassword = true,
                passwordVisible = passwordVisible,
                onPasswordToggle = { passwordVisible = !passwordVisible }
            )

            Spacer(modifier = Modifier.height(48.dp))

            SocialLoginRow()

            Spacer(modifier = Modifier.weight(1f))
            Spacer(modifier = Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Don't have an account?",
                    color = Color(0xFF9E9E9E),
                    style = MaterialTheme.typography.bodyMedium
                )
                TextButton(onClick = onRegister) {
                    Text(
                        "Register",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            ModernButton(
                text = "Login",
                onClick = { 
                    isLoggingIn = true
                    onLogin(identifiant, mdp) 
                },
                isLoading = isLoggingIn
            )
            
            Spacer(modifier = Modifier.height(16.dp))
        }

        if (showServerConfig) {
            ServerConfigBottomSheet(onDismiss = { showServerConfig = false })
        }
    }
}
