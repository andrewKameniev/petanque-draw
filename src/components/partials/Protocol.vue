<template>
    <div class="container protocol-container">
        <div class="protocol-gate" v-if="password !== 499">
            <div class="protocol-gate__card">
                <div class="protocol-gate__badge">
                    <Star :size="14"/>
                    Платна опція
                </div>
                <p class="protocol-gate__desc">Ви отримуєте на 80% готовий протокол. Треба дописати тільки тренерів команд і трохи відформатувати текстовий документ.</p>
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
                <div class="protocol-gate__tips">
                    <div class="protocol-gate__tip">
                        <Info :size="16"/>
                        Ввести арбітрів можна тут же, або вже коли експортуєте у текстовий формат
                    </div>
                    <div class="protocol-gate__tip">
                        <Info :size="16"/>
                        Кнопка "Скопіювати протокол" і відредагувати у текстовому редакторі — найкращий варіант
                    </div>
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
                <span>Протокол не є гарантовано вірним, може бути некоректна чи не вся інформація на порталі, може бути специфічний регламент, може не бути всіх даних по гравцям. Перевіряйте вручну, будь ласка!</span>
            </div>
            <div id="protocol" class="mb-3" >
                <h2 class="text-center is-size-3 mb-2">
                    Підсумковий протокол <br>
                    {{ tournament.name }}
                </h2>
                <table class="table is-bordered">
                    <tbody>
                    <tr>
                        <td>Дата початку змагань</td>
                        <td contenteditable="true">{{ formatDateToHumanReadable(tournament.date) || '-' }}</td>
                    </tr>
                    <tr>
                        <td>Дата закінчення змагань</td>
                        <td contenteditable="true">{{ formatDateToHumanReadable(tournament.date) || '-' }}</td>
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
                        <td contenteditable="true">{{ arbitr }}</td>
                    </tr>
                    <tr>
                        <td>Загальна кількість гравців</td>
                        <td>{{ playersCount }}</td>
                    </tr>
                    </tbody>
                </table>
                <br>
                <h3 class="text-center is-size-4 mb-2">Учасники та результати</h3>
                <table class="table is-bordered">
                    <thead>
                    <tr class="has-text-centered">
                        <th>№ <span style="white-space: nowrap">з/п</span></th>
                        <th>ПІП</th>
                        <th>Регіон</th>
                        <th>Тренер(и)</th>
                        <th>Спортивний розряд/звання</th>
                        <th>Місце після відбіркових ігор </th>
                        <th>Загальне підсумкове місце</th>
                    </tr>
                    </thead>
                    <tbody>
                    <template v-for="(team, index) in tournament.system === 'swiss' ? rankingTeams : getAllTeams(rankingTeams)" :key="index">
                        <tr>
                            <td :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1" class="has-text-centered">{{ index + 1 }} </td>
                            <td class="has-text-weight-bold" :colspan="team.players?.length > 1 ? 2 : 1" contenteditable="true">
                                <span v-if="team.players?.length > 1">{{ protocolTitles[team.title] }}</span>
                                <span v-else-if="team.players">{{ formatName(team.players[0].surname) + ' ' + formatName(team.players[0].name) + ' ' + (team.players[0].second_name ? team.players[0].second_name : getPlayerThirdName(team.players[0].surname, team.players[0].name)) }}</span>
                            </td>
                            <td v-if="team.players?.length === 1">{{ regions[team.players[0].club_id] || '-' }}</td>
                            <td contenteditable="true" :rowspan="team.players?.length > 1 ? team.players.length + 1 : 1"></td>
                            <td contenteditable="true">{{team.players?.length === 1 && team.players[0].sport_title === 'candidate' ? 'КМСУ' : ''}}</td>
                            <td class="has-text-centered" :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1">
                                {{tournament.system === 'swiss' ? index + 1 : getTeamPlaceInGroups(team.place, rankingTeams.length)}}
                            </td>
                            <td class="has-text-centered" :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1">
                                {{tournamentRanking.find(item => item.title === team.title).place}}
                            </td>
                        </tr>
                        <template v-if="team.players?.length > 1">
                            <tr v-for="(player, playerIndex) in team.players" :key="playerIndex">
                                <td contenteditable="true"><span class="is-capitalized">{{ formatName(player.surname) + ' ' + formatName(player.name) + ' ' + (player.second_name ? player.second_name.toLowerCase() : getPlayerThirdName(player.surname, player.name)) }}</span> </td>
                                <td>{{ regions[player.club_id] || '-' }} </td>
                                <td contenteditable="true">{{player.sport_title === 'candidate' ? 'КМСУ' : ''}}</td>
                            </tr>
                        </template>
                    </template>
                    </tbody>
                </table>
                <br>
                <h3 class="text-center is-size-4 mb-2">Результати кожного раунду</h3>
                <Results :only-qualifying="true" :is-for-protocol="true" :team-titles="protocolTitles"/>
                <br>
                <h3 class="text-center is-size-4 mb-2">Результати відбіркових ігор
                    <span class="is-size-5">({{tournament.system === 'swiss' ? 'швейцарська' : 'кругова'}} система ({{ tournament.games.length }} раундів))</span>
                </h3>
                <Ranking :tournament="tournament" :rankingTeams="rankingTeams" :is-for-protocol="true" :team-titles="protocolTitles"/>
                <br>
                <div v-if="tournament.playOff?.length">
                    <div class="mt-3 mb-3 has-text-centered">{{ tournament.playOff.length * 2 }} кращих команд змагалися за чемпіонство по олімпійській системі</div>
                    <h3 class="text-center is-size-4 mb-2">Результати ігор на виліт</h3>
                    <Results :is-for-protocol="true" :only-play-off="true" :team-titles="protocolTitles"/>
                </div>
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
                    <a href="https://docs.google.com/spreadsheets/d/1yXDjYCX3nISBCt8-S-vmvIU31rb4SmhtRsWc8PbQy7Q/edit?usp=sharing" target="_blank" class="protocol-actions__btn protocol-actions__btn--outline">
                        <ExternalLink :size="16"/> Список суддів ФПУ
                    </a>
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

