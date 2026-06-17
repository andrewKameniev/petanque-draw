const BRACKET_ORDERS = {
    8: null,
    16: [0, 1, 8, 9, 13, 12, 5, 4, 15, 14, 7, 6, 2, 3, 10, 11],
    32: [
        0, 1, 16, 17, 8, 9, 24, 25, 29, 28, 13, 12, 21, 20, 5, 4, 31, 30, 15, 14, 23, 22, 7, 6, 2, 3, 18, 19, 10, 11,
        26, 27,
    ],
    64: [
        0, 1, 32, 33, 8, 9, 40, 41, 16, 17, 56, 57, 24, 25, 48, 49, 4, 5, 36, 37, 12, 13, 60, 61, 20, 21, 52, 53, 28,
        29, 44, 45, 2, 3, 34, 35, 10, 11, 42, 43, 18, 19, 58, 59, 26, 27, 50, 51, 6, 7, 38, 39, 14, 15, 62, 63, 22, 23,
        54, 55, 30, 31, 46, 47,
    ],
    128: [
        0, 1, 64, 65, 32, 33, 96, 97, 8, 9, 72, 73, 40, 41, 104, 105, 16, 17, 80, 81, 56, 57, 112, 113, 24, 25, 88, 89,
        48, 49, 120, 121, 4, 5, 68, 69, 36, 37, 100, 101, 12, 13, 76, 77, 60, 61, 108, 109, 20, 21, 84, 85, 52, 53, 116,
        117, 28, 29, 92, 93, 44, 45, 124, 125, 2, 3, 66, 67, 34, 35, 98, 99, 10, 11, 74, 75, 42, 43, 106, 107, 18, 19,
        82, 83, 58, 59, 114, 115, 26, 27, 90, 91, 50, 51, 122, 123, 6, 7, 70, 71, 38, 39, 102, 103, 14, 15, 78, 79, 62,
        63, 110, 111, 22, 23, 86, 87, 54, 55, 118, 119, 30, 31, 94, 95, 46, 47, 126, 127,
    ],
};

export function buildPlayOffScheme(playOffList, hasCadrage) {
    let playOffScheme = [];
    const stageValue = playOffList.length / 2;

    for (let i = 0; i < playOffList.length / 2; i++) {
        let game;
        if (i % 2 === 0) {
            const t1 = playOffList[i];
            const t2 = playOffList[playOffList.length - 1 - i];
            game = {
                id: i + 1,
                stage: stageValue,
                team_1: t1.title,
                team_1_place: t1.isBye ? '' : i + 1,
                team_1_score: null,
                team_2: t2.title,
                team_2_place: t2.isBye ? '' : hasCadrage ? '' : playOffList.length - i,
                team_2_score: null,
                isBye: !!(t1.isBye || t2.isBye),
            };
        } else {
            const t1 = playOffList[playOffList.length / 2 - i];
            const t2 = playOffList[playOffList.length / 2 - 1 + i];
            game = {
                id: i + 1,
                stage: stageValue,
                team_1: t1.title,
                team_1_place: t1.isBye ? '' : playOffList.length / 2 + 1 - i,
                team_1_score: null,
                team_2: t2.title,
                team_2_place: t2.isBye ? '' : hasCadrage ? '' : playOffList.length / 2 + i,
                team_2_score: null,
                isBye: !!(t1.isBye || t2.isBye),
            };
        }
        playOffScheme.push(game);
    }

    playOffScheme = reorderBracket(playOffScheme, stageValue);
    return playOffScheme;
}

export function reorderBracket(scheme, stageValue) {
    if (stageValue === 8) {
        [scheme[2], scheme[4]] = [scheme[4], scheme[2]];
        [scheme[3], scheme[5]] = [scheme[5], scheme[3]];
        return scheme;
    }
    const order = BRACKET_ORDERS[stageValue];
    if (order) {
        return order.map((index) => scheme[index]);
    }
    return scheme;
}

export function buildCadrageGames(playOffList, teamToPlayOff) {
    const cadrageGames = [];
    for (let i = 0; i < playOffList.length / 2; i++) {
        cadrageGames.push({
            id: i + 1,
            stage: 'cadrage',
            team_1: playOffList[i].title,
            team_1_place: teamToPlayOff / 2 + i + 1,
            team_1_score: null,
            team_2: playOffList[playOffList.length - 1 - i].title,
            team_2_place: playOffList.length + teamToPlayOff / 2 - i,
            team_2_score: null,
        });
    }
    return cadrageGames;
}
