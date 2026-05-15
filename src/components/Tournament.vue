<template>
    <div>
        <div class="remote-toolbar" v-if="user">
            <div class="remote-toolbar__actions">
                <button class="remote-toolbar__btn" @click="showQrCode = true">
                    <Link :size="18"/>
                    <span class="is-hidden-mobile">{{ $t('remote.showLinks') }}</span>
                    <span class="is-hidden-tablet">{{ $t('remote.showLink') }}</span>
                </button>
                <button class="remote-toolbar__btn" :class="{'remote-toolbar__btn--active': showTypeMessage, 'remote-toolbar__btn--has-message': !showTypeMessage && tournament.tournamentMessage?.trim()}" @click="showTypeMessage = !showTypeMessage">
                    <MessageCircle :size="18"/>
                    {{ $t('remote.writeMessage') }}
                    <ChevronDown :size="14" class="remote-toolbar__chevron" :class="{'remote-toolbar__chevron--open': showTypeMessage}"/>
                </button>
            </div>
            <progress class="progress is-small is-info" max="100" v-if="loadingOnServer">15%</progress>
            <Transition name="slide">
                <div class="remote-toolbar__message" v-if="showTypeMessage">
                    <span v-if="messageSaved" class="message-saved-label">
                        <Check :size="14"/>
                        {{ $t('remote.messageSaved') }}
                    </span>
                    <textarea rows="3" v-model="tournament.tournamentMessage" class="remote-toolbar__textarea" :placeholder="$t('remote.writeMessage') + '...'" @input="onMessageInput"></textarea>
                </div>
            </Transition>
            <QrCode v-if="showQrCode" @close-modal="showQrCode = false"/>
        </div>
        <div class="text-center is-size-3 tournament-name-row" data-testid="tournament-name-row">
            <button class="pin-btn" :class="{'pin-btn--active': isPinned}" @click.stop="togglePin" :title="isPinned ? $t('common.unpin') : $t('common.pin')">
                <IconPin :size="22" :fill="isPinned ? 'currentColor' : 'none'"/>
            </button>
            <template v-if="editingName">
                <div class="inline-name-edit-wrapper">
                    <div class="inline-name-edit">
                        <input ref="nameInput" class="inline-name-input" :class="{'inline-name-input--error': nameError}"
                               v-model="editNameValue" @keyup.enter="saveName" @keyup.escape="cancelEditName"
                               @input="nameError = false">
                        <button class="inline-name-btn inline-name-btn--save" @click="saveName" :title="$t('common.change')">
                            <Check :size="18"/>
                        </button>
                        <button class="inline-name-btn inline-name-btn--cancel" @click="cancelEditName" :title="$t('common.cancel')">
                            <X :size="18"/>
                        </button>
                    </div>
                    <span v-if="nameError" class="inline-name-error">{{ $t('modals.tournamentNameRequired') }}</span>
                </div>
            </template>
            <template v-else>
                <strong class="pointer" @click="startEditName"> {{ tournament.name }}</strong>
            </template>
            <span v-if="tournamentStarted" class="is-size-5 is-capitalized">({{tournament.system}})</span>
        </div>
        <!-- PRE-START: Setup flow -->
        <template v-if="!tournamentStarted">
            <div v-if="tournament.teams?.length > 2" class="setup-card setup-card--system">
                <h3 class="setup-card__title">{{ $t('setup.readyToStart') }}</h3>
                <p class="setup-card__summary">{{ tournament.teams.length }} {{ $t('teams.teams').toLowerCase() }}</p>

                <div class="setup-card__field">
                    <label class="setup-card__label">{{ $t('teams.system') }}</label>
                    <div class="setup-card__radios">
                        <label class="setup-card__radio" v-if="tournament.teams?.length > 4">
                            <input type="radio" name="system" value="swiss" v-model="tournament.system">
                            {{ $t('teams.swiss') }}
                        </label>
                        <label class="setup-card__radio">
                            <input type="radio" name="system" value="groups" v-model="tournament.system">
                            {{ $t('teams.groups') }}
                        </label>
                        <label class="setup-card__radio">
                            <input type="radio" name="system" value="supermele" v-model="tournament.system">
                            {{ $t('teams.supermele') }}
                        </label>
                    </div>
                </div>

                <div v-if="tournament.system === 'groups'" class="setup-card__field">
                    <label class="setup-card__label">{{ $t('teams.teamsInGroup') }}</label>
                    <select class="setup-card__select" data-testid="select-teams-in-group" v-model.number="teamsInGroup">
                        <template v-for="(team, index) in tournament.teams" :key="index">
                            <option v-if="index > 1">{{index + 1}}</option>
                        </template>
                    </select>
                </div>

                <div v-if="tournament.system === 'supermele'" class="setup-card__field">
                    <label class="setup-card__label">{{ $t('teams.playersInTeam') }}</label>
                    <select class="setup-card__select" v-model.number="tournament.supermelePlayers">
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>

                <div v-if="tournament.system === 'swiss'" class="setup-card__field">
                    <label class="setup-card__checkbox">
                        <input type="checkbox" v-model="setupPlayOff" data-testid="checkbox-playoff">
                        {{ $t('setup.enablePlayOff') }}
                    </label>
                    <div v-if="setupPlayOff" class="setup-card__sub">
                        <label class="setup-card__label">{{ $t('modals.playOffTeams') }}</label>
                        <select class="setup-card__select" v-model.number="tournament.preferences.playOffTeams" data-testid="select-playoff-teams">
                            <template v-for="value in teamToPlayOffValues" :key="value">
                                <option :value="value" v-if="tournament.teams.length >= value">{{value}}</option>
                            </template>
                        </select>
                        <span class="setup-card__hint">{{ $t('modals.playOffTeamsHint') }}</span>
                        <label class="setup-card__checkbox setup-card__checkbox--sub">
                            <input type="checkbox" v-model="withCadrage" data-testid="checkbox-cadrage">
                            {{ $t('ranking.withCadrage') }}
                        </label>
                        <span class="setup-card__hint setup-card__hint--sub">{{ $t('ranking.cadrageHint') }}</span>
                    </div>
                </div>

                <div v-if="tournament.system === 'swiss' && !tournament.isGroupB" class="setup-card__field">
                    <label class="setup-card__checkbox">
                        <input type="checkbox" v-model="playB" data-testid="checkbox-play-b">
                        {{ $t('ranking.alsoPlay') }} <strong>{{ $t('ranking.tournamentB') }}</strong>
                    </label>
                </div>

                <button class="setup-card__collapse-toggle" @click="showAdvancedSettings = !showAdvancedSettings">
                    <ChevronDown :size="16" class="setup-card__collapse-icon" :class="{'setup-card__collapse-icon--open': showAdvancedSettings}"/>
                    {{ $t('setup.additionalSettings') }}
                </button>

                <div v-if="showAdvancedSettings" class="setup-card__collapse-content">
                    <div class="setup-card__field">
                        <label class="setup-card__label">{{ $t('modals.technicalScore') }}</label>
                        <div class="setup-card__row">
                            <div class="setup-card__row-item">
                                <span class="setup-card__hint">{{ $t('games.first') }}</span>
                                <input class="setup-card__input" type="number" v-model="tournament.preferences.technical.technicalFirst" min="0">
                            </div>
                            <div class="setup-card__row-item">
                                <span class="setup-card__hint">{{ $t('games.technical') }} 2</span>
                                <input class="setup-card__input" type="number" v-model="tournament.preferences.technical.technicalSecond" min="0">
                            </div>
                        </div>
                        <span class="setup-card__hint">{{ $t('modals.technicalScoreHint') }}</span>
                    </div>

                    <div class="setup-card__field">
                        <label class="setup-card__label">{{ $t('modals.maxScore') }}</label>
                        <input class="setup-card__input" type="number" v-model="tournament.preferences.maxScore" min="1">
                        <span class="setup-card__hint">{{ $t('modals.maxScoreHint') }}</span>
                    </div>

                    <div class="setup-card__field">
                        <label class="setup-card__label">{{ $t('modals.fieldsStart') }}</label>
                        <input class="setup-card__input" type="number" v-model="tournament.preferences.fieldsStart" min="1">
                        <span class="setup-card__hint">{{ $t('modals.fieldsStartHint') }}</span>
                    </div>
                </div>

                <div class="setup-card__actions">
                    <button class="setup-card__start" data-testid="btn-draw-first-round" @click="drawFirstRound">
                        <Play :size="18"/>
                        {{ $t('setup.drawFirstRound') }}
                    </button>
                    <span class="setup-card__or">{{ $t('common.or') }}</span>
                    <button class="setup-card__delete" data-testid="btn-delete-setup" @click="removeConfirmId = 1">
                        <Trash2 :size="16" class="is-hidden-mobile"/>
                        {{ $t('teams.removeTournament') }}
                    </button>
                </div>
            </div>

            <div class="setup-teams-card">
                <AddTeam v-if="tournament.system === 'supermele' || (!tournament.games?.length && !tournament.playOff)"
                         :import-hidden="false" :show-restore="!tournament.teams?.length" @restore="restoreTeamsFromLocalStorage"/>
                <TeamsList v-if="tournament.teams && tournament.teams.length" :activeRound="activeRound"/>
                <div v-else class="setup-empty">
                    {{ $t('common.please') }} {{ $t('teams.addTeamMessage') }}
                </div>
            </div>
        </template>

        <!-- POST-START: Tabbed tournament view -->
        <template v-else>
            <div class="tabs">
                <ul>
                    <li v-for="(tab, index) in tabs" :key="index"
                        :id="'tab-' + tab.id"
                        :class="{'is-active': tab.id === activeTab}">
                        <a href="#" @click.prevent="activeTab = tab.id">{{ tab.label }}</a>
                    </li>
                </ul>
            </div>
            <div class="tabs-content-area">
            <div class="content tabs-content" v-if="activeTab === 'teams'">
                <AddTeam v-if="tournament.system === 'supermele' || (!tournament.games?.length && !tournament.playOff)"
                         :import-hidden="tournament.system === 'supermele' && (tournament.games && tournament.games.length > 0)"/>
                <TeamsList v-if="tournament.teams && tournament.teams.length" :activeRound="activeRound"/>
                <div v-else class="mb-5 mt-5">
                    {{ $t('common.please') }} {{ $t('teams.addTeamMessage') }}
                </div>
            </div>
            <Games ref="games" v-if="activeTab === 'games'"
                   :rankingTeams="rankingTeams"
                   :activeRound="activeRound" :teams-in-group="teamsInGroup"
                   @openResults="activeTab = 'ranking'" @startPlayOff="startPlayOff"/>
            <Results v-if="activeTab === 'results'"/>
            <div class="content tabs-content" v-if="activeTab === 'ranking'">
                <Ranking :tournament="tournament" :rankingTeams="rankingTeams" :activeRound="activeRound"/>
                <!-- TODO: still working on cadrage/group B transition
                <div v-if="!tournament.playOff && tournament.teams?.length > 1 && !tournament.tournamentIsFinished && tournament.games?.length">
                    <div class="mt-5">
                        <h2 class="h2">{{ $t('ranking.goPlayOff') }}</h2>
                        <div class="is-flex is-align-items-center mb-2" v-if="tournament.system === 'swiss'">
                            <label class="checkbox">
                                <input type="checkbox" v-model="withCadrage">
                                {{ $t('ranking.withCadrage') }}
                            </label>
                            <span v-if="withCadrage && teamToPlayOff" class="ml-3">{{teamToPlayOff / 2}} + {{teamToPlayOff}}</span>
                        </div>
                        <div class="is-flex is-align-items-center">{{ $t('ranking.chooseNumberTeams') }}
                            <div class="select ml-3">
                                <select v-model.number="tournament.preferences.playOffTeams">
                                    <template v-for="value in teamToPlayOffValues" :key="value">
                                        <option :value="value"
                                                v-if="tournament.teams.length >= value">{{value}}</option>
                                    </template>
                                </select>
                            </div>
                            <button @click="setPlayOffList" class="button is-success ml-3">{{ $t('ranking.go') }}</button>
                        </div>
                    </div>
                    <div class="mt-5" v-if="tournament.system === 'swiss'">
                        <label class="checkbox">
                            <input type="checkbox" v-model="playB">
                            {{ $t('ranking.alsoPlay') }} <strong>{{ $t('ranking.tournamentB') }}</strong>?
                        </label>
                    </div>
                </div>
                -->
            </div>
            </div>
        </template>
        <div class="bottom-actions">
            <div class="bottom-actions__row">
                <button v-if="tournament.roundIsActive" data-testid="btn-save-results" class="bottom-actions__btn bottom-actions__btn--save-results" :disabled="!allScoresFilled" :title="!allScoresFilled ? $t('games.enterAllScores') : ''" @click="$refs.games?.saveResults()">
                    {{ $t('games.saveResults') }}
                </button>
                <button v-if="hasPlayOffConfigured && !tournament.tournamentIsFinished && !tournament.roundIsActive && tournament.games?.length && !tournament.playOff?.length && !tournament.cadrage?.length" data-testid="btn-go-playoff" class="bottom-actions__btn bottom-actions__btn--finish" @click="showPlayoffConfirm = true">
                    {{ $t('ranking.goPlayOff') }}
                </button>
                <button v-if="!tournament.tournamentIsFinished && !tournament.roundIsActive && tournament.games?.length && !tournament.playOff?.length && !tournament.cadrage?.length" data-testid="btn-finish-tournament" class="bottom-actions__btn bottom-actions__btn--outline" @click="showFinishConfirm = true">
                    {{ $t('teams.finishTournament') }}
                </button>
                <button v-if="tournament.playOff?.length && !tournament.tournamentIsFinished" data-testid="btn-restore-round" class="bottom-actions__btn bottom-actions__btn--outline" @click="activeTab = 'games'; $nextTick(() => $refs.games && ($refs.games.showRestoreConfirm = true))">
                    <Undo2 :size="16"/>
                    {{ $t('games.restoreRound') }}
                </button>
                <button v-if="tournamentStarted" data-testid="btn-preferences" class="bottom-actions__btn bottom-actions__btn--purple-outline" @click="showPreferences = true">
                    <IconSettings :size="16"/>
                    {{ $t('teams.preferences') }}
                </button>
                <span v-if="canSaveTournament || tournament.tournamentIsFinished" class="bottom-actions__tooltip-wrapper" :title="isAlreadyArchived ? $t('teams.alreadyArchived') : ''">
                    <button class="bottom-actions__btn bottom-actions__btn--primary" :disabled="isAlreadyArchived" @click="showSaveTournament = true">
                        <IconArchive :size="16"/>
                        {{ $t('teams.saveTournament') }}
                    </button>
                </span>
                <button v-if="tournament.portalIdTournament && tournament.tournamentIsFinished && tournament.teams?.length" class="bottom-actions__btn bottom-actions__btn--gold" @click="showProtocol = !showProtocol">
                    {{ showProtocol ? $t('common.hide') : $t('common.show') }} {{ $t('teams.protocol') }}
                </button>
            </div>
        </div>
        <SaveTournament v-if="showSaveTournament" :ranking-teams="rankingTeams"
                        @close-modal="showSaveTournament = false"/>
        <ConfirmRemoveModal v-if="removeConfirmId" :name="tournament.name" @close="removeConfirmId = null" @remove="removeTournament(); showPreferences = false"/>
        <Modal v-if="showFinishConfirm" @close-modal="showFinishConfirm = false">
            <div class="confirm-finish">
                <p class="confirm-finish__text">{{ $t('teams.finishTournamentConfirm') }}</p>
                <div class="confirm-finish__actions">
                    <button class="confirm-finish__btn confirm-finish__btn--cancel" @click="showFinishConfirm = false">{{ $t('common.cancel') }}</button>
                    <button class="confirm-finish__btn confirm-finish__btn--confirm" data-testid="btn-confirm-finish" @click="showFinishConfirm = false; finishTournament()">{{ $t('teams.finishTournament') }}</button>
                </div>
            </div>
        </Modal>
        <Modal v-if="showPlayoffConfirm" @close-modal="showPlayoffConfirm = false">
            <div class="confirm-playoff" data-testid="playoff-confirm-modal">
                <h3 class="confirm-playoff__title">{{ $t('ranking.goPlayOff') }}</h3>

                <div class="confirm-playoff__field">
                    <label class="confirm-playoff__label">{{ $t('ranking.chooseNumberTeams') }}</label>
                    <select class="confirm-playoff__select" data-testid="confirm-playoff-teams" v-model.number="tournament.preferences.playOffTeams">
                        <template v-for="value in teamToPlayOffValues" :key="value">
                            <option :value="value" v-if="tournament.teams.length >= value">{{ value }}</option>
                        </template>
                    </select>
                </div>

                <div class="confirm-playoff__field">
                    <label class="confirm-playoff__checkbox">
                        <input type="checkbox" v-model="withCadrage" data-testid="confirm-cadrage">
                        {{ $t('ranking.withCadrage') }}
                    </label>
                    <span class="confirm-playoff__hint">{{ $t('ranking.cadrageHint') }}</span>
                    <span v-if="withCadrage && teamToPlayOff" class="confirm-playoff__hint">{{ teamToPlayOff / 2 }} + {{ teamToPlayOff }} {{ $t('teams.teams').toLowerCase() }}</span>
                </div>

                <div v-if="!tournament.isGroupB" class="confirm-playoff__field">
                    <label class="confirm-playoff__checkbox">
                        <input type="checkbox" v-model="playB" data-testid="confirm-play-b">
                        {{ $t('ranking.alsoPlay') }} <strong>{{ $t('ranking.tournamentB') }}</strong>
                    </label>
                </div>

                <div class="confirm-playoff__actions">
                    <button class="confirm-playoff__btn confirm-playoff__btn--cancel" @click="showPlayoffConfirm = false">{{ $t('common.cancel') }}</button>
                    <button class="confirm-playoff__btn confirm-playoff__btn--confirm" data-testid="btn-confirm-playoff" @click="showPlayoffConfirm = false; setPlayOffList()">{{ $t('ranking.go') }}</button>
                </div>
            </div>
        </Modal>
        <Preferences v-if="showPreferences" @close-modal="showPreferences = false" @remove-tournament="removeConfirmId = 1"/>
        <Protocol v-if="showProtocol && tournament.portalIdTournament && tournament.tournamentIsFinished" @close="showProtocol = false" :tournament="tournament" :rankingTeams="rankingTeams"/>
    </div>