import Results from "@/components/partials/Results";
import {getTournamentRanking, regions} from "@/helpers";
import Ranking from "@/components/partials/Ranking";
import html2pdf from "html2pdf.js";
import playersNames from '../../data.json'
import {mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {Star, Copy, Check, Info, AlertTriangle, Plus, ExternalLink, FileDown} from "lucide-vue-next";

export default {
    name: 'Protocol',
    components: {Ranking, Results, Star, Copy, Check, Info, AlertTriangle, Plus, ExternalLink, FileDown},
    props: ['tournament', 'rankingTeams'],
    data() {
        return {
            password: null,
            cardCopied: false,
            regions,
            titleCounts: {},
            mixedTeamCount: 1,
            noRegionTeamCount: 1,
            protocolTitles: {},
            arbitr: '',
            arbitres: [

            ]
        }
    },
    mounted() {
        if (this.tournament.system === 'groups') {
            this.rankingTeams.forEach(group => {
                group.forEach(team => {
                    this.setTeamTitle(team.title, team.players)
                })
            })
        } else {
            this.rankingTeams.forEach(team => {
                this.setTeamTitle(team.title, team.players)
            })
        }
    },
    computed: {
        playersCount() {
            let playersCount = 0;
            this.tournament.teams.forEach(team => {
                playersCount = playersCount + team.players.length;
            })
            return playersCount
        },
        tournamentRanking() {
            return getTournamentRanking(this.tournament, this.rankingTeams)
        },
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
        copyCard() {
            navigator.clipboard.writeText('5353542324470856');
            this.cardCopied = true;
            this.showMessage({title: 'Скопійовано', text: 'Номер картки скопійовано'});
            setTimeout(() => { this.cardCopied = false; }, 2000);
        },
        getAllTeams(groups) {
            let allTeams = [];
            groups.forEach(group => {
                group.map((team, index) => {
                    team.place = index + 1
                });
                allTeams = [...allTeams, ...group];
            });
            return allTeams;
        },
        getTeamPlaceInGroups(place, groupsLength) {
            if (+place === 1) {
                return '1-' + (Number(place) + (groupsLength - 1))
            } else {
                return (+place * groupsLength - 1) + '-' + (Number(place) * groupsLength)
            }

        },
        formatDateToHumanReadable(dateString) {
            const date = new Date(dateString);

            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            const formatter = new Intl.DateTimeFormat('uk-UA', options); // 'uk-UA' for Ukrainian locale

            const formattedParts = formatter.formatToParts(date);

            const day = formattedParts.find(part => part.type === 'day').value;
            const month = formattedParts.find(part => part.type === 'month').value;
            const year = formattedParts.find(part => part.type === 'year').value;

            return `${day} ${month} ${year} року`;
        },
        addArbitr() {
            this.arbitres.push({
                name: ''
            })
        },
        formatName(name) {
            return name.substring(0,1).toUpperCase() + name.substring(1, name.length).toLowerCase()
        },
        getPlayerThirdName(surname, name) {
            const playerInfo = playersNames.find(item => item.includes(surname.toUpperCase() + ' ' + name.toUpperCase()));
            if (playerInfo) {
                const playerInfoArray = playerInfo.split(' ');
                if (playerInfoArray.length === 3) {
                    return this.formatName(playerInfoArray[2]);
                } else {
                    return '!!! ДОПИШІТЬ МЕНЕ!!!'
                }
            } else {
                return '!!! ДОПИШІТЬ МЕНЕ!!!'
            }
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
                    this.showMessage({title: this.$t('messages.error'), text: this.$t('messages.cantCopyProtocol'), type: 'error' });
                }
            } catch (err) {
                console.error("Error copying to clipboard:", err);
            }

            selection.removeAllRanges();
        },
        exportPdf() {
            html2pdf(document.getElementById("protocol"), {
                margin: 1,
                filename: "generated-pdf.pdf",
            });
        },
        setTeamTitle(team, players) {
            let title = '';
            if (players?.length > 1) {
                const firstPlayerClubName = this.regions[players[0].club_id];
                if (firstPlayerClubName){
                    if (players.every(player => this.regions[player.club_id] === firstPlayerClubName)) {
                        title = `Команда ${firstPlayerClubName.replace(/ка$/, 'кої')} області`;
                        if (this.titleCounts[title]) {
                            this.titleCounts[title]++;
                        } else {
                            this.titleCounts[title] = 1;
                        }
                        title += ` ${this.titleCounts[title]}`;
                    } else {
                        title = `Збірна команда ${this.mixedTeamCount}`;
                        this.mixedTeamCount++;
                    }
                } else {
                    title = `Команда без регіону ${this.noRegionTeamCount}`;
                    this.noRegionTeamCount++
                }
            } else {
                title = team
            }
            this.protocolTitles[team] = title
        }
    }
}
</script>

