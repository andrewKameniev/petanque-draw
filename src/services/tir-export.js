import { ATELIER_KEYS, SCORING, getScoreTotal } from './tir';

function getAtelierDetails(participant, scoresKey, distances) {
  const details = {};
  ATELIER_KEYS.forEach((key, atelierIndex) => {
    const scores = participant[scoresKey]?.[atelierIndex];
    if (!scores || typeof scores !== 'object') return;
    details[key] = {};
    distances.forEach((distance) => {
      if (scores[distance]) details[key][`${distance}m`] = SCORING[scores[distance]] ?? 0;
    });
  });
  return details;
}

function toExportMatch(match) {
  return {
    player1: match.player1,
    score1: match.score1,
    player2: match.player2,
    score2: match.score2,
    winner: match.winner || null,
  };
}

export function buildTirExportData({
  tournamentName,
  participants,
  distances,
  isTwoRoundSystem,
  currentRound,
  playoff,
}) {
  const playerRows = participants
    .map((participant) => {
      const row = {
        name: participant.name,
        city: participant.city || '',
        r1_score: getScoreTotal(participant, 'scores'),
        r1_details: getAtelierDetails(participant, 'scores', distances),
      };
      if (isTwoRoundSystem && currentRound >= 2) {
        row.r2_score = getScoreTotal(participant, 'scores2');
        row.r2_details = getAtelierDetails(participant, 'scores2', distances);
        row.combined = row.r1_score + row.r2_score;
      }
      return row;
    })
    .sort((a, b) => (b.combined || b.r1_score) - (a.combined || a.r1_score));

  const result = { tournament: tournamentName, participants: playerRows };
  if (!playoff) return result;

  result.playoff = {};
  playoff.rounds?.forEach((round) => {
    const key = round.matches.length >= 4 ? 'quarterfinal' : round.matches.length === 2 ? 'semifinal' : 'final';
    result.playoff[key] = round.matches.map(toExportMatch);
  });
  if (playoff.thirdPlace) result.playoff.thirdPlace = toExportMatch(playoff.thirdPlace);
  if (playoff.final) result.playoff.final = toExportMatch(playoff.final);
  return result;
}

export function buildTirCsv(data, distances) {
  const lines = [];
  const hasR2 = data.participants.some((participant) => participant.r2_score !== undefined);
  let header = 'Name,City,R1';
  if (hasR2) header += ',R2,Combined';

  if (data.participants[0]?.r1_details) {
    ATELIER_KEYS.forEach((_, atelierIndex) => {
      distances.forEach((distance) => {
        header += `,R1_A${atelierIndex + 1}_${distance}m`;
      });
    });
  }
  if (hasR2) {
    ATELIER_KEYS.forEach((_, atelierIndex) => {
      distances.forEach((distance) => {
        header += `,R2_A${atelierIndex + 1}_${distance}m`;
      });
    });
  }
  lines.push(header);

  data.participants.forEach((participant) => {
    let line = `"${participant.name}","${participant.city}",${participant.r1_score}`;
    if (hasR2) line += `,${participant.r2_score || 0},${participant.combined || participant.r1_score}`;
    ATELIER_KEYS.forEach((key) => {
      distances.forEach((distance) => {
        line += `,${participant.r1_details?.[key]?.[`${distance}m`] || ''}`;
      });
    });
    if (hasR2) {
      ATELIER_KEYS.forEach((key) => {
        distances.forEach((distance) => {
          line += `,${participant.r2_details?.[key]?.[`${distance}m`] || ''}`;
        });
      });
    }
    lines.push(line);
  });

  if (data.playoff) {
    lines.push('', 'Playoff');
    Object.entries(data.playoff).forEach(([round, matches]) => {
      lines.push(round);
      const matchList = Array.isArray(matches) ? matches : [matches];
      matchList.forEach((match) => {
        lines.push(
          `"${match.player1 || ''}",${match.score1 ?? ''},"${match.player2 || ''}",${match.score2 ?? ''},"${match.winner || ''}"`,
        );
      });
    });
  }
  return lines.join('\n');
}

export function downloadTirFile(content, filename, mimeType, browserWindow = window, browserDocument = document) {
  const blob = new browserWindow.Blob([content], { type: mimeType });
  const url = browserWindow.URL.createObjectURL(blob);
  const link = browserDocument.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  browserWindow.URL.revokeObjectURL(url);
}
