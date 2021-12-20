## Vaccito (forked from Doctolib COVID)

This script sends twitter DMs when vaccination appointments are available on Doctolib. Specifically for third Pfizer shot.
Uses curl under the hood to bypass doctolib filtering or whatever...

## Warning

Twitter has a 5 messages / 24 hour rate limit for direct messages. It is necessary for the recipient to respond to reset that limit.
Thus, that script must not be executed too frequently with too permissive parameters in order to stay within twitter's limits.

## Prerequisites
 
- node 16
- npm 8

## Download dependencies

`npm i`

## Execution

- Set the vaccination centers close to your location in `centers` array
- Set the twitter Id of the account that will receive the messages in `twitto`
- Copy `twitcred.template.json` to `twitcred.json` and set your twitter api access in it, read+write+dm permissions are needed.

- Execute command (preferably in powershell)
`node vaccito.js`
