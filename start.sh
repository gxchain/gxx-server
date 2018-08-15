#!/usr/bin/env bash
pm2 stop gxx-server
PORT=3000 NODE_ENV=production pm2 start dist/index.js --name gxx-server
