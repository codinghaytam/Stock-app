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

        stage('Build Images') {
            steps {
                sh '''
                    docker build -t $BACKEND_IMAGE:$IMAGE_TAG  -t $BACKEND_IMAGE:latest  ./backend
                    docker build -t $FRONTEND_IMAGE:$IMAGE_TAG -t $FRONTEND_IMAGE:latest ./frontend
                '''
            }
        }

        stage('Push Images') {
            steps {
                sh '''
                    docker push $BACKEND_IMAGE:$IMAGE_TAG
                    docker push $BACKEND_IMAGE:latest
                    docker push $FRONTEND_IMAGE:$IMAGE_TAG
                    docker push $FRONTEND_IMAGE:latest
                '''
            }
        }

        stage('Deploy') {
            steps {
                sshagent(credentials: ['oracle-vm-ssh-key']) {
                    sh '''
                        ssh $VM_USER@$VM_HOST "mkdir -p $VM_APP_DIR/grafana/provisioning/datasources"

                        scp docker-compose.yml         $VM_USER@$VM_HOST:$VM_APP_DIR/
                        scp prometheus.yml             $VM_USER@$VM_HOST:$VM_APP_DIR/
                        scp tempo.yml                  $VM_USER@$VM_HOST:$VM_APP_DIR/
                        scp grafana/provisioning/datasources/* $VM_USER@$VM_HOST:$VM_APP_DIR/grafana/provisioning/datasources/

                        ssh $VM_USER@$VM_HOST "
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
