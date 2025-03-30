<script>
export default {
    name: "DocsStat"
}
</script>

<template>
    <div>
        <h1 class="has-text-centered">{{$t('help.stat.title')}}</h1>
        <p>{{$t('help.stat.description')}}</p>
        <h2>{{$t('help.stat.settings.title')}}</h2>
        <p>{{$t('help.stat.settings.description')}}</p>
        <img src="@/assets/img/docs/stat1.png" alt="Interface" class="image">
        <ol>
            <li>{{$t('help.stat.settings.gameName')}}</li>
            <li>{{$t('help.stat.settings.tags')}}</li>
            <li>{{$t('help.stat.settings.mode')}}</li>
            <li>{{$t('help.stat.settings.showStats')}}</li>
            <li>{{$t('help.stat.settings.scoringSystem')}}</li>
            <li>{{$t('help.stat.settings.scenario')}}</li>
        </ol>
        <h2>{{$t('help.stat.tracking.title')}}</h2>
        <img src="@/assets/img/docs/stat2.png" alt="Interface" class="image">
        <ol>
            <li>{{$t('help.stat.tracking.distance')}}</li>
            <li>{{$t('help.stat.tracking.teamStats')}}</li>
            <li>{{$t('help.stat.tracking.playerStats')}}</li>
            <li>{{$t('help.stat.tracking.shotsSeries')}}</li>
            <li>{{$t('help.stat.tracking.roundPoints')}}</li>
            <li>{{$t('help.stat.tracking.highlight')}}</li>
            <li>{{$t('help.stat.tracking.contextMenu')}}</li>
            <li>{{$t('help.stat.tracking.shotType')}}</li>
            <li>{{$t('help.stat.tracking.negativeHighlight')}}</li>
            <li>{{$t('help.stat.tracking.navigation')}}</li>
        </ol>
        <h2>{{$t('help.stat.result.title')}}</h2>
        <img src="@/assets/img/docs/stat3.png" alt="Interface" class="image">
        <ol>
            <li>{{$t('help.stat.result.finalScore')}}</li>
            <li>{{$t('help.stat.result.teamPerformance')}}</li>
            <li>{{$t('help.stat.result.shotsPerRound')}}</li>
            <li>{{$t('help.stat.result.roundPoints')}}</li>
            <li>{{$t('help.stat.result.playerSeries')}}</li>
            <li>{{$t('help.stat.result.playerPerformance')}}</li>
        </ol>
        <h2>{{$t('help.stat.modes.title')}}</h2>
        <p>{{$t('help.stat.modes.simple')}}</p>
        <img src="@/assets/img/docs/stat8.png" alt="Interface" class="image">
        <p class="mt-2">{{$t('help.stat.modes.fastModePositive')}}</p>
        <img src="@/assets/img/docs/stat9.png" alt="Interface" class="image">
        <p class="mt-2">{{$t('help.stat.modes.fastModeNegative')}}</p>
        <img src="@/assets/img/docs/stat10.png" alt="Interface" class="image">
        <p class="mt-2">{{$t('help.stat.modes.fastModeDescription')}}</p>
        <h2>{{$t('help.stat.tags.title')}}</h2>
        <p>{{$t('help.stat.tags.description')}}</p>
        <img src="@/assets/img/docs/stat4.png" alt="Interface" class="image">
        <p>{{$t('help.stat.tags.usage')}}</p>
        <img src="@/assets/img/docs/stat5.png" alt="Interface" class="image">
        <h2>{{$t('help.stat.substitutions.title')}}</h2>
        <p>{{$t('help.stat.substitutions.description')}}</p>
        <h2>{{$t('help.stat.archive.title')}}</h2>
        <p>{{$t('help.stat.archive.description')}}</p>
        <img src="@/assets/img/docs/stat6.png" alt="Interface" class="image">
        <ol>
            <li>{{$t('help.stat.archive.filterTags')}}</li>
            <li>{{$t('help.stat.archive.gameName')}}</li>
            <li>{{$t('help.stat.archive.recordDate')}}</li>
            <li>{{$t('help.stat.archive.addedTags')}}</li>
            <li>{{$t('help.stat.archive.addTag')}}</li>
        </ol>
        <h2>{{$t('help.stat.analysis.title')}}</h2>
        <p>{{$t('help.stat.analysis.description')}}</p>
        <img src="@/assets/img/docs/stat7.png" alt="Interface" class="image">
        <ol>
            <li>{{$t('help.stat.analysis.selectPlayer')}}</li>
            <li>{{$t('help.stat.analysis.selectPeriod')}}</li>
            <li>{{$t('help.stat.analysis.selectFormat')}}</li>
            <li>{{$t('help.stat.analysis.selectTag')}}</li>
            <li>{{$t('help.stat.analysis.selectDistance')}}</li>
            <li>{{$t('help.stat.analysis.result')}}</li>
            <li>{{$t('help.stat.analysis.charts')}}</li>
        </ol>

        <div class="has-text-centered">
            <router-link class="button is-success" to="/stats">Let's start</router-link>
        </div>
    </div>
</template>