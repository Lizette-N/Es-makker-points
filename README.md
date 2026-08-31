# Es-makker Whist

Statisk webapp til fælles online regnskab for Es-makker Whist.

## Lokal Firebase-konfiguration

Opret en Firebase Web App og indsæt den offentlige web-konfiguration i `firebase-config.js`.
Service account-nøgler må ikke indsættes i denne fil.

Opret en Firestore-database og deploy reglerne fra `firestore.rules`. Spil identificeres med et tilfældigt link; alle med linket kan oprette og redigere runder, men sletning er blokeret.

## Test

```bash
npm test
```

Siden kan åbnes via en lokal statisk server eller publiceres som GitHub Pages.
