# Blockchain-based Judicial Platform

This project is a blockchain-based judicial platform.

## Requirements

To use this project, you need to install the following:

* Git for Windows from this URL: https://gitforwindows.org/. Verify that Git is installed by typing the following command in the command prompt:

```
git --version
```

* Curl: It comes pre-installed with Windows. To verify that Curl is installed, run the following command:

```
curl --version
```

If Curl is not installed, use the following command to install it:

```
sudo apt install curl
```

* Jq:

```
sudo apt install jq
```

Verify that it's installed by running this command:

```
jq --version
```

* Linux in WSL: Install Ubuntu and create a user from this URL: https://learn.microsoft.com/en-us/windows/wsl/install.

* After that, install nvm nodejs, npm:
```
sudo apt update

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash

source ~/.bashrc
nvm install 18.18.2

sudo apt install npm

```

* To avoid Windows and Linux file format do this 
```
sudo apt-get install dos2unix
find . -type f -exec dos2unix {} \;

```

* Docker: Download the installer from this URL and install it: https://docs.docker.com/desktop/install/windows-install. Verify that Docker is installed by running the following command:

```
docker --version
```

## Installation

To install this project, follow these steps:

1. Create a new folder and clone this repo inside the folder using this command:

```
git clone https://github.com/Aqsh101/hyperledger.git
```

2. Open Docker Desktop app to run Docker engine.

3. Open WSL terminal and navigate to the project folder and run:

```
docker -v
```

To verify that Docker is running, then to install Docker image and binary files, run this command:

```
./install-fabric.sh
```

## Quick Start

To run the network, follow these steps:

1. Go to the `run.sh` file and edit `{{PATH}}` with your path to `test-network`.

2. Run the script in WSL like this:

```
./run.sh
```

This script will run the network, deploy the chaincode, and start the REST APIs at `localhost:3000`.

You will need to obtain the API keys from `.env` in `rest-api-application` to interact with the APIs.

## Postman collection URL:

`https://api.postman.com/collections/18149894-8bf69ed9-5be6-4d62-bfb9-4b337976e654?access_key=PMAT-01HEZPVFRP750FC61F93X5ZED5`


## Sources

1. Git for Windows: https://gitforwindows.org/
2. Install WSL: https://learn.microsoft.com/en-us/windows/wsl/install
3. Install Docker Desktop on Windows: https://docs.docker.com/desktop/install/windows-install
4. Hyperledger Documentation: https://hyperledger-fabric.readthedocs.io/en/latest/tutorials.html
