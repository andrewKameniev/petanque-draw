<script>
export default {
    name: 'Loader',
    props: ['isDark'],
};
</script>

<template>
    <span class="loader" :class="{ dark: isDark }"></span>
</template>

<style scoped>
.loader {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px dotted #fff;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 2s linear infinite;
}

@media screen and (max-width: 500px) {
    .loader.dark {
        border-color: var(--color-loader-border);
    }
}

@keyframes rotation {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>
