package com.deograce.subscriptionmanager.ui.screens.clientlist

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.deograce.subscriptionmanager.domain.model.Client
import com.deograce.subscriptionmanager.domain.model.SubscriptionStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClientListScreen(
    onAddClient: () -> Unit,
    onClientClick: (Long) -> Unit,
    viewModel: ClientListViewModel = hiltViewModel()
) {
    val clients by viewModel.clients.collectAsState()
    var clientToDelete by remember { mutableStateOf<Client?>(null) }
    var searchQuery by remember { mutableStateOf("") }

    val filtered = clients.filter {
        it.name.contains(searchQuery, ignoreCase = true) ||
        it.phoneNumber.contains(searchQuery) ||
        it.subscriptionType.contains(searchQuery, ignoreCase = true)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mes Abonnements", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddClient) {
                Icon(Icons.Default.Add, contentDescription = "Ajouter client")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(Modifier.height(12.dp))

            // Stats row
            StatsRow(clients)

            Spacer(Modifier.height(12.dp))

            // Search
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Rechercher un client...") },
                leadingIcon = { Icon(Icons.Default.Search, null) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Close, null)
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(Modifier.height(12.dp))

            if (filtered.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.People, null, modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.outline)
                        Spacer(Modifier.height(8.dp))
                        Text("Aucun client", color = MaterialTheme.colorScheme.outline)
                    }
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(filtered, key = { it.id }) { client ->
                        ClientCard(
                            client = client,
                            onClick = { onClientClick(client.id) },
                            onDelete = { clientToDelete = client }
                        )
                    }
                    item { Spacer(Modifier.height(80.dp)) }
                }
            }
        }
    }

    clientToDelete?.let { client ->
        AlertDialog(
            onDismissRequest = { clientToDelete = null },
            title = { Text("Supprimer le client") },
            text = { Text("Voulez-vous supprimer ${client.name} ?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteClient(client)
                    clientToDelete = null
                }) { Text("Supprimer", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = {
                TextButton(onClick = { clientToDelete = null }) { Text("Annuler") }
            }
        )
    }
}

@Composable
private fun StatsRow(clients: List<Client>) {
    val active = clients.count { it.status == SubscriptionStatus.ACTIVE }
    val expiringSoon = clients.count { it.status == SubscriptionStatus.EXPIRING_SOON }
    val expired = clients.count { it.status == SubscriptionStatus.EXPIRED }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        StatChip("Actifs", active, Color(0xFF2E7D32), Modifier.weight(1f))
        StatChip("Bientôt", expiringSoon, Color(0xFFE65100), Modifier.weight(1f))
        StatChip("Expirés", expired, Color(0xFFB71C1C), Modifier.weight(1f))
    }
}

@Composable
private fun StatChip(label: String, count: Int, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.12f))
    ) {
        Column(
            modifier = Modifier.padding(8.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("$count", style = MaterialTheme.typography.titleLarge, color = color, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.labelSmall, color = color)
        }
    }
}

@Composable
private fun ClientCard(
    client: Client,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    val statusColor = when (client.status) {
        SubscriptionStatus.ACTIVE -> Color(0xFF2E7D32)
        SubscriptionStatus.EXPIRING_SOON -> Color(0xFFE65100)
        SubscriptionStatus.EXPIRED -> Color(0xFFB71C1C)
        SubscriptionStatus.INACTIVE -> Color.Gray
    }

    val statusLabel = when (client.status) {
        SubscriptionStatus.ACTIVE -> "Actif"
        SubscriptionStatus.EXPIRING_SOON -> "Expire bientôt"
        SubscriptionStatus.EXPIRED -> "Expiré"
        SubscriptionStatus.INACTIVE -> "Inactif"
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Status indicator
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(statusColor, shape = RoundedCornerShape(50))
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(client.name, fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium)
                Text(client.subscriptionType, style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary)
                Text(client.phoneNumber, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.outline)
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        color = statusColor.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            statusLabel,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = statusColor,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    if (client.daysUntilExpiration >= 0) {
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Expire dans ${client.daysUntilExpiration}j",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.outline
                        )
                    }
                }
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}