</template>

<script>
import AddTeam from './partials/AddTeam.vue';
import Games from './partials/Games.vue';
import Results from './partials/Results.vue';
import Ranking from './partials/Ranking.vue';
import TeamsList from "./partials/TeamsList";
import SaveTournament from "./partials/SaveTournament";
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import ConfirmRemoveModal from "@/components/ConfirmRemoveModal";
import Modal from "@/components/Modal";
import {getTeamsRanking, shuffleArray} from "@/helpers";
import {buildPlayOffScheme, buildCadrageGames} from "@/services/playoff";
import QrCode from "@/components/partials/QrCode";
import Preferences from "@/components/partials/Preferences";
import Protocol from "@/components/partials/Protocol";
import {IconPin, IconSettings, IconArchive} from "@/components/icons";
import {Play, Undo2, Trash2, ChevronDown, Link, MessageCircle, Check, X} from "lucide-vue-next";
import {drawSwissRound, drawSupermeleRound, drawGroupsRound, assignLanes, createGroups} from '@/services/draw';

export default {
    name: 'Tournament',
    data() {
        return {
            activeTab: "teams",
            showSaveTournament: false,
            removeConfirmId: null,
            editingName: false,
            editNameValue: '',
            nameError: false,
            messageSaved: false,
            messageTimeout: null,
            playB: false,
            withCadrage: false,
            teamsInGroup: null,
            showQrCode: false,
            showTypeMessage: false,
            loadingOnServer: false,
            showPreferences: false,
            showProtocol: false,
            showFinishConfirm: false,
            setupPlayOff: false,
            showAdvancedSettings: false,
            showPlayoffConfirm: false,
            pinnedState: localStorage.getItem('petanqueDrawPinned'),
        }
    },
    created() {
        if (!this.tournament) return;
        this.teamsInGroup = this.tournament.groups ? this.tournament.groups.length : 4;
        if (this.tournament.preferences?.withCadrage) {
            this.withCadrage = true;
        }
        if (this.tournament.preferences?.playB) {
            this.playB = true;
        }
        if (this.tournament.tournamentIsFinished) {
            this.activeTab = 'ranking';
        } else if (this.tournament.games?.length) {
            this.activeTab = 'games';
        }
    },
    methods: {
        ...mapActions(useMainStore, ['startRound', 'removeTournament', 'setPlayOff', 'setCadrage', 'addBTournament', 'finishTournament', 'showMessage', 'addTeamToStore', 'saveP', 'changeTournamentName', 'syncToFirebase', 'addRoundToGames', 'savePreferences']),
        startEditName() {
            this.editNameValue = this.tournament.name;
            this.editingName = true;
            this.$nextTick(() => {
                this.$refs.nameInput?.focus();
                this.$refs.nameInput?.select();
            });
        },
        saveName() {
            if (this.editNameValue.trim()) {
                this.changeTournamentName(this.editNameValue.trim());
                this.editingName = false;
                this.nameError = false;
            } else {
                this.nameError = true;
            }
        },
        cancelEditName() {
            this.editingName = false;
        },
        togglePin() {
            if (this.isPinned) {
                localStorage.removeItem('petanqueDrawPinned');
                this.pinnedState = null;
                this.showMessage({title: this.$t('common.unpin'), text: this.$t('messages.tournamentUnpinned')});
            } else {
                localStorage.setItem('petanqueDrawPinned', this.currentTournamentIndex);
                this.pinnedState = this.currentTournamentIndex;
                this.showMessage({title: this.$t('common.pin'), text: this.$t('messages.tournamentPinned')});
            }
        },
        onMessageInput() {
            this.messageSaved = false;
            clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(() => {
                this.syncToFirebase();
                this.messageSaved = true;
            }, 1000);
        },
        setPlayOffList() {
            const withCadrage = this.withCadrage;
            let playOffList;
            if(this.tournament.system === 'swiss') {
                if (withCadrage) {
                    playOffList = this.rankingTeams.slice(this.teamToPlayOff * 0.5, this.teamToPlayOff * 1.5);
                } else {
                    playOffList = this.rankingTeams.slice(0, this.teamToPlayOff)
                }
            } else {
                if(this.tournament.groups.length > 1) {
                    playOffList = [];
                    for (let i = 0; i < this.teamToPlayOff / this.tournament.groups.length; i++) {
                        this.rankingTeams.forEach(group => playOffList.push(group[i]));
                    }
                } else {
                    playOffList = this.rankingTeams[0].slice(0, this.teamToPlayOff)
                }
            }
            if (withCadrage) {
                this.startCadrage(playOffList)
            } else {
                this.startPlayOff(playOffList)
            }
        },
        startCadrage(playOffList) {
            const cadrageGames = buildCadrageGames(playOffList, this.teamToPlayOff);
            this.setCadrage(cadrageGames);
            this.activeTab = 'games';
        },
        startPlayOff(playOffList) {
            const playOffScheme = buildPlayOffScheme(playOffList, !!this.tournament.cadrage);
            this.setPlayOff(playOffScheme);

            this.activeTab = 'games';

            const playB = this.playB;
            if (playB) {
                const tournamentBTeams = this.rankingTeams.slice(this.teamToPlayOff, this.rankingTeams.length)
                    .map(team => ({ ...team }));
                tournamentBTeams.forEach(team => {
                    team.wins = 0;
                    team.buhgolts = 0;
                    team.smallBuhgolts = 0;
                    team.pointsPlus = 0;
                    team.pointsMinus = 0;
                    team.opponents = ['placeholder'];
                    team.lanes = [];
                })
                this.addBTournament(tournamentBTeams, `${this.tournament.name}. Group B`, true);
            }
        },
        restoreTeamsFromLocalStorage() {
            const teams = JSON.parse(localStorage.getItem('petanqueDrawTeamsRestore'));
            if (!teams) return;
            teams.forEach(item => {
                this.addTeamToStore(item)
            })
        },
        drawFirstRound() {
            if (this.tournament.teams.length < 5 && this.tournament.system === 'swiss') {
                this.showMessage({title: this.$t('games.chooseSystem'), text: this.$t('games.chooseSystemText'), type: 'error'});
                return;
            }
            let round = [];
            if (this.tournament.system === 'swiss') {
                const result = drawSwissRound(this.tournament, this.rankingTeams, this.activeRound);
                if (result.error) {
                    this.showMessage({title: this.$t('messages.cantDrawRound'), text: this.$t('messages.tooManyGames'), type: 'error'});
                    return;
                }
                round = result.round;
            } else if (this.tournament.system === 'groups') {
                if (this.teamsInGroup < 3) {
                    this.showMessage({title: this.$t('messages.cantDraw'), text: this.$t('messages.chooseCorrectTeams'), type: 'error'});
                    return;
                }
                const {groups, schemas} = createGroups(this.tournament, this.teamsInGroup);
                this.tournament.groups = groups;
                this.tournament.groupsScheme = schemas;
                round = drawGroupsRound(this.tournament);
            } else if (this.tournament.system === 'supermele') {
                round = drawSupermeleRound(this.tournament, this.rankingTeams);
            }
            if (this.setupPlayOff) {
                this.tournament.preferences.withCadrage = this.withCadrage;
                this.tournament.preferences.playB = this.playB;
            }
            this.playB = false;
            this.savePreferences();
            this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
            this.startRound();
            this.activeTab = 'games';
        }
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'isAdmin', 'user', 'currentTournament', 'savedTournaments', 'allScoresFilled']),
        tournament() {
            return this.currentTournament
        },
        tabs() {
            return [
                { id: 'teams', label: this.$t('teams.teams') },
                { id: 'games', label: this.$t('teams.games') },
                { id: 'results', label: this.$t('teams.results') },
                { id: 'ranking', label: this.$t('teams.ranking') },
            ];
        },
        teamToPlayOffValues() {
            const values = [];
            for (let i = 2; i <= this.tournament.teams.length; i *= 2) {
                values.push(i);
            }

            if (this.withCadrage) {
                values.pop()
            }
            return values;
        },
        canSaveTournament() {
            return this.tournament.tournamentIsFinished && this.tournament.games?.length > 1
                || this.tournament.playoff && this.tournament.playoff[this.tournament.playoff.length - 1].teams[0].team_1_score !== null
        },
        rankingTeams() {
            return getTeamsRanking(this.tournament, this.activeRound)
        },
        activeRound() {
            return this.tournament.games && this.tournament.games.length ?
                this.tournament.roundIsActive ? this.tournament.games.length : this.tournament.games.length + 1
                : 1;
        },
        hasPlayOffConfigured() {
            return this.tournament.system === 'swiss' && this.tournament.preferences?.playOffTeams && this.tournament.preferences.playOffTeams < this.tournament.teams?.length;
        },
        isPinned() {
            return String(this.pinnedState) === String(this.currentTournamentIndex);
        },
        isAlreadyArchived() {
            return !!(this.savedTournaments && this.savedTournaments[this.currentTournamentIndex]);
        },
        tournamentStarted() {
            return !!(this.tournament.games?.length || this.tournament.playOff || this.tournament.cadrage);
        },
        teamToPlayOff() {
            return this.tournament.preferences.playOffTeams;
        }
    },
    components: {
        Play,
        Undo2,
        Trash2,
        IconPin,
        IconSettings,
        IconArchive,
        Protocol,
        Preferences,
        QrCode,
        ConfirmRemoveModal,
        Modal,
        TeamsList,
        AddTeam,
        Games,
        Results,
        Ranking,
        SaveTournament,
        ChevronDown,
        Link,
        MessageCircle,
        Check,
        X
    }
}

