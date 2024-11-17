<template>
    <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <a class="navbar-item" href="/">
                <picture>
                    <source srcset="../assets/img/logo.webp" type="image/webp">
                    <source srcset="../assets/img/logo.png" type="image/jpeg">
                    <img src="../assets/img/logo.png" alt="logo">
                </picture>
            </a>
            <LanguageSwitcher/>
        </div>
    </nav>
    <div class="container">
        <div class="content">
            <button class="button is-light" @click="back">{{ $t('login.back') }}</button>
            <h1 class="has-text-centered">{{ $t('help.title') }} <strong>"Petanque Draw"</strong></h1>
            <p>{{ $t('help.description') }}</p>
            <ul>
                <li>{{ $t('help.feature1') }}</li>
                <li>{{ $t('help.feature2') }}</li>
                <li>{{ $t('help.feature3') }}</li>
                <li>{{ $t('help.feature4') }}</li>
                <li>{{ $t('help.feature5') }}</li>
            </ul>
            <h2 class="has-text-centered">{{ $t('help.howToUseTitle') }}</h2>
            <img src="@/assets/img/docs/Doc13.png" alt="Interface" class="image">
            <ol>
                <li>{{ $t('help.howToUse1') }}</li>
                <li>{{ $t('help.howToUse2') }}</li>
            </ol>
            <h2>{{ $t('help.shortTitle') }}</h2>
            <p>{{ $t('help.shortText') }}</p>
            <ol>
                <li>{{ $t('help.shortText1') }}</li>
                <li>{{ $t('help.shortText2') }}</li>
                <li>{{ $t('help.shortText3') }}</li>
                <li>{{ $t('help.shortText4') }}</li>
                <li>{{ $t('help.shortText5') }}</li>
                <li>{{ $t('help.shortText6') }}</li>
                <li>{{ $t('help.shortText7') }}</li>
                <li>{{ $t('help.shortText8') }}</li>
                <li>{{ $t('help.shortText9') }}</li>
            </ol>
            <p>{{ $t('help.shortSummary') }}</p>
            <h2>{{ $t('help.interfaceTitle') }}</h2>
            <img src="@/assets/img/docs/Doc1.png" alt="Interface" class="image">
            <ol>
                <li>{{ $t('help.interface1') }}</li>
                <li>{{ $t('help.interface2') }}</li>
                <li>{{ $t('help.interface3') }} https://portal.petanque.org.ua/tournament/ <strong>573</strong>).</li>
                <li>{{ $t('help.interface4') }}</li>
                <li>{{ $t('help.interface5') }}</li>
            </ol>
            <h2>{{ $t('help.tournamentControlsTitle') }}</h2>
            <p>{{ $t('help.tournamentControls1') }}</p>
            <p>{{ $t('help.tournamentControls2') }}</p>
            <p>{{ $t('help.tournamentControls3') }}</p>
            <div class="field is-grouped buttons">
                <div class="control">
                    <button class="button is-danger">{{ $t('teams.removeTournament') }}</button>
                </div>
                <div class="control">
                    <button class="button is-info">{{ $t('teams.preferences') }}</button>
                </div>
                <div class="control">
                    <button class="button is-info">{{ $t('teams.restoreTeams') }}</button>
                </div>
                <div class="control">
                    <button class="button is-success">{{ $t('teams.saveTournament') }}</button>
                </div>
                <div class="control">
                    <button class="button is-info">{{ $t('teams.finishTournament') }}</button>
                </div>
            </div>
            <h2>{{ $t('help.mainTabs') }}</h2>
            <img src="@/assets/img/docs/Doc2.png" alt="Tabs" class="image">
            <ol>
                <li>{{ $t('help.mainTabs1') }}</li>
                <li>{{ $t('help.mainTabs2') }}</li>
                <li>{{ $t('help.mainTabs3') }}</li>
                <li>{{ $t('help.mainTabs4') }}</li>
            </ol>
            <h2>{{ $t('help.preferences') }}</h2>
            <p>
                <button class="button is-info">{{ $t('teams.preferences') }}</button>
            </p>
            <p>{{ $t('help.pressBtnSeeInterface') }}</p>
            <img src="@/assets/img/docs/Doc10.png" alt="Preferences" class="image">
            <p>{{ $t('help.preferences1') }}</p>
            <ol>
                <li>{{ $t('help.preferences2') }}</li>
                <li>{{ $t('help.preferences3') }}</li>
            </ol>
            <h2>{{ $t('help.drawResults') }}</h2>
            <p>
                <button class="button is-info">
                    {{$t('games.draw')}} N {{ $t('common.round') }}
                </button>
            </p>
            <p>{{ $t('help.drawResultsText') }}</p>
            <img src="@/assets/img/docs/Doc3.png" alt="Draw" class="image">
            <ol>
                <li>{{ $t('help.drawResults1') }}</li>
                <li>{{ $t('help.drawResults2') }}</li>
                <li>{{ $t('help.drawResults3') }}</li>
            </ol>
            <h2>{{ $t('help.ranking') }}</h2>
            <img src="@/assets/img/docs/Doc4.png" alt="Ranking" class="image">
            <p>{{ $t('help.rankingSwiss1') }}</p>
            <ol>
                <li>{{ $t('help.rankingSwiss2') }}</li>
                <li>{{ $t('help.rankingSwiss3') }}</li>
                <li>{{ $t('help.rankingSwiss4') }}</li>
                <li>{{ $t('help.rankingSwiss5') }}</li>
                <li>{{ $t('help.rankingSwiss6') }}</li>
                <li>{{ $t('help.rankingSwiss7') }}</li>
            </ol>
            <p>{{ $t('help.rankingRound1') }}</p>
            <ol>
                <li>{{ $t('help.rankingRound2') }}</li>
                <li>{{ $t('help.rankingRound3') }}</li>
                <li>{{ $t('help.rankingRound4') }}</li>
            </ol>
            <p>{{ $t('help.rankingRound5') }}</p>
            <ol>
                <li>{{ $t('help.rankingRound6') }}</li>
                <li>{{ $t('help.rankingRound7') }}</li>
                <li>{{ $t('help.rankingRound8') }}</li>
            </ol>

            <h2>{{ $t('help.playOff') }}</h2>
            <p>{{ $t('help.playOffText') }}</p>
            <p>
                <button class="button is-info">{{ $t('games.showBracket') }}</button>
            </p>
            <p>{{ $t('help.pressBtnSeeInterface') }}</p>
            <img src="@/assets/img/docs/Doc5.png" alt="Play Off" class="image">
            <h2>{{ $t('help.roundSystem') }}</h2>
            <p>{{ $t('help.roundSystemText') }}</p>
            <p>{{ $t('help.roundSystemText1') }}</p>
            <img src="@/assets/img/docs/Doc11.png" alt="Groups" class="image">
            <h2>{{ $t('help.remoteControl') }}</h2>
            <p>{{ $t('help.remoteControl1') }}</p>
            <ol>
                <li>{{ $t('help.remoteControl2') }}</li>
                <li>{{ $t('help.remoteControl3') }}</li>
            </ol>
            <img src="@/assets/img/docs/Doc6.png" alt="Remote" class="image">
            <img src="@/assets/img/docs/Doc7.png" alt="Remote" class="image">
            <h2>{{ $t('help.remoteView') }}</h2>
            <p>{{ $t('help.remoteViewText') }}</p>
            <img src="@/assets/img/docs/Doc8.png" alt="Remote" class="image">
            <ol>
                <li>{{ $t('help.remoteView1') }}</li>
                <li>{{ $t('help.remoteView2') }}</li>
                <li>{{ $t('help.remoteView3') }}</li>
                <li>{{ $t('help.remoteView4') }}</li>
            </ol>
            <h2>{{ $t('help.finishedTournament') }}</h2>
            <p>{{ $t('help.finishedTournament1') }}</p>
            <img src="@/assets/img/docs/Doc9.png" alt="Results" class="image">
            <p>{{ $t('help.finishedTournament3') }}</p>
            <p>{{ $t('help.finishedTournament2') }}</p>
            <h2>{{ $t('help.tournamentsControlsTitle') }}</h2>
            <img src="@/assets/img/docs/Doc12.png" alt="Active tournaments choosing" class="image">
            <ol>
                <li>{{ $t('help.tournamentsControls1') }}</li>
                <li>{{ $t('help.tournamentsControls2') }}</li>
            </ol>
            <p>{{ $t('help.tournamentsControls3') }}</p>
            <br>
            <p>{{ $t('help.thanksMessage') }} <a href="mailto:ancam1987@gmail.com">{{ $t('help.thanksMessagePost') }}</a> {{ $t('help.thanksMessageOr') }}
                <a href="https://www.facebook.com/profile.php?id=100001747232897" target="_blank">{{ $t('help.thanksMessageMessenger') }}</a>.</p>
            <div class="has-text-centered">
                <router-link class="button is-success" to="/">Let's start</router-link>
            </div>
        </div>
    </div>
    <Footer/>
</template>

<script>

import LanguageSwitcher from "@/components/partials/LanguageSwitcher.vue";
import Footer from "@/components/partials/Footer.vue";

export default {
    name: 'Help',
    components: {Footer, LanguageSwitcher},
    methods: {
        back() {
            this.$router.go(-1);
        }
    }
}
</script>
<style scoped>
.image {
    border: solid 1px #ddd;
    border-radius: 10px;
}
</style>