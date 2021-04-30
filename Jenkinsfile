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
    parameters {
        string(description: 'Specify connect-app branch',
            name: 'CONNECT_APP_BRANCH',
            defaultValue: env.BRANCH_NAME == 'main' ? 'main' : 'develop')
        string(description: 'Override installer directory (ex: /aspera/process/test/connect/3.10/archive)',
            name: 'OVERRIDE_INSTALLERS',
            defaultValue: '')
        string(description: 'Override Windows installer directory',
            name: 'OVERRIDE_WIN_INSTALLERS',
            defaultValue: '')
        string(description: 'Override macOS installer directory',
            name: 'OVERRIDE_MAC_INSTALLERS',
            defaultValue: '')
        string(description: 'Override Linux installer directory',
            name: 'OVERRIDE_LINUX_INSTALLERS',
            defaultValue: '')
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
                stage('Prepare') {
                    environment {
                        APPS_PROJECT = "connect-app/${params.CONNECT_APP_BRANCH}"
                        INSTALLER_DIR = 'imports'
                    }
                    steps {
                        copyArtifacts filter: '*x86_64.dmg, *.exe, *.tar.gz', fingerprintArtifacts: true, flatten: true, projectName: "${APPS_PROJECT}", target: "${INSTALLER_DIR}"
                        copyArtifacts filter: 'installer/BUILD/win-v100-32-release/IBMAsperaConnectSetup*FIPS*.exe', fingerprintArtifacts: true, flatten: true, projectName: 'apps-connect-3.10-build-win-v140-32-fips', target: "${INSTALLER_DIR}"
                    }
                }
                stage('Build') {
                    steps {
                        sh 'npm install'
                        sh 'npm run build'
                    }
                }
                stage('Test') {
                    parallel {
                        stage('Unit') {
                            steps {
                                sh 'npm run test:carbon'
                            }
                        }
                        stage('Integration') {
                            steps {
                                sh 'npm run test:browser'
                            }
                        }
                        stage('Lint') {
                            steps {
                                sh 'npm run test:lint'
                            }
                        }
                    }
                }
                stage('Package') {
                    steps {
                        sh 'npm run build:zip'
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: '*.zip', allowEmptyArchive: true
                            cleanWs()
                        }
                    }
                }
            }
        }
    }
}
