pipeline {
    agent {
        node {
            label 'oneagent-linux-x86-node'
        }
    }
    triggers {
        pollSCM 'H/15 * * * *'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 1, unit: 'HOURS')
        timestamps()
    }

    stages {
        stage('checkout') {
            steps {
                checkout scm
            }
        }
        stage('dependencyInstall') {
            steps {
                sh 'yarn install'
            }
        }
        stage('lint') {
            steps {
                sh 'yarn lint'
            }
        }
        stage('test') {
            steps {
                sh 'yarn test'
            }
        }
        stage('build') {
            steps {
                sh 'yarn build'
            }
        }
    }
}