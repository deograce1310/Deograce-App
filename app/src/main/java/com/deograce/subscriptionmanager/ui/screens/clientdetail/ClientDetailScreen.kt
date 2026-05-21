package com.deograce.subscriptionmanager.ui.screens.clientdetail

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.deograce.subscriptionmanager.domain.model.Client
import com.deograce.subscriptionmanager.domain.model.SubscriptionStatus
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClientDetailScreen(
    clientId: Long,
    onNavigateBack: () -> Unit,
    onEdit: () -> Unit,
    viewModel: ClientDetailViewModel = hiltViewModel()
) {
    val client by viewModel.client.collectAsState()
    val formatter = DateTimeFormatter.ofPattern("dd MMMM yyyy", java.util.Locale.FRENCH)
    var showRenewDialog by remember { mutableStateOf(false) }

    LaunchedEffect(clientId) { viewModel.loadClient(clientId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(client?.name ?: "", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, null, tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Default.Edit, null, tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White
                )
            )
        }
    ) { padding ->
        client?.let { c ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                val statusColor = when (c.status) {
                    SubscriptionStatus.ACTIVE -> Color(0xFF2E7D32)
                    SubscriptionStatus.EXPIRING_SOON -> Color(0xFFE65100)
                    SubscriptionStatus.EXPIRED -> Color(0xFFB71C1C)
                    SubscriptionStatus.INACTIVE -> Color.Gray
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(statusColor.copy(alpha = 0.1f))
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .background(statusColor.copy(alpha = 0.2f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                c.name.take(1).uppercase(),
                                style = MaterialTheme.typography.headlineLarge,
                                color = statusColor,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                        Text(c.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        Text(c.subscriptionType, style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.height(8.dp))
                        val statusLabel = when (c.status) {
                            SubscriptionStatus.ACTIVE -> "Actif"
                            SubscriptionStatus.EXPIRING_SOON -> "Expire bientôt"
                            SubscriptionStatus.EXPIRED -> "Expiré"
                            SubscriptionStatus.INACTIVE -> "Inactif"
                        }
                        Surface(color = statusColor.copy(alpha = 0.15f), shape = RoundedCornerShape(20.dp)) {
                            Text(
                                statusLabel,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                                color = statusColor,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    DetailCard {
                        DetailRow(Icons.Default.Phone, "Téléphone", c.phoneNumber.ifBlank { "Non renseigné" })
                        Divider(modifier = Modifier.padding(vertical = 4.dp))
                        DetailRow(Icons.Default.CalendarToday, "Date de début", c.startDate.format(formatter))
                        Divider(modifier = Modifier.padding(vertical = 4.dp))
                        DetailRow(Icons.Default.EventBusy, "Date d'expiration", c.expirationDate.format(formatter))
                        Divider(modifier = Modifier.padding(vertical = 4.dp))
                        DetailRow(Icons.Default.Timer, "Durée", "${c.durationDays} jours")
                        if (c.daysUntilExpiration >= 0) {
                            Divider(modifier = Modifier.padding(vertical = 4.dp))
                            DetailRow(Icons.Default.HourglassBottom, "Jours restants",
                                "${c.daysUntilExpiration} jours")
                        }
                        if (c.price > 0) {
                            Divider(modifier = Modifier.padding(vertical = 4.dp))
                            DetailRow(Icons.Default.AttachMoney, "Prix", "${c.price} €")
                        }
                        if (c.notes.isNotBlank()) {
                            Divider(modifier = Modifier.padding(vertical = 4.dp))
                            DetailRow(Icons.Default.Notes, "Notes", c.notes)
                        }
                    }

                    Spacer(Modifier.height(8.dp))

                    Button(
                        onClick = { showRenewDialog = true },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Icon(Icons.Default.Refresh, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Renouveler l'abonnement", style = MaterialTheme.typography.titleMedium)
                    }
                }
            }

            if (showRenewDialog) {
                RenewDialog(
                    client = c,
                    onConfirm = { days ->
                        viewModel.renewSubscription(c, LocalDate.now().plusDays(days.toLong()))
                        showRenewDialog = false
                    },
                    onDismiss = { showRenewDialog = false }
                )
            }
        } ?: Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    }
}

@Composable
private fun DetailCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), content = content)
    }
}

@Composable
private fun DetailRow(icon: ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.width(12.dp))
        Column {
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
            Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun RenewDialog(
    client: Client,
    onConfirm: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    var days by remember { mutableStateOf("30") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Renouveler l'abonnement") },
        text = {
            Column {
                Text("Durée du renouvellement pour ${client.name} :")
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = days,
                    onValueChange = { days = it },
                    label = { Text("Nombre de jours") },
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                    ),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(days.toIntOrNull() ?: 30) }) { Text("Confirmer") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annuler") } }
    )
}
