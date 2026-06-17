# E2E Testing Helpers

## Quick Score Fill Script

Paste in browser console to instantly fill all scores in the current round (team always wins 13, opponent gets 0-12):

```javascript
document.querySelectorAll('input[id^="team_"]').forEach((teamInput) => {
  teamInput.value = 13;
  teamInput.dispatchEvent(new Event('input', { bubbles: true }));
  teamInput.dispatchEvent(new Event('change', { bubbles: true }));
});

document.querySelectorAll('input[id^="opponent_"]').forEach((opponentInput) => {
  opponentInput.value = Math.floor(Math.random() * 13); // 0-12
  opponentInput.dispatchEvent(new Event('input', { bubbles: true }));
  opponentInput.dispatchEvent(new Event('change', { bubbles: true }));
});
```

## Portal Import IDs

Use these IDs in the "Import from portal" input to quickly populate teams:

| ID  | Teams | Format      |
| --- | ----- | ----------- |
| 474 | 48    | —           |
| 23  | 32    | Triples     |
| 717 | 16    | Doubles     |
| 508 | 41    | Tete-a-tete |
