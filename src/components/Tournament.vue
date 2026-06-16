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
                <p class="setup-card__summary">{{ tournament.teams.length }} {{ tournament.system === 'tir' ? pluralizeParticipants(tournament.teams.length) : $t('teams.teams').toLowerCase() }}</p>

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
                        <label class="setup-card__radio" v-if="tournament.teams?.length >= 8 && tournament.teams?.length % 4 === 0">
                            <input type="radio" name="system" value="poules" v-model="tournament.system">
                            {{ $t('teams.poules') }}
                        </label>
                        <label class="setup-card__radio">
                            <input type="radio" name="system" value="supermele" v-model="tournament.system">
                            {{ $t('teams.supermele') }}
                        </label>
                        <label class="setup-card__radio">
                            <input type="radio" name="system" value="tir" v-model="tournament.system">
                            {{ $t('teams.tir') }}
                        </label>
                    </div>
                </div>

                <div v-if="tournament.system === 'groups'" class="setup-card__field">
                    <label class="setup-card__label">{{ $t('teams.teamsInGroup') }}</label>
                    <select class="setup-card__select" data-testid="select-teams-in-group" v-model.number="teamsInGroup">
                        <option :value="tournament.teams.length">{{ $t('teams.allTeams') }}</option>
                        <template v-for="(team, index) in tournament.teams" :key="index">
                            <option v-if="index > 1">{{index + 1}}</option>
                        </template>
                    </select>
                    <div v-if="isAllTeamsGroup" class="setup-card__field mt-2">
                        <label class="setup-card__label">{{ $t('teams.roundsCount') }}</label>
                        <select class="setup-card__select" v-model.number="groupRoundsCount">
                            <option v-for="r in maxGroupRounds" :key="r" :value="r">{{ r }}</option>
                        </select>
                        <span class="setup-card__hint">{{ $t('teams.roundsCountHint') }}</span>
                    </div>
                    <GroupDrawMethod v-if="hasTeamRatings" v-model="tournament.preferences.groupDrawMethod"/>
                </div>

                <div v-if="tournament.system === 'poules'" class="setup-card__field">
                    <span class="setup-card__hint">{{ Math.floor(tournament.teams.length / 4) }} {{ $t('setup.poulesInfo', { count: poulesPlayoffCount }) }}</span>
                    <span v-if="tournament.teams.length % 4 !== 0" class="setup-card__hint setup-card__hint--warn">{{ $t('setup.poulesHint') }}</span>
                </div>

                <div v-if="tournament.system === 'supermele'" class="setup-card__field">
                    <label class="setup-card__label">{{ $t('teams.playersInTeam') }}</label>
                    <select class="setup-card__select" v-model.number="tournament.supermelePlayers">
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>

                <div v-if="tournament.system === 'tir'" class="setup-card__field">
                    <label class="setup-card__checkbox">
                        <input type="checkbox" v-model="tirTwoRounds">
                        {{ $t('tir.twoRoundSystem') }}
                    </label>
                    <span class="setup-card__hint">{{ $t('tir.twoRoundHint') }}</span>
                    <label class="setup-card__checkbox" style="margin-top: 0.75rem">
                        <input type="checkbox" v-model="tirJunior">
                        {{ $t('tir.juniorTournament') }}
                    </label>
                    <span class="setup-card__hint">{{ $t('tir.juniorHint') }}</span>
                </div>

                <div v-if="(tournament.system === 'swiss' || tournament.system === 'groups') && tournament.system !== 'poules'" class="setup-card__field">
                    <label class="setup-card__checkbox">
                        <input type="checkbox" v-model="setupPlayOff" data-testid="checkbox-playoff">
                        {{ $t('setup.enablePlayOff') }}
                    </label>
                    <div v-if="setupPlayOff" class="setup-card__sub">
                        <div v-if="!withBarrage">
                            <label class="setup-card__label">{{ $t('modals.playOffTeams') }}</label>
                            <select class="setup-card__select" v-model.number="tournament.preferences.playOffTeams" data-testid="select-playoff-teams">
                                <template v-for="value in teamToPlayOffValues" :key="value">
                                    <option :value="value" v-if="tournament.teams.length >= value">{{value}}</option>
                                </template>
                            </select>
                            <span class="setup-card__hint">{{ $t('modals.playOffTeamsHint') }}</span>
                        </div>
                        <label class="setup-card__checkbox setup-card__checkbox--sub">
                            <input type="checkbox" v-model="withCadrage" data-testid="checkbox-cadrage">
                            {{ $t('ranking.withCadrage') }}
                        </label>
                        <span class="setup-card__hint setup-card__hint--sub">{{ $t('ranking.cadrageHint') }}</span>
                        <label v-if="tournament.system === 'swiss'" class="setup-card__checkbox setup-card__checkbox--sub mt-2">
                            <input type="checkbox" v-model="withBarrage" data-testid="checkbox-barrage">
                            {{ $t('ranking.withBarrage') }}
                        </label>
                        <span v-if="tournament.system === 'swiss'" class="setup-card__hint setup-card__hint--sub">{{ $t('ranking.barrageHint') }}</span>
                        <div v-if="withBarrage && tournament.system === 'swiss'" class="setup-card__sub">
                            <label class="setup-card__label">{{ $t('ranking.barrageTeams') }}</label>
                            <select class="setup-card__select" v-model.number="tournament.preferences.barrageTeams" data-testid="select-barrage-teams">
                                <template v-for="value in barrageTeamValues" :key="value">
                                    <option :value="value">{{ value }}</option>
                                </template>
                            </select>
                            <span class="setup-card__hint">{{ $t('ranking.barrageTeamsHint') }}</span>
                            <span class="setup-card__hint">{{ barrageToPlayoffCount }} {{ $t('ranking.barrageToPlayoff') }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="tournament.system === 'swiss' && !tournament.isGroupB" class="setup-card__field">
                    <label class="setup-card__checkbox">
                        <input type="checkbox" v-model="playB" data-testid="checkbox-play-b">
                        {{ $t('ranking.alsoPlay') }} <strong>{{ $t('ranking.tournamentB') }}</strong>
                    </label>
                </div>

                <div v-if="tournament.system === 'swiss'" class="setup-card__field">
                    <label class="setup-card__label">{{ $t('modals.swissRoundsCount') }}</label>
                    <input class="setup-card__input" type="number" v-model.number="tournament.preferences.swissRoundsCount" min="1">
                    <span class="setup-card__hint">{{ $t('modals.swissRoundsCountHint') }}</span>
                </div>

                <div v-if="tournament.system === 'swiss'" class="setup-card__field">
                    <label class="setup-card__label">{{ $t('modals.prizePlaces') }}</label>
                    <input class="setup-card__input" type="number" v-model.number="tournament.preferences.prizePlaces" min="1">
                    <span class="setup-card__hint">{{ $t('modals.prizePlacesHint') }}</span>
                </div>

                <button v-if="tournament.system !== 'tir'" class="setup-card__collapse-toggle" @click="showAdvancedSettings = !showAdvancedSettings">
                    <ChevronDown :size="16" class="setup-card__collapse-icon" :class="{'setup-card__collapse-icon--open': showAdvancedSettings}"/>
                    {{ $t('setup.additionalSettings') }}
                </button>

                <div v-if="showAdvancedSettings && tournament.system !== 'tir'" class="setup-card__collapse-content">
                    <div class="setup-card__field">
                        <label class="setup-card__checkbox">
                            <input type="checkbox" v-model="tournament.preferences.timeLimitEnabled">
                            {{ $t('modals.timeLimit') }}
                        </label>
                        <span class="setup-card__hint">{{ $t('modals.timeLimitHint') }}</span>
                        <div v-if="tournament.preferences.timeLimitEnabled" class="setup-card__nested">
                            <div class="setup-card__row mt-2">
                                <div class="setup-card__row-item">
                                    <span class="setup-card__label">{{ setupPlayOff ? $t('modals.timeLimitSwiss') : $t('modals.timeLimit') }}</span>
                                    <div class="select is-fullwidth">
                                        <select v-model.number="tournament.preferences.timeLimit">
                                            <option v-for="t in timeLimitOptions" :key="t" :value="t">{{ t }} {{ $t('modals.min') }}</option>
                                        </select>
                                    </div>
                                </div>
                                <div v-if="setupPlayOff" class="setup-card__row-item">
                                    <span class="setup-card__label">{{ $t('modals.timeLimitPlayoff') }}</span>
                                    <div class="select is-fullwidth">
                                        <select v-model.number="tournament.preferences.playoffTimeLimit">
                                            <option v-for="t in timeLimitOptions" :key="t" :value="t">{{ t }} {{ $t('modals.min') }}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <label v-if="setupPlayOff" class="setup-card__checkbox mt-2">
                                <input type="checkbox" v-model="tournament.preferences.noTimeLimitFinale">
                                {{ $t('modals.noTimeLimitFinale') }}
                            </label>
                            <div class="mt-4">
                                <label class="setup-card__label">{{ $t('modals.cochonettes') }}</label>
                                <div class="select is-fullwidth">
                                    <select v-model.number="tournament.preferences.cochonettes">
                                        <option :value="1">1</option>
                                        <option :value="2">2</option>
                                    </select>
                                </div>
                                <span class="setup-card__hint">{{ $t('modals.cochonettesHint') }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="setup-card__field">
                        <label class="setup-card__checkbox">
                            <input type="checkbox" v-model="tournament.preferences.cochonettesEnabled">
                            {{ $t('modals.perRoundScoring') }}
                        </label>
                        <span class="setup-card__hint">{{ $t('modals.perRoundScoringHint') }}</span>
                    </div>

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

                    <div class="setup-card__field">
                        <label class="setup-card__checkbox">
                            <input type="checkbox" v-model="tournament.preferences.isTestTournament">
                            {{ $t('setup.testTournament') }}
                        </label>
                        <span class="setup-card__hint">{{ $t('setup.testTournamentHint') }}</span>
                    </div>
                </div>

                <div class="setup-card__actions">
                    <button class="setup-card__start" data-testid="btn-draw-first-round" @click="drawFirstRound">
                        <Play :size="18"/>
                        {{ $t('setup.drawFirstRound') }}
                    </button>
                    <span class="setup-card__or">{{ $t('common.or') }}</span>
                    <button class="setup-card__delete" data-testid="btn-delete-setup" @click="removeConfirmId = 1">
                        <Trash2 :size="16"/>
                        <span class="is-hidden-mobile">{{ $t('teams.removeTournament') }}</span>
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
                <div v-if="!(tournament.teams?.length > 2)" class="setup-card__actions setup-card__actions--delete-only">
                    <button class="setup-card__delete" @click="removeConfirmId = 1">
                        <Trash2 :size="16"/>
                        <span>{{ $t('teams.removeTournament') }}</span>
                    </button>
                </div>
            </div>
        </template>

        <!-- POST-START: Tir module (no tabs) -->
        <template v-else-if="tournament.system === 'tir'">
            <TirModule ref="tirModule" @finish="showFinishConfirm = true"/>
            <div class="bottom-actions">
                <div class="bottom-actions__row">
                    <button class="bottom-actions__btn bottom-actions__btn--danger" @click="removeConfirmId = 1">
                        <Trash2 :size="16"/>
                        {{ $t('teams.removeTournament') }}
                    </button>
                    <template v-if="tournament.tournamentIsFinished">
                        <span class="bottom-actions__tooltip-wrapper" :title="isAlreadyArchived ? $t('teams.alreadyArchived') : ''">
                            <button class="bottom-actions__btn bottom-actions__btn--primary" :disabled="isAlreadyArchived" @click="showSaveTournament = true">
                                <IconArchive :size="16"/>
                                {{ $t('teams.saveTournament') }}
                            </button>
                        </span>
                        <button class="bottom-actions__btn bottom-actions__btn--success" @click="$refs.tirModule.exportResults('csv')">
                            <Download :size="16"/>
                            {{ $t('tir.exportResults') }}
                        </button>
                        <button v-if="tournament.portalIdTournament" class="bottom-actions__btn bottom-actions__btn--gold" @click="showProtocol = !showProtocol">
                            {{ showProtocol ? $t('common.hide') : $t('common.show') }} {{ $t('teams.protocol') }}
                        </button>
                    </template>
                </div>
            </div>
        </template>

        <!-- POST-START: Tabbed tournament view -->
        <template v-else>
            <div class="tournament-nav">
                <button v-for="(tab, index) in tabs" :key="index"
                    :id="'tab-' + tab.id"
                    class="tournament-nav__btn"
                    :class="[`tournament-nav__btn--${tab.id}`, {'tournament-nav__btn--active': tab.id === activeTab}]"
                    @click="activeTab = tab.id">
                    <component :is="tab.icon" :size="18"/>
                    <span>{{ tab.label }}</span>
                </button>
            </div>
            <div class="tabs-content-area">
            <div class="content tabs-content" v-if="activeTab === 'teams'">
                <AddTeam v-if="(tournament.system === 'supermele' || (!tournament.games?.length && !tournament.playOff)) && !tournament.tirStarted"
                         :import-hidden="tournament.system === 'supermele' && (tournament.games && tournament.games.length > 0)"/>
                <TeamsList v-if="tournament.teams && tournament.teams.length" :activeRound="activeRound"/>
                <div v-else class="mb-5 mt-5">
                    {{ $t('common.please') }} {{ $t('teams.addTeamMessage') }}
                </div>
            </div>
            <Games ref="games" v-if="activeTab === 'games'"
                   :rankingTeams="rankingTeams"
                   :activeRound="activeRound" :teams-in-group="teamsInGroup"
                   @openResults="activeTab = 'ranking'" @startPlayOff="startPlayOff"
                   @startFirstRound="startFirstRound" @redraw="redrawRounds"/>
            <Results v-if="activeTab === 'results'"/>
            <StreamPresets v-if="activeTab === 'streams'"/>
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
        <div class="bottom-actions" v-if="tournament.system !== 'tir'">
            <div class="bottom-actions__row">
                <button v-if="hasPlayOffConfigured && !tournament.tournamentIsFinished && !tournament.roundIsActive && tournament.games?.length && !tournament.playOff?.length && !tournament.cadrage?.length" data-testid="btn-go-playoff" class="bottom-actions__btn bottom-actions__btn--finish" @click="openPlayoffConfirm">
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
            </div>
        </template>
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

                <div v-if="!withBarrage" class="confirm-playoff__field">
                    <label class="confirm-playoff__label">{{ $t('modals.playOffTeams') }}</label>
                    <select class="confirm-playoff__select" data-testid="confirm-playoff-teams" v-model.number="tournament.preferences.playOffTeams">
                        <template v-for="value in teamToPlayOffValues" :key="value">
                            <option :value="value" v-if="tournament.teams.length >= value">{{ value }}</option>
                        </template>
                    </select>
                </div>

                <div v-if="tournament.system === 'swiss'" class="confirm-playoff__field">
                    <label class="confirm-playoff__checkbox">
                        <input type="checkbox" v-model="withCadrage" data-testid="confirm-cadrage">
                        {{ $t('ranking.withCadrage') }}
                    </label>
                    <span class="confirm-playoff__hint">{{ $t('ranking.cadrageHint') }}</span>
                    <span v-if="withCadrage && teamToPlayOff" class="confirm-playoff__hint">{{ teamToPlayOff / 2 }} + {{ teamToPlayOff }} {{ $t('teams.teams').toLowerCase() }}</span>
                </div>

                <div v-if="tournament.system === 'swiss'" class="confirm-playoff__field">
                    <label class="confirm-playoff__checkbox">
                        <input type="checkbox" v-model="withBarrage" data-testid="confirm-barrage">
                        {{ $t('ranking.withBarrage') }}
                    </label>
                    <span class="confirm-playoff__hint">{{ $t('ranking.barrageHint') }}</span>
                    <div v-if="withBarrage" class="mt-2">
                        <label class="confirm-playoff__label">{{ $t('ranking.barrageTeams') }}</label>
                        <select class="confirm-playoff__select" v-model.number="tournament.preferences.barrageTeams" data-testid="confirm-barrage-teams">
                            <template v-for="value in barrageTeamValues" :key="value">
                                <option :value="value">{{ value }}</option>
                            </template>
                        </select>
                        <span class="confirm-playoff__hint">{{ $t('ranking.barrageTeamsHint') }}</span>
                        <span class="confirm-playoff__hint">{{ barrageToPlayoffCount }} {{ $t('ranking.barrageToPlayoff') }}</span>
                    </div>
                </div>

                <div v-if="tournament.system === 'swiss' && !tournament.isGroupB" class="confirm-playoff__field">
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
        <Protocol v-if="showProtocol && tournament.portalIdTournament && tournament.tournamentIsFinished && tournament.system !== 'tir'" @close="showProtocol = false" :tournament="tournament" :rankingTeams="rankingTeams"/>
        <TirProtocol v-if="showProtocol && tournament.portalIdTournament && tournament.tournamentIsFinished && tournament.system === 'tir'" @close="showProtocol = false" :tournament="tournament"/>
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
import GroupDrawMethod from "@/components/partials/GroupDrawMethod";
import {IconPin, IconSettings, IconArchive} from "@/components/icons";
import {Play, Undo2, Trash2, ChevronDown, Link, MessageCircle, Check, X, Users, Grid3x3, List, Trophy, RefreshCw, Radio, Download} from "lucide-vue-next";
import StreamPresets from "@/components/partials/StreamPresets.vue";
import {drawSwissRound, drawSupermeleRound, drawGroupsRound, assignLanes, createGroups, generateConstrainedGroups, createPoules, drawPoulesRound, reshuffleGroupSchedule} from '@/services/draw';
import TirModule from "@/components/tir/TirModule.vue";
import TirProtocol from "@/components/tir/TirProtocol.vue";

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
            withBarrage: false,
            teamsInGroup: null,
            groupRoundsCount: null,
            showQrCode: false,
            showTypeMessage: false,
            loadingOnServer: false,
            showPreferences: false,
            showProtocol: false,
            showFinishConfirm: false,
            setupPlayOff: false,
            showAdvancedSettings: false,
            showPlayoffConfirm: false,
            tirTwoRounds: false,
            tirJunior: false,
            pinnedState: localStorage.getItem('petanqueDrawPinned'),
        }
    },
    watch: {
        withCadrage(val) {
            if (val) this.withBarrage = false;
        },
        withBarrage(val) {
            if (val) this.withCadrage = false;
        },
        teamsInGroup(val) {
            if (val === this.tournament.teams?.length) {
                this.groupRoundsCount = this.defaultGroupRounds;
            }
        }
    },
    created() {
        if (!this.tournament) return;
        this.teamsInGroup = this.tournament.groups ? this.tournament.groups.length : 4;
        const n = this.tournament.teams?.length || 4;
        this.groupRoundsCount = n % 2 === 0 ? n - 1 : n;
        if (this.tournament.preferences && !this.tournament.preferences.groupDrawMethod) {
            this.tournament.preferences.groupDrawMethod = 'seeded';
        }
        if (this.tournament.preferences?.withCadrage) {
            this.withCadrage = true;
        }
        if (this.tournament.preferences?.withBarrage) {
            this.withBarrage = true;
        }
        if (this.tournament.preferences?.playB) {
            this.playB = true;
        }
        if (this.tournament.tournamentIsFinished) {
            this.activeTab = 'ranking';
        } else if (this.tournament.games?.length || this.tournament.tirStarted) {
            this.activeTab = 'games';
        }
    },
    methods: {
        ...mapActions(useMainStore, ['startRound', 'removeTournament', 'setPlayOff', 'setCadrage', 'setBarrage', 'addBTournament', 'finishTournament', 'showMessage', 'addTeamToStore', 'saveP', 'changeTournamentName', 'syncToFirebase', 'addRoundToGames', 'savePreferences']),
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
        pluralizeParticipants(n) {
            const locale = this.$i18n.locale;
            if (locale === 'ua') {
                const mod10 = n % 10;
                const mod100 = n % 100;
                if (mod10 === 1 && mod100 !== 11) return 'учасник';
                if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'учасники';
                return 'учасників';
            }
            if (locale === 'fr') return n === 1 ? 'participant' : 'participants';
            if (locale === 'es') return n === 1 ? 'participante' : 'participantes';
            return n === 1 ? 'participant' : 'participants';
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
        openPlayoffConfirm() {
            if (this.tournament.preferences?.playB) this.playB = true;
            if (this.tournament.preferences?.withCadrage) this.withCadrage = true;
            if (this.tournament.preferences?.withBarrage) this.withBarrage = true;
            this.showPlayoffConfirm = true;
        },
        setPlayOffList() {
            const withCadrage = this.withCadrage;
            const withBarrage = this.withBarrage;
            let playOffList;
            if(this.tournament.system === 'swiss') {
                if (withBarrage) {
                    const barrageCount = this.tournament.preferences.barrageTeams || 8;
                    playOffList = this.rankingTeams.slice(0, barrageCount);
                    this.startBarrage(playOffList);
                    return;
                } else if (withCadrage) {
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
        startBarrage(teamsList) {
            // Create groups of 4 from the top teams
            const teamsCount = teamsList.length;
            const groupsQuantity = teamsCount / 4;
            const groups = [];
            for (let i = 0; i < groupsQuantity; i++) {
                groups.push([]);
            }

            // Snake distribution (same as createPoules)
            let direction = 1;
            let groupIdx = 0;
            for (let i = 0; i < teamsCount; i++) {
                groups[groupIdx].push(teamsList[i]);
                if (direction === 1 && groupIdx === groupsQuantity - 1) {
                    direction = -1;
                } else if (direction === -1 && groupIdx === 0) {
                    direction = 1;
                } else {
                    groupIdx += direction;
                }
            }

            const startIndex = this.tournament.games ? this.tournament.games.length : 0;

            // Set up barrage data
            const barrage = {
                groups,
                barrageRound: 1,
                startIndex
            };
            this.setBarrage(barrage);

            // Draw first barrage round using poules round 1 logic
            const round = [];
            groups.forEach((group, groupIndex) => {
                // Round 1: A vs C, B vs D
                round.push({
                    group: groupIndex,
                    team_1: group[0].title,
                    team_1_score: null,
                    team_2: group[2].title,
                    team_2_score: null
                });
                round.push({
                    group: groupIndex,
                    team_1: group[1].title,
                    team_1_score: null,
                    team_2: group[3].title,
                    team_2_score: null
                });
            });

            this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
            this.startRound();
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
            if (this.tournament.system === 'tir') {
                this.tournament.tirStarted = true;
                if (!this.tournament.tirParticipants) {
                    this.tournament.tirParticipants = this.tournament.teams.map(t => ({
                        id: Date.now() + Math.random(),
                        name: t.title,
                        city: '',
                        scores: {}
                    }));
                }
                if (!this.tournament.tirConfig) {
                    this.tournament.tirConfig = {junior: this.tirJunior, rounds: this.tirTwoRounds ? 2 : 1};
                }
                this.tournament.tirRound = 1;
                if (!this.tournament.games) this.tournament.games = [];
                this.tournament.games.push([]);
                this.syncToFirebase();
                this.activeTab = 'games';
                return;
            }
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
                const result = generateConstrainedGroups(this.tournament, this.teamsInGroup);
                this.tournament.groups = result.groups;
                this.tournament.groupsScheme = result.schemas;
                if (result.warning) {
                    this.showMessage({title: this.$t('messages.warning'), text: this.$t('messages.constraintsNotSatisfied'), type: 'error'});
                }
                if (this.isAllTeamsGroup) {
                    this.tournament.preferences.groupTotalRounds = this.groupRoundsCount;
                    const schedule = [];
                    for (let i = 0; i < this.groupRoundsCount; i++) {
                        schedule.push(assignLanes(shuffleArray(drawGroupsRound(this.tournament)), this.tournament));
                    }
                    this.tournament.groupSchedule = schedule;
                    round = schedule[0];
                } else {
                    round = drawGroupsRound(this.tournament);
                }
            } else if (this.tournament.system === 'poules') {
                const {groups} = createPoules(this.tournament);
                this.tournament.groups = groups;
                this.tournament.poulesRound = 1;
                round = drawPoulesRound(this.tournament);
            } else if (this.tournament.system === 'supermele') {
                round = drawSupermeleRound(this.tournament, this.rankingTeams);
            }
            if (this.tournament.system === 'poules') {
                this.tournament.preferences.playOffEnabled = true;
                const qualifiedCount = this.tournament.teams.length / 2;
                this.tournament.preferences.playOffTeams = Math.pow(2, Math.ceil(Math.log2(qualifiedCount)));
            } else if (this.setupPlayOff) {
                this.tournament.preferences.playOffEnabled = true;
                this.tournament.preferences.withCadrage = this.withCadrage;
                this.tournament.preferences.withBarrage = this.withBarrage;
                this.tournament.preferences.playB = this.playB;
            } else {
                this.tournament.preferences.playOffEnabled = false;
            }
            this.playB = false;
            this.savePreferences();
            if (this.tournament.groupSchedule) {
                this.addRoundToGames(round);
            } else {
                this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
            }
            this.syncToFirebase();
            this.activeTab = 'games';
        },
        startFirstRound() {
            this.tournament.tournamentIsStarted = true;
            this.startRound();
            this.activeTab = 'games';
        },
        redrawRounds() {
            if (!this.tournament.games?.length) return;
            if (this.tournament.roundIsActive) return;
            this.tournament.games = [];
            this.tournament.teams.forEach(team => {
                team.lanes = [];
            });

            if (this.tournament.system === 'groups' && this.tournament.groups) {
                const {groups, schemas} = reshuffleGroupSchedule(this.tournament);
                this.tournament.groups = groups;
                this.tournament.groupsScheme = schemas;
                this.tournament.groupSchedule = null;

                let round;
                if (this.isAllTeamsGroup) {
                    const totalRounds = this.tournament.preferences?.groupTotalRounds || this.groupRoundsCount;
                    const schedule = [];
                    for (let i = 0; i < totalRounds; i++) {
                        schedule.push(assignLanes(shuffleArray(drawGroupsRound(this.tournament)), this.tournament));
                    }
                    this.tournament.groupSchedule = schedule;
                    round = schedule[0];
                } else {
                    round = drawGroupsRound(this.tournament);
                }

                if (this.tournament.groupSchedule) {
                    this.addRoundToGames(round);
                } else {
                    this.addRoundToGames(assignLanes(shuffleArray(round), this.tournament));
                }
            } else {
                this.tournament.groupSchedule = null;
                this.tournament.groupsScheme = null;
                this.tournament.groups = null;
                this.drawFirstRound();
            }

            this.tournament.roundIsActive = false;
            this.tournament.tournamentIsStarted = false;
            this.syncToFirebase();
            this.showMessage({title: this.$t('messages.redrawDone'), text: this.$t('messages.redrawDoneText')});
        }
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'isAdmin', 'user', 'currentTournament', 'savedTournaments', 'allScoresFilled']),
        tournament() {
            return this.currentTournament
        },
        tabs() {
            if (this.tournament.system === 'tir') {
                return [
                    { id: 'teams', label: this.$t('teams.teams'), icon: 'Users' },
                    { id: 'games', label: this.$t('teams.games'), icon: 'Grid3x3' },
                ];
            }
            return [
                { id: 'teams', label: this.$t('teams.teams'), icon: 'Users' },
                { id: 'games', label: this.$t('teams.games'), icon: 'Grid3x3' },
                { id: 'results', label: this.$t('teams.results'), icon: 'List' },
                { id: 'ranking', label: this.$t('teams.ranking'), icon: 'Trophy' },
                { id: 'streams', label: this.$t('streams.title'), icon: 'Radio' },
            ];
        },
        isAllTeamsGroup() {
            return this.tournament.system === 'groups' && this.teamsInGroup === this.tournament.teams.length;
        },
        maxGroupRounds() {
            const n = this.tournament.teams.length;
            const singleRoundRobin = n % 2 === 0 ? n - 1 : n;
            return singleRoundRobin * 2;
        },
        defaultGroupRounds() {
            const n = this.tournament.teams.length;
            return n % 2 === 0 ? n - 1 : n;
        },
        timeLimitOptions() {
            const options = [1];
            for (let i = 20; i <= 120; i += 5) options.push(i);
            return options;
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
            if (this.tournament.system === 'poules') return false;
            return (this.tournament.system === 'swiss' || this.tournament.system === 'groups') && this.tournament.preferences?.playOffEnabled && this.tournament.preferences.playOffTeams < this.tournament.teams?.length;
        },
        isPinned() {
            return String(this.pinnedState) === String(this.currentTournamentIndex);
        },
        isAlreadyArchived() {
            return !!(this.savedTournaments && this.savedTournaments[this.currentTournamentIndex]);
        },
        hasTeamRatings() {
            return this.tournament.useRating && this.tournament.teams?.some(t => t.rating > 0);
        },
        tournamentStarted() {
            return !!(this.tournament.games?.length || this.tournament.playOff || this.tournament.cadrage || this.tournament.tirStarted || this.tournament.tournamentIsFinished);
        },
        teamToPlayOff() {
            return this.tournament.preferences.playOffTeams;
        },
        poulesPlayoffCount() {
            const groups = Math.floor(this.tournament.teams?.length / 4) || 0;
            const estimated = groups * 2;
            return Math.pow(2, Math.ceil(Math.log2(estimated || 1)));
        },
        barrageTeamValues() {
            const values = [];
            const maxTeams = this.tournament.teams?.length || 0;
            for (let i = 4; i <= maxTeams; i *= 2) {
                values.push(i);
            }
            return values;
        },
        barrageToPlayoffCount() {
            const barrageTeams = this.tournament.preferences?.barrageTeams || 8;
            const groups = barrageTeams / 4;
            const estimated = groups * 2;
            return Math.pow(2, Math.ceil(Math.log2(estimated)));
        },
        allGamesFinishedForRound() {
            const games = this.tournament.games?.[this.activeRound - 1];
            if (!games?.length) return false;
            return games.every(g => g.status === 'finished' || g.team_2 === 'Technical');
        }
    },
    components: {
        Play,
        Undo2,
        Trash2,
        RefreshCw,
        IconPin,
        IconSettings,
        IconArchive,
        Protocol,
        GroupDrawMethod,
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
        TirModule,
        ChevronDown,
        Link,
        MessageCircle,
        Check,
        X,
        Users,
        Grid3x3,
        List,
        Trophy,
        Radio,
        Download,
        TirProtocol,
        StreamPresets
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
    font-size: 1rem;
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
    font-size: 1rem;
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
    font-size: 1rem;
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
    padding-top: 1rem;
    margin-top: 1rem;
    border-top: 1px solid var(--color-border, #eee);
}

.bottom-actions__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
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
    font-size: 1rem;
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
    font-size: 1rem;
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
    font-size: 1rem;
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
    font-size: 1rem;
    color: var(--color-text-muted);
    margin: 0 0 1.25rem;
}

.setup-card__field {
    margin-bottom: 1rem;
}

.setup-card__label {
    display: block;
    font-size: 1rem;
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
    font-size: 1rem;
    cursor: pointer;
}

.setup-card__select {
    height: auto;
    padding: 0.5rem 2.5rem 0.5rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-input);
    outline: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 16px;
}

