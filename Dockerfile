# Use an official Node.js runtime as a base image
FROM node:latest

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Oracle Instant Client
RUN apt-get update && apt-get install -y libaio1 wget \
    && mkdir /opt/oracle \
    && cd /opt/oracle \
    && wget https://download.oracle.com/otn_software/linux/instantclient/1912000/instantclient-basic-linux.x64-19.12.0.0.0dbru.zip \
    && unzip instantclient-basic-linux.x64-19.12.0.0.0dbru.zip \
    && rm instantclient-basic-linux.x64-19.12.0.0.0dbru.zip \
    && echo /opt/oracle/instantclient_19_12 > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig

# Set environment variables required by node-oracledb
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_19_12

# Copy the rest of your application code
COPY . .

# Start your Node.js application
CMD [ "npm","run", "start:dev" ]
