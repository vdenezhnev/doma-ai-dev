pipeline {
    agent any
    parameters {
        booleanParam(name: 'DEPLOY', defaultValue: false, description: 'Deploy')
    }
    environment {
        SERVER='172.31.26.199'
        WORK_DIR='/opt/acms'
        API_HOST='https://api.airkey.ae/'
        APP_INTERCOM_TITLE='SmartAirkey'
        APP_BRAND_ID='smartairkey'
    }
    stages {
        stage('Prepare') {
            when {
                expression { params.DEPLOY }
            }
            steps {
                sshagent(credentials : ['infra-key']) {
                    sh 'ssh -o StrictHostKeyChecking=no infrastructure@${SERVER} sudo mkdir -p ${WORK_DIR}'
                    sh 'ssh -o StrictHostKeyChecking=no infrastructure@${SERVER} sudo chown infrastructure.infrastructure ${WORK_DIR}'
                    sh 'ssh -o StrictHostKeyChecking=no infrastructure@${SERVER} sudo rm -rf ${WORK_DIR}/*'
                    sh 'scp -r * infrastructure@${SERVER}:${WORK_DIR}'
                }
            }
        }
        stage('Build image') {
            when {
                expression { params.DEPLOY }
            }
            steps {
                sshagent(credentials : ['infra-key']) {
                    sh 'ssh -o StrictHostKeyChecking=no infrastructure@${SERVER} sudo docker build --no-cache -t smartairkey/acmsuae:late --build-arg API_HOST="${API_HOST}" --build-arg APP_INTERCOM_TITLE="${APP_INTERCOM_TITLE}" --build-arg APP_BRAND_ID="${APP_BRAND_ID}" ${WORK_DIR}'
                }
            }
        }
        stage('Deploy') {
            when {
                expression { params.DEPLOY }
            }
            steps {
                sshagent(credentials : ['infra-key']) {
                    sh 'ssh -o StrictHostKeyChecking=no infrastructure@${SERVER} sudo docker-compose -f ${WORK_DIR}/docker-compose.yml stop acms'
                    sh 'ssh -o StrictHostKeyChecking=no infrastructure@${SERVER} sudo docker-compose -f ${WORK_DIR}/docker-compose.yml rm -f acms'
                    sh 'ssh -o StrictHostKeyChecking=no infrastructure@${SERVER} sudo docker-compose -f ${WORK_DIR}/docker-compose.yml up -d --force-recreate acms'
                    sh 'ssh -o StrictHostKeyChecking=no infrastructure@${SERVER} sudo docker system prune -a -f'
                }
            }
        }
    }
    post {
        cleanup {
            deleteDir()
        }
    }
}
