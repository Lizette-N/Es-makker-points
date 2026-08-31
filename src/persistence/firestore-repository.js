import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
  setDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const config = globalThis.FIREBASE_CONFIG;
if (!config?.projectId) {
  throw new Error("Firebase-konfiguration mangler. Opret FIREBASE_CONFIG før brug.");
}

const db = getFirestore(initializeApp(config));

export function createGameRepository(gameId) {
  const gameRef = doc(db, "games", gameId);

  return {
    async load() {
      const [gameSnapshot, playerSnapshots, roundSnapshots] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js").then(({ getDoc }) => getDoc(gameRef)),
        getDocs(query(collection(gameRef, "players"), orderBy("sortOrder"))),
        getDocs(query(collection(gameRef, "rounds"), orderBy("roundNumber", "desc")))
      ]);
      if (!gameSnapshot.exists()) throw new Error("Spillet findes ikke");
      return {
        game: { id: gameSnapshot.id, ...gameSnapshot.data() },
        players: playerSnapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() })),
        rounds: roundSnapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
      };
    },

    async saveGame(game) { await setDoc(gameRef, game, { merge: true }); },
    async savePlayer(player) { await setDoc(doc(gameRef, "players", player.id), player, { merge: true }); },

    async saveRound(round, expectedUpdatedAt) {
      const roundRef = doc(gameRef, "rounds", round.id);
      await runTransaction(db, async (transaction) => {
        const current = await transaction.get(roundRef);
        if (expectedUpdatedAt && current.exists() && current.data().updatedAt !== expectedUpdatedAt) {
          throw new Error("Runden er ændret på en anden enhed. Genindlæs før du gemmer.");
        }
        transaction.set(roundRef, round);
      });
    }
  };
}

export async function createGame(game) {
  await setDoc(doc(db, "games", game.id), game);
}

export async function listGames() {
  const snapshots = await getDocs(query(collection(db, "games"), orderBy("updatedAt", "desc")));
  return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
}

export async function deleteGame(gameId) {
  const gameRef = doc(db, "games", gameId);
  const snapshots = await Promise.all([
    getDocs(collection(gameRef, "players")),
    getDocs(collection(gameRef, "rounds"))
  ]);
  const references = snapshots.flatMap((snapshot) => snapshot.docs.map((entry) => entry.ref));

  for (let index = 0; index < references.length; index += 450) {
    const batch = writeBatch(db);
    references.slice(index, index + 450).forEach((reference) => batch.delete(reference));
    await batch.commit();
  }

  const batch = writeBatch(db);
  batch.delete(gameRef);
  await batch.commit();
}
