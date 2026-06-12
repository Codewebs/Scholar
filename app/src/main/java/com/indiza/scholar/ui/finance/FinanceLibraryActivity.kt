package com.indiza.scholar.ui.finance

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.indiza.scholar.model.FraisExigibleEntity
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.theme.ScholarTheme

class FinanceLibraryActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val api = ApiClient.create {
            getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
        }.create(ApiService::class.java)

        setContent {
            ScholarTheme {
                FinanceLibraryScreen(api) { finish() }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FinanceLibraryScreen(api: ApiService, onBack: () -> Unit) {
    var library by remember { mutableStateOf<List<FraisExigibleEntity>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showAddDialog by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    fun loadLibrary() {
        isLoading = true
        errorMessage = null
        // Simplification for now: direct API call or use a VM
        // Since we are in Settings, a VM is better for state.
    }

    // Temporary placeholder for direct API state management for speed of implementation
    val scope = rememberCoroutineScope()
    
    LaunchedEffect(Unit) {
        val response = api.getFraisExigiblesLibrary()
        if (response.isSuccessful) library = response.body() ?: emptyList()
        isLoading = false
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Bibliothèque des Frais", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A))
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }, containerColor = Color(0xFF1ABC9C)) {
                Icon(Icons.Default.Add, null, tint = Color.White)
            }
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            if (errorMessage != null) {
                Text(errorMessage!!, color = Color.Red, modifier = Modifier.padding(bottom = 8.dp))
            }

            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(library) { frais ->
                        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(frais.fraisFr, color = Color.White, fontWeight = FontWeight.Bold)
                                    Text(frais.fraisEn, color = Color.Gray, fontSize = 12.sp)
                                }
                                IconButton(onClick = {
                                    // DELETE Logic with backend check
                                    // api.deleteFraisExigible(frais.idFraisExigible)
                                }) { 
                                    Icon(Icons.Default.Delete, null, tint = Color.Red) 
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