</script>

<style scoped>
.tournament-name-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
}

.inline-name-edit {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.inline-name-input {
    font-size: 1.5rem;
    font-weight: 700;
    border: none;
    border-bottom: 2px solid var(--color-primary);
    background: transparent;
    outline: none;
    padding: 0.1rem 0.5rem;
    text-align: center;
    min-width: 0;
    max-width: calc(100vw - 200px);
    width: auto;
    field-sizing: content;
}

.inline-name-input:focus {
    border-bottom-color: var(--color-primary);
}

.inline-name-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
}

.inline-name-btn:active {
    transform: scale(0.9);
}

.inline-name-btn--save {
    background: var(--color-primary);
    color: var(--color-btn-text);
}

.inline-name-btn--save:hover {
    background: var(--color-primary-light);
}

.inline-name-btn--cancel {
    background: var(--color-tab-inactive-bg);
    color: var(--color-tab-inactive-text);
}

.inline-name-btn--cancel:hover {
    background: var(--color-tab-inactive-hover);
}

.remote-toolbar {
    background: var(--color-white);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
}

.remote-toolbar__actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.remote-toolbar__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-input);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.15s;
}

.remote-toolbar__btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-bg);
}

.remote-toolbar__btn--active {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-bg);
}

.remote-toolbar__btn--has-message {
    color: var(--color-primary);
}

