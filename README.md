# node-ttspico-server

A simple Node.js server to serve audio from ttspico.

## Usage

- Install the apt package with: `sudo apt-get install libttspico-utils`
- Fill a `tokens` file with your access tokens (one per line)
- Create a `.env` file from `.env.example` (`cp .env.example .env && nano .env`) and fill the app port and the app ratelimit for those who dont have a token (-1 for no access)
- Start the app with `npm start`

## License

MIT License
Copyright (c) 2020 Gauthier THOMAS