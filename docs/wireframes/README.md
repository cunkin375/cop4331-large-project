# Wireframes

Figma file (web and mobile): https://www.figma.com/design/2JQh5f1EXxHBaZFmocuyLh

The file has two sections: **Web (1280×800)** and **Mobile (390×844)**. Each section has the same 10 screens in the order a player goes through them. The PNG exports below come from those frames. The mobile frames are the reference for the Flutter app.

| # | Screen | Web | Mobile |
| --- | --- | --- | --- |
| 01 | Login (username or email) | [web](web/01-login.png) | [mobile](mobile/01-login.png) |
| 02 | Register | [web](web/02-register.png) | [mobile](mobile/02-register.png) |
| 03 | Check your email (after registering) | [web](web/03-check-your-email.png) | [mobile](mobile/03-check-your-email.png) |
| 04 | Verify email (link from the email) | [web](web/04-verify-email.png) | [mobile](mobile/04-verify-email.png) |
| 05 | Forgot password | [web](web/05-forgot-password.png) | [mobile](mobile/05-forgot-password.png) |
| 06 | Reset password (link from the email) | [web](web/06-reset-password.png) | [mobile](mobile/06-reset-password.png) |
| 07 | Game: before the deal | [web](web/07-game-start.png) | [mobile](mobile/07-game-start.png) |
| 08 | Game: your turn (hole card face down, Hit/Stand) | [web](web/08-game-your-turn.png) | [mobile](mobile/08-game-your-turn.png) |
| 09 | Game: round result | [web](web/09-game-round-result.png) | [mobile](mobile/09-game-round-result.png) |
| 10 | Leaderboard with player search | [web](web/10-leaderboard.png) | [mobile](mobile/10-leaderboard.png) |

## Screen flow

Login → Play (07 → 08 → 09 → next round) → Leaderboard. New users go Register → Check your email → Verify email → Login. Forgot password → reset email → Reset password → Login.

## Notes

- Colors: felt green `#255d36`, text `#e6e6e6`, primary buttons gold `#f2c14e`, errors `#ffd2cc`. The same tokens are in `frontend/src/index.css`.
- Text in the frames uses Inter. The web app uses the device's system font.
- The sample usernames, scores and cards are placeholder data.