.remote-toolbar__message {
    position: relative;
    margin-top: 0.75rem;
}

.remote-toolbar__textarea {
    width: 100%;
    min-height: 100px;
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-input);
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
}

.remote-toolbar__textarea:focus {
    border-color: var(--color-primary);
}

.remote-toolbar__chevron {
    transition: transform 0.25s ease;
    margin-left: 0.1rem;
}

.remote-toolbar__chevron--open {
    transform: rotate(180deg);
}

.slide-enter-active,
.slide-leave-active {
    transition: all 0.25s ease;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
    opacity: 1;
    max-height: 200px;
}

.message-saved-label {
    position: absolute;
    top: 0.4rem;
    right: 0.6rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--color-primary);
    background: var(--color-primary-bg);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    z-index: 1;
}

.bottom-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
}

.bottom-actions__row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.bottom-actions__tooltip-wrapper {
    display: inline-flex;
}

.bottom-actions__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.9rem;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
}

.bottom-actions__btn--outline {
    background: var(--color-btn-dark);
    color: var(--color-btn-text);
    border-color: var(--color-btn-dark);
}

.bottom-actions__btn--outline:hover {
    background: var(--color-btn-dark-hover);
    color: var(--color-btn-text);
    border-color: var(--color-btn-dark-hover);
}

