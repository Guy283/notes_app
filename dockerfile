# Use a small Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only package files first (layer optimization)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port your app listens on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
