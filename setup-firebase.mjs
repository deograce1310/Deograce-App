#!/usr/bin/env node
/**
 * Script de configuration Firebase pour Deograce Abonnements
 * Usage: node setup-firebase.mjs
 */
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import readline from 'readline'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(r => rl.question(q, r))

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts })
}

function runJSON(cmd) {
  const out = execSync(cmd + ' --json', { encoding: 'utf8', stdio: 'pipe' })
  // firebase --json wraps output in a JSON object on the last line
  const lines = out.trim().split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    try { return JSON.parse(lines[i]) } catch { continue }
  }
  throw new Error('Réponse JSON introuvable dans: ' + out)
}

console.log('\n🔥  Configuration Firebase — Deograce Abonnements\n')

// ── 1. Vérifier / installer firebase-tools ──────────────────────────────────
try {
  const v = execSync('firebase --version', { encoding: 'utf8', stdio: 'pipe' }).trim()
  console.log(`✅  firebase-tools ${v} détecté`)
} catch {
  console.log('📦  Installation de firebase-tools…')
  run('npm install -g firebase-tools')
}

// ── 2. Connexion ─────────────────────────────────────────────────────────────
console.log('\n🔑  Connexion à votre compte Google Firebase…')
run('firebase login')

// ── 3. Choisir un ID de projet ───────────────────────────────────────────────
console.log()
const rawId = await ask('🏷️   ID du projet (ex: deograce-abonnements) : ')
const projectId = rawId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
console.log(`     → Utilisation de l'ID : ${projectId}\n`)

// ── 4. Créer le projet Firebase ──────────────────────────────────────────────
console.log('⚙️   Création du projet Firebase…')
try {
  run(`firebase projects:create ${projectId} --display-name "Deograce Abonnements"`)
} catch {
  console.log('⚠️   Le projet existe déjà ou une erreur s\'est produite — on continue.\n')
}

// ── 5. Créer l'application web ───────────────────────────────────────────────
console.log('🌐  Création de l\'application web…')
const appResult = runJSON(`firebase apps:create web "Deograce App" --project ${projectId}`)
const appId = appResult?.result?.appId ?? appResult?.appId
if (!appId) { console.error('❌  App ID introuvable. Vérifiez votre connexion.'); process.exit(1) }
console.log(`✅  App créée : ${appId}\n`)

// ── 6. Récupérer la configuration SDK ────────────────────────────────────────
console.log('📋  Récupération de la configuration SDK…')
const configResult = runJSON(`firebase apps:sdkconfig web ${appId} --project ${projectId}`)
const cfg = configResult?.result?.sdkConfig ?? configResult?.sdkConfig
if (!cfg) { console.error('❌  Configuration SDK introuvable.'); process.exit(1) }

// ── 7. Écrire le fichier .env.local ──────────────────────────────────────────
const envContent = [
  `VITE_FIREBASE_API_KEY=${cfg.apiKey ?? ''}`,
  `VITE_FIREBASE_AUTH_DOMAIN=${cfg.authDomain ?? ''}`,
  `VITE_FIREBASE_PROJECT_ID=${cfg.projectId ?? projectId}`,
  `VITE_FIREBASE_STORAGE_BUCKET=${cfg.storageBucket ?? ''}`,
  `VITE_FIREBASE_MESSAGING_SENDER_ID=${cfg.messagingSenderId ?? ''}`,
  `VITE_FIREBASE_APP_ID=${cfg.appId ?? appId}`,
].join('\n') + '\n'

writeFileSync('.env.local', envContent)
console.log('✅  Fichier .env.local créé\n')

// ── 8. Créer la base de données Firestore ────────────────────────────────────
console.log('🗄️   Création de la base de données Firestore…')
try {
  run(`firebase firestore:databases:create --location=eur3 --project ${projectId}`)
  console.log('✅  Firestore activé\n')
} catch {
  console.log('⚠️   Firestore existe déjà ou erreur — on continue.\n')
}

// ── 9. Écrire et déployer les règles de sécurité ─────────────────────────────
writeFileSync('firestore.rules', `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/clients/{clientId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
`)

writeFileSync('firebase.json', JSON.stringify({
  firestore: { rules: 'firestore.rules' }
}, null, 2) + '\n')

console.log('🔒  Déploiement des règles Firestore…')
run(`firebase use ${projectId}`)
run('firebase deploy --only firestore:rules')
console.log('✅  Règles déployées\n')

rl.close()

// ── 10. Instructions finales ──────────────────────────────────────────────────
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Configuration terminée !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌  UNE ÉTAPE MANUELLE (2 min) :
    Active les méthodes de connexion ici :

    👉  https://console.firebase.google.com/project/${projectId}/authentication/providers

    • Email/Mot de passe → Activer
    • Google             → Activer (configure juste l'email de support)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀  Pour Netlify :
    Copie les variables de .env.local dans :
    Site settings → Environment variables

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