.bottom-actions__btn--save-results {
    background: var(--color-btn-green);
    color: var(--color-btn-text);
    border-color: var(--color-btn-green);
}

.bottom-actions__btn--save-results:hover:not(:disabled) {
    background: var(--color-btn-green-hover);
    border-color: var(--color-btn-green-hover);
}

.bottom-actions__btn--save-results:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.bottom-actions__btn--finish {
    background: var(--color-btn-blue);
    color: var(--color-btn-text);
    border-color: var(--color-btn-blue);
}

.bottom-actions__btn--finish:hover {
    background: var(--color-btn-blue-hover);
    color: var(--color-btn-text);
    border-color: var(--color-btn-blue-hover);
}

.bottom-actions__btn--primary {
    background: var(--color-primary);
    color: var(--color-btn-text);
    border-color: var(--color-primary);
}

.bottom-actions__btn--primary:hover:not(:disabled) {
    background: var(--color-primary-light);
    border-color: var(--color-primary-light);
}

.bottom-actions__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.bottom-actions__btn--purple-outline {
    background: var(--color-primary);
    color: var(--color-btn-text);
    border-color: var(--color-primary);
}

.bottom-actions__btn--purple-outline:hover {
    background: var(--color-primary-light);
    color: var(--color-btn-text);
}

