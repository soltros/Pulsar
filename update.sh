#!/bin/bash
set -e

echo "Updating Pulsar to the latest release..."

# Pull the latest changes from the repository
git pull origin main

echo "Pulling the latest pre-built Docker image and restarting..."
docker-compose pull
docker-compose up -d

echo "Update complete! Pulsar is now running."
