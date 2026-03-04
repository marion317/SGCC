import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const initDatabase = async () => {
  console.log("🚀 initDatabase ejecutado");
  const ref = doc(collection(db, "config"), "init");

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      creada: true,
      fecha: new Date(),
      proyecto: "conduccion escuela",
    });

    console.log("📦 Base de datos inicializada");
  } else {
    console.log("✅ Base de datos ya existía");
  }
}