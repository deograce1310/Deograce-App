package com.deograce.subscriptionmanager.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.deograce.subscriptionmanager.ui.screens.clientform.ClientFormScreen
import com.deograce.subscriptionmanager.ui.screens.clientlist.ClientListScreen
import com.deograce.subscriptionmanager.ui.screens.clientdetail.ClientDetailScreen

sealed class Screen(val route: String) {
    object ClientList : Screen("client_list")
    object ClientForm : Screen("client_form?clientId={clientId}") {
        fun createRoute(clientId: Long? = null) =
            if (clientId != null) "client_form?clientId=$clientId" else "client_form"
    }
    object ClientDetail : Screen("client_detail/{clientId}") {
        fun createRoute(clientId: Long) = "client_detail/$clientId"
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = Screen.ClientList.route) {
        composable(Screen.ClientList.route) {
            ClientListScreen(
                onAddClient = { navController.navigate(Screen.ClientForm.createRoute()) },
                onClientClick = { id -> navController.navigate(Screen.ClientDetail.createRoute(id)) }
            )
        }
        composable(
            route = Screen.ClientForm.route,
            arguments = listOf(navArgument("clientId") {
                type = NavType.LongType; defaultValue = -1L
            })
        ) { backStackEntry ->
            val clientId = backStackEntry.arguments?.getLong("clientId")?.takeIf { it != -1L }
            ClientFormScreen(
                clientId = clientId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(
            route = Screen.ClientDetail.route,
            arguments = listOf(navArgument("clientId") { type = NavType.LongType })
        ) { backStackEntry ->
            val clientId = backStackEntry.arguments!!.getLong("clientId")
            ClientDetailScreen(
                clientId = clientId,
                onNavigateBack = { navController.popBackStack() },
                onEdit = { navController.navigate(Screen.ClientForm.createRoute(clientId)) }
            )
        }
    }
}
