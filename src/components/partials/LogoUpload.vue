<template>
    <Modal @close-modal="close">
        <div class="logo-upload">
            <h3 class="logo-upload__title">{{ $t('remote.tournamentLogo') }}</h3>

            <div v-if="currentLogoUrl && !imageSource" class="logo-upload__current">
                <img :src="currentLogoUrl" alt="Tournament logo" class="logo-upload__preview-img">
                <button class="button is-small is-danger is-outlined mt-3" @click="removeLogo" :disabled="removing">
                    <Trash2 :size="14"/>
                    <span class="ml-1">{{ $t('remote.removeLogo') }}</span>
                </button>
            </div>

            <div v-if="!imageSource" class="logo-upload__dropzone" @click="triggerFileInput" @dragover.prevent @drop.prevent="onDrop">
                <ImagePlus :size="32" class="has-text-grey-light"/>
                <span class="logo-upload__dropzone-text">{{ $t('remote.uploadLogoHint') }}</span>
                <span class="logo-upload__dropzone-limit">JPEG / PNG, max 2MB</span>
                <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="is-hidden" @change="onFileSelect">
            </div>

            <div v-if="imageSource" class="logo-upload__cropper-wrap">
                <Cropper
                    ref="cropper"
                    :src="imageSource"
                    :stencil-props="{ aspectRatio: null }"
                    :resize-image="{ adjustStencil: false }"
                    class="logo-upload__cropper"
                />
                <div class="logo-upload__actions mt-3">
                    <button class="button is-small" @click="imageSource = null">{{ $t('common.cancel') }}</button>
                    <button class="button is-small is-primary" @click="cropAndUpload" :disabled="uploading">
                        <Upload :size="14"/>
                        <span class="ml-1">{{ uploading ? $t('remote.uploading') : $t('remote.uploadLogo') }}</span>
                    </button>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script>
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import Modal from "@/components/Modal.vue";
import { logoService } from "@/services/storage";
import { mapState, mapActions } from "pinia";
import { useMainStore } from "@/stores/main";
import { ImagePlus, Upload, Trash2 } from "lucide-vue-next";

const MAX_SIZE = 2 * 1024 * 1024;
const MAX_DIMENSION = 400;

export default {
    name: "LogoUpload",
    components: { Modal, Cropper, ImagePlus, Upload, Trash2 },
    emits: ["close-modal", "uploaded"],
    data() {
        return {
            imageSource: null,
            uploading: false,
            removing: false,
        };
    },
    computed: {
        ...mapState(useMainStore, ["currentTournamentIndex", "user", "currentTournament"]),
        currentLogoUrl() {
            return this.currentTournament?.logoUrl || null;
        },
    },
    methods: {
        ...mapActions(useMainStore, ["syncToFirebase", "showMessage"]),
        close() {
            if (this.imageSource) {
                URL.revokeObjectURL(this.imageSource);
            }
            this.$emit("close-modal");
        },
        triggerFileInput() {
            this.$refs.fileInput.click();
        },
        onFileSelect(e) {
            const file = e.target.files[0];
            if (file) this.loadFile(file);
        },
        onDrop(e) {
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/")) {
                this.loadFile(file);
            }
        },
        loadFile(file) {
            if (file.size > MAX_SIZE) {
                this.showMessage({ title: this.$t("messages.error"), text: this.$t("remote.logoTooLarge"), type: "error" });
                return;
            }
            if (this.imageSource) URL.revokeObjectURL(this.imageSource);
            this.imageSource = URL.createObjectURL(file);
        },
        async cropAndUpload() {
            this.uploading = true;
            try {
                const { canvas } = this.$refs.cropper.getResult();
                const resized = this.resizeCanvas(canvas, MAX_DIMENSION);
                const blob = await new Promise((resolve) =>
                    resized.toBlob(resolve, "image/jpeg", 0.82)
                );
                const url = await logoService.upload(this.user.uid, this.currentTournamentIndex, blob);
                this.currentTournament.logoUrl = url;
                this.syncToFirebase();
                this.$emit("uploaded", url);
                this.close();
            } catch (err) {
                console.error(err);
                this.showMessage({ title: this.$t("messages.error"), text: this.$t("remote.logoUploadError"), type: "error" });
            } finally {
                this.uploading = false;
            }
        },
        async removeLogo() {
            this.removing = true;
            try {
                await logoService.remove(this.user.uid, this.currentTournamentIndex);
                this.currentTournament.logoUrl = null;
                this.syncToFirebase();
                this.$emit("uploaded", null);
                this.close();
            } catch (err) {
                console.error(err);
                this.showMessage({ title: this.$t("messages.error"), text: this.$t("remote.logoRemoveError"), type: "error" });
            } finally {
                this.removing = false;
            }
        },
        resizeCanvas(source, maxDim) {
            let { width, height } = source;
            if (width <= maxDim && height <= maxDim) return source;
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d").drawImage(source, 0, 0, width, height);
            return canvas;
        },
    },
};
</script>

<style scoped>
.logo-upload {
    padding: 0.5rem;
}

.logo-upload__title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--color-primary);
}

.logo-upload__current {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
}

.logo-upload__preview-img {
    max-width: 160px;
    max-height: 160px;
    border-radius: 8px;
    border: 2px solid var(--color-border);
    object-fit: contain;
}

.logo-upload__dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem;
    border: 2px dashed var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s;
}

.logo-upload__dropzone:hover {
    border-color: var(--color-primary);
}

.logo-upload__dropzone-text {
    font-size: 0.9rem;
    color: var(--color-text);
}

.logo-upload__dropzone-limit {
    font-size: 0.75rem;
    color: var(--color-grey);
}

.logo-upload__cropper-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.logo-upload__cropper {
    max-height: 350px;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
}

.logo-upload__actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}
</style>
