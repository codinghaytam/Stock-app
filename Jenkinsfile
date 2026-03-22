pipeline {
    agent any
    environment {
        DOCKERHUB_CREDENTIALS = credentials('DOCKERHUB_CREDENTIALS')
        BACKEND_IMAGE         = 'haytam265684/backend-olive'
        FRONTEND_IMAGE        = 'haytam265684/frontend-olive'
        IMAGE_TAG             = "0.${BUILD_NUMBER}.0"
        VM_USER               = 'ubuntu'
        VM_HOST               = credentials('ORACLE_VM_HOST')
        VM_APP_DIR            = '/opt/stock-app'
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/codinghaytam/Stock-app'
            }
        }
        stage('Docker Login') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
            }
        }
        stage('Build & Push Images') {
            steps {
                sh '''
                    docker buildx create --use --name multibuilder 2>/dev/null || docker buildx use multibuilder

                    docker buildx build \
                        --platform linux/amd64,linux/arm64 \
                        -t $BACKEND_IMAGE:$IMAGE_TAG \
                        -t $BACKEND_IMAGE:latest \
                        --push \
                        ./backend

                    docker buildx build \
                        --platform linux/amd64,linux/arm64 \
                        -t $FRONTEND_IMAGE:$IMAGE_TAG \
                        -t $FRONTEND_IMAGE:latest \
                        --push \
                        ./frontend
                '''
            }
        }
        stage('Deploy') {
            steps {
                sshagent(credentials: ['oracle-vm-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no $VM_USER@$VM_HOST "mkdir -p $VM_APP_DIR/grafana/provisioning/datasources"
                        scp -o StrictHostKeyChecking=no docker-compose.yml         $VM_USER@$VM_HOST:$VM_APP_DIR/
                        scp -o StrictHostKeyChecking=no prometheus.yml             $VM_USER@$VM_HOST:$VM_APP_DIR/
                        scp -o StrictHostKeyChecking=no tempo.yml                  $VM_USER@$VM_HOST:$VM_APP_DIR/
                        scp -o StrictHostKeyChecking=no grafana/provisioning/datasources/* $VM_USER@$VM_HOST:$VM_APP_DIR/grafana/provisioning/datasources/
                        ssh -o StrictHostKeyChecking=no $VM_USER@$VM_HOST "
                            cd $VM_APP_DIR &&
                            docker compose pull &&
                            docker compose down &&
                            docker compose up -d
                        "
                    '''
                }
            }
        }
    }
    post {
        always {
            sh 'docker logout'
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
