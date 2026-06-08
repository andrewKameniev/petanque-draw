<template>
    <div class="container protocol-container">
        <div class="protocol-gate" v-if="password !== 499">
            <div class="protocol-gate__card">
                <div class="protocol-gate__badge">
                    <Star :size="14"/>
                    Платна опція
                </div>
                <p class="protocol-gate__desc">Ви отримуєте на 80% готовий протокол. Треба дописати тільки тренерів та трохи відформатувати текстовий документ.</p>
                <div class="protocol-gate__payment">
                    <span class="protocol-gate__price">300 грн</span>
                    <span class="protocol-gate__card-number">5353 5423 2447 0856</span>
                    <button class="protocol-gate__copy" @click="copyCard" :title="cardCopied ? 'Скопійовано!' : 'Скопіювати'">
                        <Copy v-if="!cardCopied" :size="18"/>
                        <Check v-else :size="18"/>
                    </button>
                </div>
                <div class="protocol-gate__contact">
                    Після оплати пишіть у Telegram <strong>@andrewkamenev</strong> або дзвоніть <a href="tel:+380951804418"><strong>+38-095-180-44-18</strong></a>
                </div>
            </div>
            <div class="protocol-gate__password">
                <label class="protocol-gate__label" for="protocolPassword">Пароль</label>
                <input class="protocol-gate__input" id="protocolPassword" type="number" v-model="password" placeholder="Введіть пароль">
            </div>
        </div>
        <div v-else>
            <div class="protocol-warning">
                <AlertTriangle :size="18"/>
                <span>Протокол не є гарантовано вірним, може бути некоректна чи не вся інформація на порталі. Перевіряйте вручну, будь ласка!</span>
            </div>
            <div id="protocol" class="mb-3">
                <h2 class="text-center is-size-3 mb-2">
                    Підсумковий протокол <br>
                    {{ tournament.name }}
                </h2>
                <table class="table is-bordered">
                    <tbody>
                    <tr>
                        <td>Дата початку змагань</td>
                        <td contenteditable="true">{{ formatDate(tournament.date) || '-' }}</td>
                    </tr>
                    <tr>
                        <td>Дата закінчення змагань</td>
                        <td contenteditable="true">{{ formatDate(tournament.date) || '-' }}</td>
                    </tr>
                    <tr>
                        <td>Місце/місто проведення</td>
                        <td contenteditable="true"></td>
                    </tr>
                    <tr>
                        <td>Організатор</td>
                        <td contenteditable="true"></td>
                    </tr>
                    <tr>
                        <td>Головний суддя</td>
                        <td contenteditable="true"></td>
                    </tr>
                    <tr>
                        <td>Дисципліна</td>
                        <td>Тир</td>
                    </tr>
                    <tr>
                        <td>Загальна кількість учасників</td>
                        <td>{{ participants.length }}</td>
                    </tr>
                    </tbody>
                </table>
                <br>
                <h3 class="text-center is-size-4 mb-2">Результати відбіркових змагань</h3>
                <table class="table is-bordered">
                    <thead>
                    <tr class="has-text-centered">
                        <th style="white-space: nowrap">№ з/п</th>
                        <th>ПІП</th>
                        <th>Місто/Регіон</th>
                        <th>Тренер(и)</th>
                        <th>Спортивний розряд/звання</th>
                        <th>Рахунок R1</th>
                        <th v-if="isTwoRound">Рахунок R2</th>
                        <th v-if="isTwoRound">Сума</th>
                        <th>Підсумкове місце</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(p, index) in rankedParticipants" :key="p.id">
                        <td class="has-text-centered">{{ index + 1 }}</td>
                        <td contenteditable="true">{{ p.name }}</td>
                        <td contenteditable="true">{{ p.city || '' }}</td>
                        <td contenteditable="true"></td>
                        <td contenteditable="true"></td>
                        <td class="has-text-centered">{{ getR1Score(p) }}</td>
                        <td v-if="isTwoRound" class="has-text-centered">{{ hasR2Scores(p) ? getR2Score(p) : '—' }}</td>
                        <td v-if="isTwoRound" class="has-text-centered has-text-weight-bold">{{ hasR2Scores(p) ? getCombined(p) : getR1Score(p) }}</td>
                        <td class="has-text-centered">{{ getPlace(index) }}</td>
                    </tr>
                    </tbody>
                </table>

                <template v-if="playoff">
                    <br>
                    <h3 class="text-center is-size-4 mb-2">Результати ігор на виліт (плей-офф)</h3>
                    <template v-for="(round, rIdx) in playoffRounds" :key="rIdx">
                        <h4 class="is-size-5 mb-1">{{ round.title }}</h4>
                        <table class="table is-bordered mb-3">
                            <thead>
                            <tr class="has-text-centered">
                                <th>Учасник 1</th>
                                <th>Рахунок</th>
                                <th>Учасник 2</th>
                                <th>Рахунок</th>
                                <th>Переможець</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="(match, mIdx) in round.matches" :key="mIdx">
                                <td :class="{'has-text-weight-bold': match.winner === match.player1}">{{ match.player1 || '—' }}</td>
                                <td class="has-text-centered">{{ match.score1 ?? '—' }}</td>
                                <td :class="{'has-text-weight-bold': match.winner === match.player2}">{{ match.player2 || '—' }}</td>
                                <td class="has-text-centered">{{ match.score2 ?? '—' }}</td>
                                <td class="has-text-weight-bold">{{ match.winner || '—' }}</td>
                            </tr>
                            </tbody>
                        </table>
                    </template>
                </template>

                <br>
                <h3 class="text-center is-size-4 mb-2">Судді змагання</h3>
                <table class="table is-bordered">
                    <thead class="has-text-centered">
                    <tr>
                        <th>№ з/п</th>
                        <th>Прізвище, ім'я, по батькові</th>
                        <th>Посада</th>
                        <th>Суддівська категорія</th>
                        <th>№ посвідчення</th>
                        <th>Регіон</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(item, index) in arbitres" :key="index">
                        <td>{{ index + 1 }}</td>
                        <td contenteditable="true">{{ item.name }}</td>
                        <td contenteditable="true"></td>
                        <td contenteditable="true"></td>
                        <td contenteditable="true"></td>
                        <td contenteditable="true"></td>
                    </tr>
                    </tbody>
                </table>
                <div>
                    <table width="100%" class="is-fullwidth">
                        <tbody>
                        <tr>
                            <td>Головний суддя змагань</td>
                            <td class="has-text-centered">___________________ <br> (печатка)</td>
                            <td class="has-text-right" contenteditable="true"></td>
                        </tr>
                        <tr>
                            <td>Суддя</td>
                            <td class="has-text-centered">___________________ <br> (підпис)</td>
                            <td class="has-text-right" contenteditable="true"></td>
                        </tr>
                        <tr>
                            <td>Головний секретар змагань</td>
                            <td class="has-text-centered">___________________ <br> (підпис)</td>
                            <td class="has-text-right" contenteditable="true"></td>
                        </tr>
                        <tr>
                            <td>Президент ГС «Федерація петанку України»</td>
                            <td class="has-text-centered">___________________ <br> (підпис)</td>
                            <td class="has-text-right">Литвин Лілія Миколаївна</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="protocol-actions">
                <div class="protocol-actions__row">
                    <button class="protocol-actions__btn protocol-actions__btn--success" @click="addArbitr">
                        <Plus :size="16"/> Додати суддю
                    </button>
                </div>
                <div class="protocol-actions__row">
                    <button class="protocol-actions__btn protocol-actions__btn--outline" @click="$emit('close')">
                        {{ $t('common.close') }}
                    </button>
                    <button class="protocol-actions__btn protocol-actions__btn--primary" @click="exportPdf">
                        <FileDown :size="16"/> {{ $t('teams.exportPdf') }}
                    </button>
                    <button class="protocol-actions__btn protocol-actions__btn--primary" @click="copyProtocol">
                        <Copy :size="16"/> {{ $t('teams.copyProtocol') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {getScoreTotal, getScoreCarreauCount, getScoreReussiCount, rankWithTiebreakers, getCombinedTotal} from '@/services/tir';
import {Star, Copy, Check, AlertTriangle, Plus, FileDown} from "lucide-vue-next";

export default {
    name: 'TirProtocol',
    components: {Star, Copy, Check, AlertTriangle, Plus, FileDown},
    props: ['tournament'],
    emits: ['close'],
    data() {
        return {
            password: null,
            cardCopied: false,
            arbitres: []
        }
    },
    computed: {
        participants() {
            return this.tournament.tirParticipants || [];
        },
        tirConfig() {
            return this.tournament.tirConfig || {junior: false, rounds: 1};
        },
        isTwoRound() {
            return this.tirConfig.rounds === 2;
        },
        tiebreakerCount() {
            return this.tournament.tirTiebreakerCount || 0;
        },
        rankedParticipants() {
            let ranked;
            if (this.isTwoRound) {
                ranked = [...this.participants].sort((a, b) =>
                    getCombinedTotal(b) - getCombinedTotal(a) ||
                    (getScoreCarreauCount(b, 'scores') + getScoreCarreauCount(b, 'scores2')) -
                    (getScoreCarreauCount(a, 'scores') + getScoreCarreauCount(a, 'scores2'))
                );
            } else {
                ranked = rankWithTiebreakers(this.participants, 'scores', this.tiebreakerCount);
            }
            if (!this.playoff) return ranked;
            const places = this.playoffPlaces;
            return [...ranked].sort((a, b) => {
                const pa = this._placeNum(places[a.name]);
                const pb = this._placeNum(places[b.name]);
                return pa - pb;
            });
        },
        playoff() {
            return this.tournament.tirPlayoff;
        },
        playoffPlaces() {
            const places = {};
            if (!this.playoff) return places;
            const final = this.playoff.final;
            const thirdPlace = this.playoff.thirdPlace;
            if (final?.winner) {
                places[final.winner] = 1;
                const loser = final.player1 === final.winner ? final.player2 : final.player1;
                if (loser) places[loser] = 2;
            }
            if (thirdPlace?.winner) {
                places[thirdPlace.winner] = 3;
                const loser = thirdPlace.player1 === thirdPlace.winner ? thirdPlace.player2 : thirdPlace.player1;
                if (loser) places[loser] = 4;
            } else if (thirdPlace && !thirdPlace.winner) {
                if (thirdPlace.player1) places[thirdPlace.player1] = '3-4';
                if (thirdPlace.player2) places[thirdPlace.player2] = '3-4';
            }
            if (this.playoff.rounds) {
                let nextPlace = 5;
                for (let i = this.playoff.rounds.length - 1; i >= 0; i--) {
                    const roundLosers = this.playoff.rounds[i].matches
                        .filter(m => m.loser && !places[m.loser])
                        .map(m => m.loser);
                    if (!roundLosers.length) continue;
                    const endPlace = nextPlace + roundLosers.length - 1;
                    const label = roundLosers.length > 1 ? `${nextPlace}-${endPlace}` : String(nextPlace);
                    roundLosers.forEach(name => { places[name] = label; });
                    nextPlace = endPlace + 1;
                }
            }
            return places;
        },
        playoffRounds() {
            if (!this.playoff) return [];
            const rounds = [];
            if (this.playoff.rounds?.length) {
                this.playoff.rounds.forEach(round => {
                    const count = round.matches.length;
                    let title = 'Раунд';
                    if (count === 4) title = 'Чвертьфінал';
                    else if (count === 2) title = 'Півфінал';
                    else if (count === 8) title = '1/8 фіналу';
                    rounds.push({title, matches: round.matches});
                });
            }
            if (this.playoff.thirdPlace) {
                rounds.push({title: 'Матч за 3-тє місце', matches: [this.playoff.thirdPlace]});
            }
            if (this.playoff.final) {
                rounds.push({title: 'Фінал', matches: [this.playoff.final]});
            }
            return rounds;
        }
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
        getR1Score(p) {
            return getScoreTotal(p, 'scores');
        },
        getR2Score(p) {
            return getScoreTotal(p, 'scores2');
        },
        hasR2Scores(p) {
            return p.scores2 && Object.keys(p.scores2).length > 0;
        },
        getCombined(p) {
            return getCombinedTotal(p);
        },
        _placeNum(place) {
            if (place === undefined) return 9999;
            if (typeof place === 'number') return place;
            return parseInt(String(place).split('-')[0]) || 9999;
        },
        getPlace(index) {
            const name = this.rankedParticipants[index]?.name;
            if (!this.playoff) return index + 1;
            if (this.playoffPlaces[name] !== undefined) return this.playoffPlaces[name];
            return index + 1;
        },
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const options = {day: 'numeric', month: 'long', year: 'numeric'};
            const formatter = new Intl.DateTimeFormat('uk-UA', options);
            const parts = formatter.formatToParts(date);
            const day = parts.find(p => p.type === 'day')?.value;
            const month = parts.find(p => p.type === 'month')?.value;
            const year = parts.find(p => p.type === 'year')?.value;
            return `${day} ${month} ${year} року`;
        },
        addArbitr() {
            this.arbitres.push({name: ''});
        },
        copyCard() {
            navigator.clipboard.writeText('5353542324470856');
            this.cardCopied = true;
            this.showMessage({title: 'Скопійовано', text: 'Номер картки скопійовано'});
            setTimeout(() => { this.cardCopied = false; }, 2000);
        },
        copyProtocol() {
            const element = document.getElementById("protocol");
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            try {
                const successful = document.execCommand("copy");
                if (successful) {
                    this.showMessage({title: this.$t('messages.success'), text: this.$t('messages.protocolCopied')});
                } else {
                    this.showMessage({title: this.$t('messages.error'), text: this.$t('messages.cantCopyProtocol'), type: 'error'});
                }
            } catch (err) {
                console.error("Error copying to clipboard:", err);
            }
            selection.removeAllRanges();
        },
        async exportPdf() {
            const {default: html2pdf} = await import("html2pdf.js");
            html2pdf(document.getElementById("protocol"), {
                margin: 1,
                filename: `${this.tournament.name}_protocol.pdf`,
            });
        }
    }
}
</script>
