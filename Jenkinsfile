#!groovy

pipeline {
    agent {
        node{
            label 'linux && docker && x86_64'
        }
    }
    options {
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '50', artifactNumToKeepStr: '30'))
    }
    stages {
        stage('Linux-64') {
            agent {
                dockerfile {
                    reuseNode true
                    args '-u root:root'
                }
            }
            stages {
                stage('Build') {
                    steps {
                        sh 'npm ci'
                        sh 'npm run build'
                    }
                }
                stage('Test') {
                    parallel {
                        stage('Unit') {
                            steps {
                                sh 'npm --prefix ui run test'
                            }
                        }
                        stage('Integration') {
                            steps {
                                sh 'npm run test:headless'
                            }
                        }
                        stage('Lint') {
                            steps {
                                sh 'npm run lint'
                            }
                        }
                    }
                }
            }
            post {
                cleanup {
                    cleanWs()
                }
            }
        }
    }
}
