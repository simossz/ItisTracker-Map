# Mappa Aule · ItisTracker

Esempio di mappa 3D delle aule dell'**ITIS Leonardo da Vinci di Parma**, collegata a [ItisTracker](https://itis.simocode.xyz/).

ℹ️ **Per ora è una demo**: 6 aule reali, layout schematico (le aule sono raggruppate per codice, non in pianta 1:1).

## Cosa c'è dentro

- Vista 3D orbitabile: trascini per ruotare, scrolli per avvicinarti
- Sopra ogni aula leggi la **classe** (per prima), con il codice aula e il numero di banchi sotto
- Ogni **banco corrisponde a uno studente** della classe (dati presi da ItisTracker)
- Le aule sono in ordine di codice: **A01, A02, A05, A10, A23, A173**
- Clicchi un'aula (o la scegli dalla lista) e vedi classe, numero di banchi, aula, piano e una lezione d'esempio
- Tema chiaro/scuro, navigazione da tastiera, `prefers-reduced-motion`

## Privacy

Pubblico solo il **conteggio** degli studenti per classe. Nessun nome, cognome o altro dato personale.

## Come funziona

È un sito statico senza build step: Three.js arriva da jsDelivr tramite `importmap`. I dati sono in [`data/rooms.json`](data/rooms.json).

Per provarlo in locale:

```powershell
python -m http.server 8000
```

Poi apri <http://127.0.0.1:8000/>.

Per passare dalla demo a tutte le aule: sostituisci `data/rooms.json` con i 153 codici aula presenti nei calendari di ItisTracker e aggiungi le coordinate reali se hai una pianta.
