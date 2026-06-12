package com.indiza.scholar.ui.dashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.platform.ComposeView
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.indiza.scholar.R
import com.indiza.scholar.databinding.FragmentDashboardBinding
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.theme.ScholarTheme

class DashboardFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val userSession = requireContext().getSharedPreferences("user_session", android.content.Context.MODE_PRIVATE)
        val appConfig = requireContext().getSharedPreferences("app_config", android.content.Context.MODE_PRIVATE)
        
        val token = userSession.getString("token", null)
        val apiService = ApiClient.create { token }.create(ApiService::class.java)
        
        val userId = userSession.getLong("userId", 0L)
        val userName = userSession.getString("name", "Utilisateur") ?: "Utilisateur"
        val userRole = userSession.getString("role", "") ?: ""
        val schoolId = appConfig.getLong("school_id", 0L)
        val schoolName = appConfig.getString("school_name", "Mon École") ?: "Mon École"

        return ComposeView(requireContext()).apply {
            setContent {
                ScholarTheme {
                    NewsFeedScreen(
                        apiService = apiService,
                        userId = userId,
                        userName = userName,
                        userRole = userRole,
                        schoolId = schoolId,
                        schoolName = schoolName,
                        onNavigateToSetup = {
                            requireContext().getSharedPreferences("app_config", android.content.Context.MODE_PRIVATE)
                                .edit().putBoolean("setup_complete", false).apply()
                            requireActivity().recreate()
                        }
                    )
                }
            }
        }
    }
}
