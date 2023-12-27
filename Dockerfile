# Use an official Node.js runtime as a parent image
FROM node:16.6

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle your app source code inside the Docker image
COPY . .

# Expose the port that your app will run on
EXPOSE 3000

# Command to run your application
CMD ["npm", "start"]
