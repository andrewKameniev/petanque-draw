<script>
export default {
    name: 'DocsTraining',
};
</script>

<template>
    <div>
        <h1 class="has-text-centered">{{ $t('help.training.title') }}</h1>
        <p>{{ $t('help.training.description') }}</p>

        <h2>{{ $t('help.training.exerciseListTitle') }}</h2>
        <img src="@/assets/img/docs/Train1.png" alt="Interface" class="image" />
        <ol>
            <li>{{ $t('help.training.exerciseList.add') }}</li>
            <li>{{ $t('help.training.exerciseList.list') }}</li>
            <li>{{ $t('help.training.exerciseList.delete') }}</li>
            <li>{{ $t('help.training.exerciseList.viewResults') }}</li>
            <li>{{ $t('help.training.exerciseList.startTraining') }}</li>
        </ol>

        <h2>{{ $t('help.training.addExerciseTitle') }}</h2>
        <p>{{ $t('help.training.addExerciseDescription') }}</p>
        <img src="@/assets/img/docs/Train2.png" alt="Interface" class="image" />
        <ol>
            <li>{{ $t('help.training.addExercise.back') }}</li>
            <li>{{ $t('help.training.addExercise.name') }}</li>
            <li>{{ $t('help.training.addExercise.distances') }}</li>
            <li>{{ $t('help.training.addExercise.throws') }}</li>
            <li>{{ $t('help.training.addExercise.series') }}</li>
            <li>{{ $t('help.training.addExercise.scoring') }}</li>
            <li>{{ $t('help.training.addExercise.scenario') }}</li>
            <li>{{ $t('help.training.addExercise.order') }}</li>
        </ol>

        <h2>{{ $t('help.training.trainingProcessTitle') }}</h2>
        <img src="@/assets/img/docs/Train4.png" alt="Interface" class="image" />
        <ol>
            <li>{{ $t('help.training.trainingProcess.inputResult') }}</li>
            <li>{{ $t('help.training.trainingProcess.navigation') }}</li>
            <li>{{ $t('help.training.trainingProcess.finish') }}</li>
        </ol>

        <h2>{{ $t('help.training.exerciseResultsTitle') }}</h2>
        <img src="@/assets/img/docs/Train3.png" alt="Interface" class="image" />
        <ol>
            <li>{{ $t('help.training.exerciseResults.average') }}</li>
            <li>{{ $t('help.training.exerciseResults.byDistance') }}</li>
            <li>{{ $t('help.training.exerciseResults.history') }}</li>
        </ol>
        <h2>{{ $t('help.training.exampleCreation') }}</h2>
        <p>{{ $t('help.training.exampleCreationText') }}</p>
        <img src="@/assets/img/docs/Train5.png" alt="Interface" class="image" />
        <div class="has-text-centered">
            <router-link class="button is-success" to="/training">Let's start</router-link>
        </div>
    </div>
</template>
