<template>
    <div class="is-flex is-justify-content-space-between">
        <div>
            Man <strong>{{ currentMan + 1 }}</strong> / {{ manCount }}
        </div>
        <div>
            <strong>Score:</strong> {{ currentScore.team1 }} : {{ currentScore.team2 }}
        </div>
    </div>
</template>

<script>
export default {
    props: ["currentMan", "manCount", "currentScore"],
};
</script>
