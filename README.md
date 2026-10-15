# Frigo sans ouvrir

Ton frigo, sans l'ouvrir : ce que tu as chez toi, ce qui va bientôt périmer, et ce qu'il faut racheter.

Application web installable (PWA), sans serveur : tout est enregistré dans le navigateur du téléphone.

## Ce que fait l'app

- **Stock** par rangement (frigo, congélo, placard, autre), avec dates de péremption et quantités
- **À manger en premier** : ce qui périme dans les 2 jours, en haut de l'écran
- **Courses** : un produit fini part dans la liste, et revient dans le stock quand tu le coches comme acheté
- **Confort food**, recherche, filtres, mode sombre, export des dates vers le calendrier (.ics)
- **Hors connexion** une fois installée

Le scan des tickets et les idées de recettes s'affichent « Bientôt disponible » : ils demandent un petit serveur qui appelle l'API Claude (étape suivante).

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | toute l'application (HTML, CSS, JS) |
| `manifest.webmanifest` | nom, couleurs et icônes pour l'installation |
| `sw.js` | service worker : fonctionnement hors connexion |
| `icons/` | icônes de l'app |

## Mettre en ligne avec GitHub Pages

1. Crée un dépôt vide sur [github.com/new](https://github.com/new), par exemple `frigo-sans-ouvrir`.
2. Dans ce dossier, relie-le et envoie le code (remplace `TON-PSEUDO`) :

   ```bash
   git remote add origin https://github.com/TON-PSEUDO/frigo-sans-ouvrir.git
   git push -u origin main
   ```

3. Sur GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
4. Après une ou deux minutes, l'app est en ligne sur `https://TON-PSEUDO.github.io/frigo-sans-ouvrir/`.

## Installer sur le téléphone

- **iPhone** : ouvre l'adresse dans **Safari** → bouton Partager → **Sur l'écran d'accueil**.
- **Android** : ouvre l'adresse dans **Chrome** → menu ⋮ → **Installer l'application**.

## Bon à savoir

- Les données restent sur l'appareil où l'app est installée : pas de synchronisation entre téléphone et ordinateur.
- Sur iPhone, l'app installée et Safari ont chacun leur propre stockage : utilise toujours l'app installée.
- Pour publier une mise à jour, change la version `CACHE` en haut de `sw.js` (par exemple `frigo-v2`), puis `git commit` et `git push`.

## Tester en local

```bash
python3 -m http.server 8000
```

Puis ouvre http://localhost:8000.