.setup-card__select:focus {
    border-color: var(--color-primary);
}

.setup-card__input {
    width: 100%;
    padding: 0.45rem 0.75rem;
    font-size: 1rem;
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
    font-size: 1rem;
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
    font-size: 1rem;
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

.setup-card__actions--delete-only {
    justify-content: flex-end;
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
    font-size: 1rem;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.7rem 1rem;
    font-size: 1rem;
    font-weight: 500;
    border: 1px solid var(--color-error);
    border-radius: 8px;
    background: transparent;
    color: var(--color-error);
    cursor: pointer;
    transition: all 0.15s;
    outline: none;
}

.setup-card__delete:focus-visible {
    box-shadow: 0 0 0 2px var(--color-error);
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
    font-size: 1rem;
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

.setup-card__nested {
    margin-top: 0.5rem;
    padding-left: 1.25rem;
    border-left: 2px solid var(--color-border);
}

.tournament-nav {
    display: flex;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px 12px 0 0;
    padding: 6px 0;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: -1px;
}

.tournament-nav__btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 6px;
    border: none;
    background: none;
    color: var(--color-text-muted);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s;
}

.tournament-nav__btn--active {
    font-weight: 700;
}

.tournament-nav__btn--teams.tournament-nav__btn--active {
    color: var(--tir-delete, #e53935);
}

.tournament-nav__btn--games.tournament-nav__btn--active {
    color: var(--color-primary);
}

.tournament-nav__btn--results.tournament-nav__btn--active {
    color: var(--tir-carreau, #4caf50);
}

.tournament-nav__btn--ranking.tournament-nav__btn--active {
    color: var(--tir-touche, #ff9800);
}

.tournament-nav__btn--streams.tournament-nav__btn--active {
    color: #e53935;
}

.tabs-content-area {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0 0 12px 12px;
    padding: 16px;
    min-height: 240px;
}

.confirm-finish {
    padding: 0.5rem 0;
}

.confirm-finish__text {
    font-size: 1rem;
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
    font-size: 1rem;
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
    margin: -1.25rem;
    padding: 1.25rem;
}

.confirm-playoff__title {
    font-size: 1.1rem;
    font-weight: 700;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--color-border, #e0e0e0);
    margin-left: -1.25rem;
    margin-right: -1.25rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
}

.confirm-playoff__field {
    margin-bottom: 0.75rem;
}

.confirm-playoff__label {
    display: block;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.35rem;
    color: var(--color-text-secondary, #555);
}

.confirm-playoff__select {
    display: block;
    width: 100%;
    max-width: 120px;
    padding: 0.4rem 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    background: var(--color-bg-input, #fff);
}

.confirm-playoff__checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
}

.confirm-playoff__hint {
    display: block;
    font-size: 1rem;
    color: var(--color-text-muted, #888);
    margin-top: 0.25rem;
    margin-left: 1.5rem;
}

.confirm-playoff__actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1rem;
    border-top: 1px solid var(--color-border, #e0e0e0);
    margin-left: -1.25rem;
    margin-right: -1.25rem;
    padding: 1rem 1.25rem 0;
}

.confirm-playoff__btn {
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
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
    background: var(--color-surface-hover);
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

