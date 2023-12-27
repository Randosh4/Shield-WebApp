cd test-network &&
./network.sh down &&
./network.sh up createChannel &&
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript -ccl typescript &&
cd ../asset-transfer-basic/rest-api-typescript &&
npm run clean &&
npm i &&
npm run generateEnv &&
npm run build &&
(npm run start:redis ||
npm run start:dev)