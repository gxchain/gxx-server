pm2 stop gxcc
PORT=3000 NODE_ENV=production pm2 start dist/index.js --name gxcc
