import { getGameLaneNumber } from '@/services/lanes';

export function getGameStreams(game, tournament, gameIndex) {
  const streams = [];
  const seen = new Set();

  if (game.stream_url) {
    streams.push(game.stream_url);
    seen.add(game.stream_url);
  }

  const presets = tournament.streamPresets;
  if (!presets) return streams;

  if (presets.teams) {
    const teamUrls = [...(presets.teams[game.team_1] || []), ...(presets.teams[game.team_2] || [])];
    for (const url of teamUrls) {
      if (url && !seen.has(url)) {
        streams.push(url);
        seen.add(url);
      }
    }
  }

  if (presets.lanes) {
    const lane = String(getGameLaneNumber(game, tournament, gameIndex));
    const laneUrls = presets.lanes[lane] || [];
    for (const url of laneUrls) {
      if (url && !seen.has(url)) {
        streams.push(url);
        seen.add(url);
      }
    }
  }

  return streams;
}

export function getStreamPlatform(url) {
  if (!url) return 'default';
  const lower = url.toLowerCase();
  if (lower.includes('youtube') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('twitch')) return 'twitch';
  if (lower.includes('facebook') || lower.includes('fb.')) return 'facebook';
  if (lower.includes('instagram')) return 'instagram';
  return 'default';
}

export function getStreamIconComponent(url) {
  const platform = getStreamPlatform(url);
  if (platform === 'youtube') return 'YoutubeIcon';
  if (platform === 'twitch') return 'Twitch';
  if (platform === 'facebook') return 'Facebook';
  if (platform === 'instagram') return 'Instagram';
  return 'Video';
}

export function getStreamIconClass(url) {
  return `stream-icon--${getStreamPlatform(url)}`;
}
