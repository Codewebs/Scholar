package com.indiza.scholar.ui.auth

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.LoginResponse
import com.indiza.scholar.model.Utilisateur
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
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
            var isDarkMode by remember { mutableStateOf(false) }
            ScholarTheme(darkTheme = isDarkMode) {
                RegisterScreen(
                    onRegister = { fn, ln, em, tel, pw, cpw -> handleRegister(fn, ln, em, tel, pw, cpw) },
                    onGoToLogin = {
                        startActivity(Intent(this, LoginActivity::class.java))
                        finish()
                    },
                    isDark = isDarkMode,
                    onThemeToggle = { isDarkMode = !isDarkMode }
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    onRegister: (String, String, String, String, String, String) -> Unit,
    onGoToLogin: () -> Unit,
    isDark: Boolean,
    onThemeToggle: () -> Unit
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
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val emailRegex = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$".toRegex()

    val emailError = if (email.isNotEmpty() && !emailRegex.matches(email)) {
        "Format d'email invalide"
    } else null

    val passwordError = if (password.isNotEmpty() && password.length < 4) {
        "Le mot de passe doit contenir au moins 4 caractères"
    } else null

    val confirmPasswordError = if (confirmPassword.isNotEmpty() && confirmPassword != password) {
        "Les mots de passe ne correspondent pas"
    } else null

    val isFormValid = fname.isNotBlank() && lname.isNotBlank() && email.isNotBlank() && telephone.isNotBlank() &&
            password.isNotBlank() && confirmPassword.isNotBlank() &&
            emailError == null && passwordError == null && confirmPasswordError == null

    Scaffold(
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = onGoToLogin) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
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
                text = "Create an Account.",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Black,
                color = MaterialTheme.colorScheme.onSurface,
                lineHeight = 44.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Join our community today.",
                style = MaterialTheme.typography.titleLarge,
                color = Color(0xFF9E9E9E)
            )

            Spacer(modifier = Modifier.height(48.dp))

            ModernTextField(value = fname, onValueChange = { fname = it }, label = "First Name", placeholder = "Enter your first name")
            Spacer(modifier = Modifier.height(20.dp))
            ModernTextField(value = lname, onValueChange = { lname = it }, label = "Last Name", placeholder = "Enter your last name")
            Spacer(modifier = Modifier.height(20.dp))
            ModernTextField(value = email, onValueChange = { email = it }, label = "Email", placeholder = "Enter your email", error = emailError)
            Spacer(modifier = Modifier.height(20.dp))
            ModernTextField(value = telephone, onValueChange = { telephone = it }, label = "Phone", placeholder = "Enter your phone number")
            Spacer(modifier = Modifier.height(20.dp))

            ModernTextField(
                value = password,
                onValueChange = { password = it },
                label = "Password",
                placeholder = "Create a password",
                isPassword = true,
                passwordVisible = passwordVisible,
                onPasswordToggle = { passwordVisible = !passwordVisible },
                error = passwordError
            )
            Spacer(modifier = Modifier.height(20.dp))

            ModernTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                label = "Confirm Password",
                placeholder = "Confirm your password",
                isPassword = true,
                passwordVisible = confirmPasswordVisible,
                onPasswordToggle = { confirmPasswordVisible = !confirmPasswordVisible },
                error = confirmPasswordError
            )

            if (errorMessage != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = errorMessage!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }

            Spacer(modifier = Modifier.height(48.dp))

            ModernButton(
                text = "Register",
                onClick = {
                    if (fname.isBlank() || lname.isBlank() || email.isBlank() || telephone.isBlank() || password.isBlank() || confirmPassword.isBlank()) {
                        errorMessage = "Tous les champs sont obligatoires"
                    } else if (password != confirmPassword) {
                        errorMessage = "Les mots de passe ne correspondent pas"
                    } else {
                        errorMessage = null
                        isRegistering = true
                        onRegister(fname, lname, email, telephone, password, confirmPassword)
                    }
                },
                isLoading = isRegistering,
                enabled = isFormValid
            )

            Spacer(modifier = Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Already have an account?",
                    color = Color(0xFF9E9E9E),
                    style = MaterialTheme.typography.bodyMedium
                )
                TextButton(onClick = onGoToLogin) {
                    Text(
                        "Login",
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
