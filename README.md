# Architecturing Internet Bank Service Infrastructure

## Overview
This repository facilitates development with MySQL server operations conducted individually on PCs without the need for separate server connections.

## Table of Contents
- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Repository Structure](#repository-structure)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction
The server operates as an HTTPS (443) web server based on certification from a public web authentication certificate issuing authority. This setup aims to streamline development and server operations for internet banking services.

## Getting Started
To get started with this repository, clone it to your local machine and ensure you have the necessary dependencies installed.

### Prerequisites
- Git
- Docker
- Docker Compose

### Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/Macer-Park/-Architecturing-Internet-Bank-Service-Infrastructure.git
    ```
2. Navigate to the project directory:
    ```bash
    cd -Architecturing-Internet-Bank-Service-Infrastructure
    ```
3. Build and start the Docker containers:
    ```bash
    docker-compose up --build
    ```

## Repository Structure
The repository is organized as follows:
- `/docker-compose.yml`: Docker Compose configuration file for setting up the environment.
- `/frontend`: Frontend application code.
- `/backend`: Backend application code.
- `/mysql`: MySQL database setup scripts and configurations.

## Usage
### Webhooks
Upon GitHub repository commits, a webhook (5000/TCP) signals a successful POST with a status 200.

### EC2 Instance
- The EC2 instance (www.team4isbest.chungyun.net) receives 5000 POSTs to its FrontEnd and BackEnd containers.
- Executes designated shell scripts, automatically performs a git pull, and reloads the server.

### Container Communication
- When the BackEnd's webhook receives a 200 POST externally, communication between the BackEnd and FrontEnd occurs via the Host Network (5001/TCP). The FrontEnd behaves similarly.

### Deployment
To deploy a CloudFormation template, use the AWS CLI as follows:
```bash
aws cloudformation create-stack --stack-name my-stack --template-body file://path/to/template.yaml
```

### Contributing
Contributions are welcome! If you have any improvements or additional resources to share, please follow these steps:

1. Fork the repository.
2. Create a new branch:
```bash
git checkout -b feature/new-feature
```

3. Make your changes.
4. Commit your changes:
```bash
git commit -m 'Add new feature'
```
5. Push to the branch:
```bash
git push origin feature/new-feature
```
6. Open a pull request.

### License
This project is licensed under the MIT License. See the LICENSE file for details.
