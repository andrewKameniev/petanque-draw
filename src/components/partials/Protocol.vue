<template>
    <div class="container">
        <div id="protocol" class="mb-3">
            <h2 class="text-center is-size-3 mb-2">
                Підсумковий протокол результатів командної першості учасників спортивних змагань з петанку
            </h2>
            <table class="table is-bordered">
                <tr>
                    <td>Назва змагань</td>
                    <td contenteditable="true">{{ tournament.name }}</td>
                </tr>
                <tr>
                    <td>Дата початку змагань</td>
                    <td contenteditable="true">{{ tournament.date || '-' }}</td>
                </tr>
                <tr>
                    <td>Дата закінчення змагань</td>
                    <td contenteditable="true">{{ tournament.date || '-' }}</td>
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
                    <td>Загальна кількість гравців</td>
                    <td>{{ playersCount }}</td>
                </tr>
            </table>
            <h3 class="text-center is-size-4 mb-2">Учасники та результати</h3>
            <table class="table is-bordered">
                <thead>
                    <tr class="has-text-centered">
                        <th>№ <span style="white-space: nowrap">з/п</span></th>
                        <th>ПІП</th>
                        <th>Регіон</th>
                        <th>Тренер</th>
                        <th>Спортивний розряд/звання</th>
                        <th>Місце після відбіркових ігор </th>
                        <th>Загальне підсумкове місце</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="(team, index) in rankingTeams" :key="index">
                        <tr>
                            <td :rowspan="team.players.length > 1 ? team.players.length + 1 : 1" class="has-text-centered">{{ index + 1 }} </td>
                            <td class="has-text-weight-bold" :colspan="team.players.length > 1 ? 2 : 1" contenteditable="true">
                                <span v-if="team.players.length > 1">{{ protocolTitles[team.title] }}</span>
                                <span v-else>{{ team.players[0].surname + ' ' + team.players[0].name + ' ' + getPlayerThirdName(team.players[0].surname, team.players[0].name) }}</span>
                            </td>
                            <td v-if="team.players.length === 1">{{ regions[team.players[0].club_id] || '-' }}</td>
                            <td contenteditable="true" :rowspan="team.players.length > 1 ? team.players.length + 1 : 1"></td>
                            <td contenteditable="true"></td>
                            <td class="has-text-centered" :rowspan="team.players.length > 1 ? team.players.length + 1 : 1">{{index + 1}}</td>
                            <td class="has-text-centered" :rowspan="team.players.length > 1 ? team.players.length + 1 : 1">
                                {{tournamentRanking.find(item => item.title === team.title).place}}
                            </td>
                        </tr>
                        <template v-if="team.players.length > 1">
                            <tr v-for="(player, playerIndex) in team.players" :key="playerIndex">
                                <td contenteditable="true">{{ player.surname + ' ' + player.name + ' ' + getPlayerThirdName(player.surname, player.name) }} </td>
                                <td>{{ regions[player.club_id] || '-' }} </td>
                                <td contenteditable="true"></td>
                            </tr>
                        </template>
                    </template>
                </tbody>
            </table>
            <h3 class="text-center is-size-4 mb-2">Результати кожного раунду</h3>
            <Results :only-qualifying="true" :is-for-protocol="true" :team-titles="protocolTitles"/>
            <h3 class="text-center is-size-4 mb-2">Результати відбіркових ігор
                <span class="is-size-5">(швейцарська система ({{ tournament.games.length }} раундів))</span>
            </h3>
            <Ranking :tournament="tournament" :rankingTeams="rankingTeams" :is-for-protocol="true" :team-titles="protocolTitles"/>
            <div v-if="tournament.playOff?.length">
                <div class="mt-3 mb-3 has-text-centered">{{ tournament.playOff.length * 2 }} кращих команд змагалися за чемпіонство по олімпійській системі</div>
                <h3 class="text-center is-size-4 mb-2">Результати ігор на виліт</h3>
                <Results :is-for-protocol="true" :only-play-off="true" :team-titles="protocolTitles"/>
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
</template>

<script>

import Results from "@/components/partials/Results";
import {getTournamentRanking, regions} from "@/helpers";
import Ranking from "@/components/partials/Ranking";
import html2pdf from "../../../node_modules/html2pdf.js/dist/html2pdf";
import playersNames from '../../data.json'
import {mapMutations} from "vuex";

export default {
    name: 'Protocol',
    components: {Ranking, Results},
    props: ['tournament', 'rankingTeams'],
    data() {
        return {
            regions,
            titleCounts: {},
            mixedTeamCount: 1,
            noRegionTeamCount: 1,
            protocolTitles: {},
        }
    },
    mounted() {
        this.rankingTeams.forEach(team => {
            this.setTeamTitle(team.title, team.players)
        })
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
        getPlayerThirdName(surname, name) {
            const playerInfo = playersNames.find(item => item.includes(surname + ' ' + name));
            if (playerInfo) {
                const playerInfoArray = playerInfo.split(' ');
                if (playerInfoArray.length === 3) {
                    return playerInfoArray[2];
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
                    this.showMessage({title: 'Success!', text: 'Protocol is in your buffer'});
                } else {
                    this.showMessage({title: 'Error!', text: 'Can\'t copy protocol', type: 'error' });
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
            if (players.length > 1) {
                const firstPlayerClubName = this.regions[players[0].club_id];
                if (firstPlayerClubName){
                    if (players.every(player => this.regions[player.club_id] === firstPlayerClubName)) {
                        title = `Збірна ${firstPlayerClubName.replace(/ка$/, 'кої')} області`;
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