.bottom-actions__btn--success {
    background: var(--color-success);
    color: var(--color-btn-text);
    border-color: var(--color-success);
}

.bottom-actions__btn--success:hover {
    background: var(--color-success-hover);
    border-color: var(--color-success-hover);
}

.bottom-actions__btn--gold {
    background: var(--color-warning);
    color: var(--color-btn-text);
    border-color: var(--color-warning);
    min-width: 10rem;
    justify-content: center;
}

.bottom-actions__btn--gold:hover {
    background: var(--color-warning-hover);
    border-color: var(--color-warning-hover);
    color: var(--color-btn-text);
}

.bottom-actions__btn--danger {
    background: transparent;
    color: var(--color-danger-light);
    border-color: var(--color-danger-light);
}

.bottom-actions__btn--danger:hover {
    background: var(--color-danger-light);
    color: var(--color-btn-text);
}


.pin-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-grey);
    padding: 0.2rem;
    border-radius: 4px;
    transition: color 0.2s, transform 0.2s;
}

.pin-btn:hover {
    color: var(--color-primary);
    transform: scale(1.1);
}

.pin-btn--active {
    color: var(--color-primary);
}

.inline-name-edit-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.inline-name-input--error {
    border-bottom-color: var(--color-error);
}

.inline-name-error {
    font-size: 0.75rem;
    color: var(--color-error);
    margin-top: 0.25rem;
}

