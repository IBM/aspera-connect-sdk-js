#!groovy

pipeline {
  agent {
    node{
      label 'ci-bld-mac10v13-0'
    }
  }
  options {
    timeout(time: 1, unit: 'HOURS')
    buildDiscarder(logRotator(numToKeepStr: '50', artifactNumToKeepStr: '30'))
  }
  environment {
    PLATFORM = 'mac-10.13-64'
    PATH = "$WORKSPACE/atc/mac-10.13-64/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:$PATH"
  }
  stages {
    stage('Copy Installers') {
      steps {
        copyArtifacts filter: 'BUILD/mac-10.13-64-release/bin/IBMAsperaConnect*.dmg', fingerprintArtifacts: true, flatten: true, projectName: 'apps-trunk-build-mac-10.13-64', target: 'imports/dist/sdk'
        copyArtifacts filter: 'installer/BUILD/win-v100-32-release/IBMAsperaConnect*.msi, installer/BUILD/win-v100-32-release/IBMAsperaConnectSetup*.exe', fingerprintArtifacts: true, flatten: true, projectName: 'apps-trunk-build-win-v140-32', target: 'imports/dist/sdk'
        copyArtifacts filter: 'installer/BUILD/linux-g2.12-64-debug/ibm-aspera-connect*64.tar.gz', fingerprintArtifacts: true, flatten: true, projectName: 'apps-trunk-build-linux-64', target: 'imports/dist/sdk'
        sh 'env | sort'
      }
    }
    stage('Build - SDK') {
      steps {
        sh "npm install"
        sh "npm run build"
      }
      post {
        success {
          archiveArtifacts('ConnectSDK*.zip')
        }
      }
    }
  }
}