<style>
.protocol-container {
    background: var(--color-surface);
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 1rem;
}

.protocol-gate {
    margin-bottom: 1.5rem;
}

.protocol-gate__card {
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    background: var(--color-bg-input);
}

.protocol-gate__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.7rem;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--color-warning);
    color: var(--color-btn-text);
    border-radius: 4px;
    margin-bottom: 0.75rem;
}

.protocol-gate__desc {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin-bottom: 1rem;
}

.protocol-gate__payment {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.protocol-gate__price {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text);
}

.protocol-gate__card-number {
    font-size: 0.9rem;
    font-weight: 600;
    font-family: monospace;
    background: var(--color-white);
    border: 1px solid var(--color-border);
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    color: var(--color-text);
}

.protocol-gate__copy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
}

.protocol-gate__copy:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary);
}

.protocol-gate__contact {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-bottom: 1rem;
}

.protocol-gate__contact strong {
    color: var(--color-text-secondary);
}

.protocol-gate__tips {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    border-top: 1px solid var(--color-border);
    padding-top: 0.75rem;
}

.protocol-gate__tip {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    font-size: 0.78rem;
    color: var(--color-text-muted);
    line-height: 1.4;
}

.protocol-gate__tip svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--color-primary);
}

.protocol-gate__password {
    margin-top: 1rem;
    max-width: 240px;
}

.protocol-gate__label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.3rem;
}

.protocol-gate__input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-white);
    outline: none;
    transition: border-color 0.2s;
}

.protocol-gate__input:focus {
    border-color: var(--color-primary);
}

.protocol-warning {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--color-warning-border);
    background: var(--color-warning-bg);
    color: var(--color-warning-text);
    font-size: 0.82rem;
    line-height: 1.5;
    margin-bottom: 1.25rem;
}

.protocol-warning svg {
    flex-shrink: 0;
    margin-top: 2px;
}

.protocol-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
}

.protocol-actions__row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.protocol-actions__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.9rem;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s;
    text-decoration: none;
}

.protocol-actions__btn--primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-btn-text);
}

.protocol-actions__btn--primary:hover {
    background: var(--color-primary-light);
    border-color: var(--color-primary-light);
}

.protocol-actions__btn--success {
    background: var(--color-success);
    border-color: var(--color-success);
    color: var(--color-btn-text);
}

.protocol-actions__btn--success:hover {
    background: var(--color-success-hover);
    border-color: var(--color-success-hover);
}

.protocol-actions__btn--outline {
    background: transparent;
    border-color: var(--color-border);
    color: var(--color-text-secondary);
}

.protocol-actions__btn--outline:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-bg);
}

#protocol {
    color: var(--color-text);
    font-family: 'Times New Roman';
}

#protocol h2, #protocol h3 {
    font-weight: bold;
}

#protocol .content h3,
#protocol .content h4,
#protocol table th,
#protocol table td {
    color: var(--color-text);
}

#protocol table td {
    padding: 0.2em 0.3em;
}
</style>