.setup-teams-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.5rem;
}

.setup-teams-card :deep(.add-team-card) {
    background: none;
    border: none;
    border-radius: 0;
    padding: 0;
    margin-bottom: 0.75rem;
}

.setup-empty {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--color-text-muted);
    font-size: 0.9rem;
}

.setup-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
}

.setup-card__title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 0.25rem;
}

.setup-card__summary {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin: 0 0 1.25rem;
}

.setup-card__field {
    margin-bottom: 1rem;
}

.setup-card__label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.35rem;
}

.setup-card__radios {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.setup-card__radio {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.85rem;
    cursor: pointer;
}

.setup-card__select {
    padding: 0.45rem 0.75rem;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-input);
    outline: none;
}

.setup-card__select:focus {
    border-color: var(--color-primary);
}

.setup-card__input {
    width: 100%;
    padding: 0.45rem 0.75rem;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-input);
    outline: none;
}

.setup-card__input:focus {
    border-color: var(--color-primary);
}

.setup-card__hint {
    display: block;
    font-size: 0.72rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
}

.setup-card__hint--sub {
    margin-left: 1.5rem;
}

.setup-card__row {
    display: flex;
    gap: 0.75rem;
}

.setup-card__row-item {
    flex: 1;
}

.setup-card__checkbox {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    cursor: pointer;
}

