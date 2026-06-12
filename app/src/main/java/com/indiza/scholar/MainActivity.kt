package com.indiza.scholar

import android.Manifest
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.annotation.RequiresPermission
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.*
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.indiza.scholar.data.AppDatabase
import com.indiza.scholar.databinding.ActivityMainBinding
import com.indiza.scholar.model.SyncConfig
import com.indiza.scholar.network.*
import com.indiza.scholar.repositories.AnneeScolaireRepository
import com.indiza.scholar.repositories.PersonnelRepository
import com.indiza.scholar.ui.setup.InitialSetupScreen
import com.indiza.scholar.ui.setup.InitialSetupViewModel
import com.indiza.scholar.ui.setup.InitialSetupViewModelFactory
import com.indiza.scholar.ui.theme.ScholarTheme
import com.indiza.scholar.ui.theme.ThemeManager
import androidx.core.content.edit
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.indiza.scholar.SessionManager

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var repository: AnneeScolaireRepository
    private lateinit var personnelRepository: PersonnelRepository

    @RequiresPermission(Manifest.permission.ACCESS_NETWORK_STATE)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sessionPrefs = getSharedPreferences("user_session", Context.MODE_PRIVATE)
        val token = sessionPrefs.getString("token", null)
        val userId = sessionPrefs.getLong("userId", -1)

        if (token == null) {
            redirectToLogin()
            return
        }

        val configPrefs = getSharedPreferences("app_config", Context.MODE_PRIVATE)
        val isSetupComplete = configPrefs.getBoolean("setup_complete", false)

        val db = AppDatabase.getInstance(this)
        val apiService = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)

        personnelRepository = PersonnelRepository(apiService)

        // -------------------------------------------------------------
        // CAS 1 : CONFIGURATION INITIALE (ÉCRANS JETPACK COMPOSE)
        // -------------------------------------------------------------
        if (!isSetupComplete) {
            setContent {
                ScholarTheme {
                    // 🎧 Écoute globale de l'expiration de session dans le scope Compose
                    SessionExpirationListener(userId)

                    val factory = InitialSetupViewModelFactory(
                        api = apiService,
                        schoolDao = db.etablissementDao(),
                        yearDao = db.anneeScolaireDao(),
                        personnelRepository
                    )
                    val setupViewModel: InitialSetupViewModel = ViewModelProvider(this, factory)[InitialSetupViewModel::class.java]

                    val userName = sessionPrefs.getString("name", "Utilisateur") ?: "Utilisateur"
                    val userPhone = sessionPrefs.getLong("telephone", 0L)
                    val userEmail = sessionPrefs.getString("email", null)
                    
                    // ✅ Correction: Utiliser LaunchedEffect pour éviter de spammer setUserId à chaque recomposition
                    LaunchedEffect(userId) {
                        setupViewModel.setUserId(userId, userName, userPhone, userEmail)
                    }

                    InitialSetupScreen(
                        viewModel = setupViewModel,
                        onSetupComplete = { schoolId, yearId, lang ->
                            configPrefs.edit().apply {
                                putBoolean("setup_complete", true)
                                putLong("school_id", schoolId)
                                putLong("year_id", yearId)
                                putString("language", lang)
                                apply()
                            }
                            restartActivity()
                        },
                        onNavigateToTracker = {
                            configPrefs.edit().putBoolean("setup_complete", true).apply()
                            restartActivity()
                        }
                    )
                }
            }
            return
        }

        // -------------------------------------------------------------
        // CAS 2 : MODE NORMAL (VIEWS XML / NAV HOST FRAGMENT)
        // -------------------------------------------------------------
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 🎧 Injection d'une vue Compose éphémère dans le XML pour écouter le EventBus
        val globalComposeOverlay = ComposeView(this).apply {
            setContent {
                ScholarTheme {
                    SessionExpirationListener(userId)
                }
            }
        }
        // Ajout discret de l'écouteur à la racine de notre layout XML
        binding.root.addView(globalComposeOverlay)

        // Reste de l'initialisation normale
        val navView: BottomNavigationView = binding.navView
        val prefs = getSharedPreferences("settings", Context.MODE_PRIVATE)
        SyncConfig.isRemoteSyncEnabled = prefs.getBoolean("sync_enabled", false)

        repository = AnneeScolaireRepository(
            dao = db.anneeScolaireDao(),
            api = ApiClient.create {
                getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
            }.create(AnneeScolaireApi::class.java)
        )

        SyncManager.startSync(this, repository)

        val navController = findNavController(R.id.nav_host_fragment_activity_main)
        val appBarConfiguration = AppBarConfiguration(
            setOf(R.id.navigation_home, R.id.navigation_dashboard, R.id.navigation_notifications)
        )
        setupActionBarWithNavController(navController, appBarConfiguration)
        navView.setupWithNavController(navController)

        // Initialisation du SessionManager
        val schoolId = configPrefs.getLong("school_id", 0L)
        val yearId = configPrefs.getLong("year_id", 0L)
        val userRole = sessionPrefs.getString("role", "") ?: ""
        
        // Un utilisateur est considéré comme "actif" s'il a :
        // 1. Une école sélectionnée
        // 2. Une année sélectionnée
        // 3. Un rôle assigné ET un état "VALIDE" (donc validé par l'administration dans demande_inscription_personnel)
        val isContextComplete = schoolId > 0L && yearId > 0L && userRole.isNotBlank() && userRole != "GUEST"
        SessionManager.setContext(schoolId, yearId, isContextComplete)

        // Gestion de la redirection vers Dashboard si contexte incomplet
        lifecycleScope.launch {
            SessionManager.isUserActive.collect { isActive ->
                navView.menu.findItem(R.id.navigation_home).isEnabled = isActive
                if (!isActive && navController.currentDestination?.id == R.id.navigation_home) {
                    navController.navigate(R.id.navigation_dashboard)
                }
            }
        }
    }

    /**
     * 🎧 Composant d'écoute réutilisable qui déclenche le BottomSheet de validation
     */
    @Composable
    private fun SessionExpirationListener(userId: Long) {
        val event by NotificationEventBus.events.collectAsState(initial = null)
        var showRevalidate by remember { mutableStateOf(false) }

        LaunchedEffect(event) {
            if (event is NotificationEvent.SessionExpired) {
                showRevalidate = true
            }
        }

        if (showRevalidate) {
            SessionRevalidationBottomSheet(
                userId = userId, // On passe l'identifiant connu
                onSuccess = { newToken ->
                    showRevalidate = false
                    // Sauvegarde du nouveau Token rafraîchi
                    getSharedPreferences("user_session", Context.MODE_PRIVATE)
                        .edit {
                            putString("token", newToken)
                        }
                    Toast.makeText(this@MainActivity, "Session prolongée avec succès !", Toast.LENGTH_SHORT).show()
                },
                onLogout = {
                    showRevalidate = false
                    redirectToLogin()
                }
            )
        }
    }

    private fun redirectToLogin() {
        // Nettoyage de la session expirée
        getSharedPreferences("user_session", Context.MODE_PRIVATE).edit { clear() }
        startActivity(Intent(this, com.indiza.scholar.ui.auth.LoginActivity::class.java))
        finish()
    }

    private fun restartActivity() {
        val intent = intent
        finish()
        startActivity(intent)
    }
}