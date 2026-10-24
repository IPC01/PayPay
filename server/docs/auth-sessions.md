# Platform sessions

Login and registration issue a session JWT with a fixed lifetime of 30 minutes.
Activity never renews this token or changes its expiry. At the absolute limit,
the API rejects the token and the application requires a new login.

The application also ends a session after 15 minutes without user interaction.
Pointer, keyboard, wheel and touch interactions update a timestamp shared
between tabs for that token. Automatic API refreshes, focus changes and
visibility changes do not count as activity. Reloading or reopening a tab
preserves the previous timestamp; returning after the deadline cannot revive
the session.

On an inactivity logout the application clears the local session immediately
and requests `/api/auth/logout` to revoke the still-valid JWT. Revocation uses
the existing in-memory server blacklist. If the server is unreachable, the
failure is logged and the local session remains closed; the JWT still has its
fixed 30-minute expiry.

Expired sessions are also checked before authenticated API/file requests, so
background timer throttling does not allow a new request to extend an idle
session. Login/logout changes are synchronized between tabs.

Previously issued 15-minute JWTs retain their original expiry. A new login is
required to receive the new 30-minute token.

## Envio de códigos por email

- `EmailService.sendMail` usa timeouts SMTP (`SMTP_CONNECTION_TIMEOUT_MS`, `SMTP_GREETING_TIMEOUT_MS`, `SMTP_SOCKET_TIMEOUT_MS`) e repete até 3 vezes, com backoff, em falhas temporárias (rede ou respostas SMTP 4xx).
- Destinatários rejeitados contam como falha. Todos os envios e falhas ficam registados no log com o email mascarado (`[email] ...`).
- Se o envio falhar, o desafio OTP é descartado e a API responde `503` com `code: EMAIL_SEND_FAILED`.
- Após um reenvio, os códigos anteriores ainda válidos (no máximo 3 ativos por utilizador) continuam a ser aceites. Depois de uma verificação bem-sucedida, todos são invalidados.