.setup-card__checkbox--sub {
    margin-top: 0.5rem;
}

.setup-card__sub {
    margin-top: 0.5rem;
    padding-left: 1.25rem;
}

.setup-card__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.25rem;
}

.setup-card__or {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-muted);
}

.setup-card__start {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    flex: 1;
    padding: 0.7rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    background: var(--color-success);
    color: var(--color-btn-text);
    cursor: pointer;
    transition: background 0.15s;
}

.setup-card__start:hover {
    background: var(--color-success-hover);
}

.setup-card__delete {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.7rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    border: 1px solid var(--color-error);
    border-radius: 8px;
    background: transparent;
    color: var(--color-error);
    cursor: pointer;
    transition: all 0.15s;
}

.setup-card__delete:hover {
    background: var(--color-error);
    color: var(--color-btn-text);
}

.setup-card__collapse-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    border: none;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-muted, #888);
    cursor: pointer;
    padding: 0.5rem 0;
    transition: color 0.15s;
}

.setup-card__collapse-toggle:hover {
    color: var(--color-primary);
}

.setup-card__collapse-icon {
    transition: transform 0.2s ease;
}

.setup-card__collapse-icon--open {
    transform: rotate(180deg);
}

.setup-card__collapse-content {
    padding-top: 0.25rem;
}

.tabs-content-area {
    min-height: 240px;
}

.confirm-finish {
    padding: 0.5rem 0;
}

.confirm-finish__text {
    font-size: 0.9rem;
    color: var(--color-text);
    line-height: 1.5;
    margin-bottom: 1.25rem;
}

.confirm-finish__actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.confirm-finish__btn {
    padding: 0.5rem 1.25rem;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s;
}

.confirm-finish__btn--cancel {
    background: transparent;
    border-color: var(--color-border);
    color: var(--color-text-secondary);
}

.confirm-finish__btn--cancel:hover {
    border-color: var(--color-text-muted);
    background: var(--color-surface-hover);
}

.confirm-finish__btn--confirm {
    background: var(--color-btn-dark);
    border-color: var(--color-btn-dark);
    color: var(--color-btn-text);
}

.confirm-finish__btn--confirm:hover {
    background: var(--color-btn-dark-hover);
    border-color: var(--color-btn-dark-hover);
}

.confirm-playoff {
    padding: 0.5rem 0;
}

.confirm-playoff__title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

.confirm-playoff__field {
    margin-bottom: 0.75rem;
}

.confirm-playoff__label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 0.35rem;
    color: var(--color-text-secondary, #555);
}

.confirm-playoff__select {
    display: block;
    width: 100%;
    max-width: 120px;
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    background: var(--color-bg-input, #fff);
}

.confirm-playoff__checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
}

.confirm-playoff__hint {
    display: block;
    font-size: 0.8rem;
    color: var(--color-text-muted, #888);
    margin-top: 0.25rem;
    margin-left: 1.5rem;
}

.confirm-playoff__actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1.25rem;
}

.confirm-playoff__btn {
    padding: 0.5rem 1.25rem;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s;
}

.confirm-playoff__btn--cancel {
    background: transparent;
    border-color: var(--color-border, #e0e0e0);
    color: var(--color-text-secondary, #555);
}

.confirm-playoff__btn--cancel:hover {
    border-color: var(--color-text-muted);
    background: #f5f5f5;
}

.confirm-playoff__btn--confirm {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
}

.confirm-playoff__btn--confirm:hover {
    background: var(--color-primary-light, #5b21b6);
    border-color: var(--color-primary-light, #5b21b6);
}
</style>

