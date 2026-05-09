import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/firebase";

export const logoService = {
    async upload(userId, tournamentId, blob) {
        const path = `logos/${userId}/${tournamentId}.jpg`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
        return getDownloadURL(storageRef);
    },

    async remove(userId, tournamentId) {
        const path = `logos/${userId}/${tournamentId}.jpg`;
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    },
};
