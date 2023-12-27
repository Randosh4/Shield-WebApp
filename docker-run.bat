REM Docker build command
docker build -t shield-app .

REM Docker run command
docker run -p 8000:8000 -d shield-app
