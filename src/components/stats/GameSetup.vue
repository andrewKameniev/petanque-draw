
<template>
    <div>
        <label class="label" for="gameName">Enter game name</label>
        <div class="field control">
            <input v-model="gameName" class="input" type="text" id="gameName" placeholder="Game name" />
        </div>

        <div class="field">
            <label class="radio" v-for="item in gameTypes" :key="item.id">
                <input
                    type="radio"
                    name="gameType"
                    :id="item.id"
                    :value="item.value"
                    v-model="gameType"
                />
                {{ item.label }}
            </label>
        </div>

        <label class="label">Scenario</label>
        <div class="field">
            <label class="radio">
                <input type="radio" name="statScenario" :value="false" v-model="statScenario" />
                Negative
            </label>
            <label class="radio">
                <input type="radio" name="statScenario" :value="true" v-model="statScenario" />
                Positive
            </label>
        </div>

        <button @click="$emit('start-game')" class="button is-success">Start</button>
    </div>
</template>

<script>
    export default {
        props: ["gameName", "gameType", "statScenario"],
        data() {
            return {
                gameTypes: [
                    {
                        id: 'tet',
                        label: 'Tet-a-tet',
                        value: 1,
                    },
                    {
                        id: 'doublet',
                        label: 'Doublet',
                        value: 2,
                    },
                    {
                        id: 'triplet',
                        label: 'Triplet',
                        value: 3,
                    },
                ],
            }
        }
    };
</script>
