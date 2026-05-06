<template>
    <div class="container">
        <div class="mb-5" v-if="password !== 499">
            <div class="mb-3">
                <div class="notification is-warning">300 грн на карту <strong>5353 5423 2447 0856</strong> і пишете в телеграм <strong>@andrewkamenev</strong>. Якщо терміново, то дзвоните мені <strong>+38-095-180-44-18</strong>, але не факт, що так буде швидше:)</div>
                <label for="protocolPassword">Пароль</label>
                <input class="input" id="protocolPassword" type="number" v-model="password">
            </div>
            <div class="notification is-warning is-size-4 has-text-grey-darker">Це вже платна опція. Ви отримуєте на 80% готовий протокол. Треба дописати тільки тренерів команд і трохи відформатувати текстовий документ. Ввести арбітрів можна тут же, або вже коли експортуєте у текстовий формат. </div>
            <div class="notification is-warning is-size-4 has-text-grey-darker">Кнопка "Скопіювати протокол" і відредагувати у текстовому редакторі - найкращий варіант, як показала практика</div>
        </div>
        <div v-else>
            <div class="notification is-warning">Протокол не є гарантовано вірним, може бути некоректна чи не вся інформація на порталі, может бути специфічний регламент, може не бути всіх даних по гравцям... Перевіряйте вручну, будь ласка!</div>
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
            <div class="field is-grouped">
                <div class="control">
                    <button class="button is-success" @click="addArbitr">Додати суддю</button>
                </div>
                <div class="control">
                    <a href="https://docs.google.com/spreadsheets/d/1yXDjYCX3nISBCt8-S-vmvIU31rb4SmhtRsWc8PbQy7Q/edit?usp=sharing" target="_blank" class="button is-warning">Список суддів ФПУ</a>
                </div>
            </div>
            <div class="field is-grouped">
                <div class="control">
                    <button class="button is-info" @click="$emit('close')">{{ $t('common.close') }}</button>
                </div>
                <div class="control">
                    <button class="button is-info" @click="exportPdf">{{ $t('teams.exportPdf') }}</button>
                </div>
                <div class="control">
                    <button class="button is-info" @click="copyProtocol">{{ $t('teams.copyProtocol') }}</button>
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
import {mapMutations} from "vuex";

export default {
    name: 'Protocol',
    components: {Ranking, Results},
    props: ['tournament', 'rankingTeams'],
    data() {
        return {
            password: null,
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
        ...mapMutations(['showMessage']),
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
#protocol {
    color: #000;
    font-family: 'Times New Roman';
}

#protocol h2, #protocol h3 {
    font-weight: bold;
}

#protocol .content h3,
#protocol .content h4,
#protocol table th,
#protocol table td {
    color: #000;
}

#protocol table td {
    padding: 0.2em 0.3em;
}
</style>
