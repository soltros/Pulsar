#!/bin/bash
set -e

echo "Updating Pulsar to the latest release..."

# Pull the latest changes from the repository
git pull origin main

echo "Rebuilding and restarting Docker containers..."
# Rebuild the container and restart in detached mode
docker-compose up --build -d

echo "Update complete! Pulsar is now running."
