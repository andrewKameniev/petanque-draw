<script>
export default {
    name: "Loader"
}
</script>

<template>
    <span class="loader"></span>
</template>

<style scoped>
.loader {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px dotted #FFF;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 2s linear infinite;
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