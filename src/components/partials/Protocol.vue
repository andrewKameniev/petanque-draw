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
                        <th>№ з/п</th>
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
                        <tr v-if="team.players.length > 1">
                            <td v-if="team.players.length > 1" :rowspan="team.players.length + 1">{{ index + 1 }} </td>
                            <td class="has-text-weight-bold" colspan="2">{{ protocolTitles[team.title] }} </td>
                            <td contenteditable="true" :rowspan="team.players.length + 1"></td>
                            <td></td>
                            <td class="has-text-centered" :rowspan="team.players.length + 1">{{index + 1}}</td>
                            <td class="has-text-centered" :rowspan="team.players.length + 1">{{tournamentRanking.find(item => item.title === team.title).place}}</td>
                        </tr>
                        <tr v-for="(player, playerIndex) in team.players" :key="playerIndex">
                            <td contenteditable="true">{{ player.surname + ' ' + player.name + ' ' + getPlayerThirdName(player.surname, player.name) }} </td>
                            <td>{{ regions[player.club_id] || '-' }} </td>
                            <td contenteditable="true"></td>
                        </tr>
                    </template>
                </tbody>
            </table>
            <h3 class="text-center is-size-4 mb-2">Результати кожного раунду</h3>
            <Results :only-qualifying="true" :is-for-protocol="true" :team-titles="protocolTitles"/>
            <h3 class="text-center is-size-4 mb-2">Результати відбіркових ігор
                <span class="is-size-5">(швейцарська система ({{ tournament.games.length }} раундів))</span>
            </h3>
            <Ranking :tournament="tournament" :rankingTeams="rankingTeams" :is-for-protocol="true" :team-titles="protocolTitles"/>
            <div class="mt-3 mb-3 has-text-centered">{{ tournament.playOff.length * 2 }} кращих команд змагалися за чемпіонство по олімпійській системі</div>
            <h3 class="text-center is-size-4 mb-2">Результати ігор на виліт</h3>
            <Results :is-for-protocol="true" :only-play-off="true" :team-titles="protocolTitles"/>
        </div>
        <div class="field is-grouped">
            <div class="control">
                <button class="button is-info" @click="$emit('close')">Close</button>
            </div>
            <div class="control">
                <button class="button is-info" @click="exportPdf">Export to PDF</button>
            </div>
            <div class="control">
                <button class="button is-info" @click="copyProtocol">Copy protocol</button>
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
        if (this.rankingTeams[0].players.length > 1) {
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
            const firstPlayerClubName = this.regions[players[0].club_id];
            let title = '';
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

#protocol table td {
    padding: 0.2em 0.3em;
}
</style>
