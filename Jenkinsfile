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
    PATH = "$WORKSPACE/atc/mac-10.13-64/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:$PATH"
  }
  parameters {
    string(
      name: 'OVERRIDE_INSTALLERS',
      defaultValue: '',
      description: 'Get all installers from a different source location, /aspera/process/test/connect/3.10/archive'
    )
    string(
      name: 'OVERRIDE_WIN_INSTALLERS',
      defaultValue: '',
      description: 'Optional: Get latest Windows installers (non-fips) from a different source location (i.e. Jenkins)'
    )
    string(
      name: 'OVERRIDE_MAC_INSTALLERS',
      defaultValue: '',
      description: 'Optional: Get latest Mac installers from a different source location (i.e. Jenkins)'
    )
    string(
      name: 'OVERRIDE_LINUX_INSTALLERS',
      defaultValue: '',
      description: 'Optional: Get latest Linux installers from a different source location (i.e. Jenkins)'
    )
    string(
      name: 'REV_NUMBER',
      defaultValue: '',
      description: 'Full version of installer to use when overriding (ex: 3.9.1.171801)'
    )
  }
  stages {
    stage('Copy Installers') {
      steps {
        copyArtifacts filter: 'BUILD/mac-10.11-64-release/bin/IBMAsperaConnect*.dmg', fingerprintArtifacts: true, flatten: true, projectName: 'apps-trunk-build-mac-10.11-64', target: 'imports/dist/sdk'
        copyArtifacts filter: 'installer/BUILD/win-v100-32-release/IBMAsperaConnect*.msi, installer/BUILD/win-v100-32-release/IBMAsperaConnectSetup*.exe', fingerprintArtifacts: true, flatten: true, projectName: 'apps-trunk-build-win-v140-32', target: 'imports/dist/sdk'
        copyArtifacts filter: 'installer/BUILD/win-v100-32-release/IBMAsperaConnect*FIPS*.msi, installer/BUILD/win-v100-32-release/IBMAsperaConnectSetup*FIPS*.exe', fingerprintArtifacts: true, flatten: true, projectName: 'apps-trunk-build-win-v140-32-fips', target: 'imports/dist/sdk'
        copyArtifacts filter: 'installer/BUILD/linux-g2.12-64-release/ibm-aspera-connect*.tar.gz', fingerprintArtifacts: true, flatten: true, projectName: 'apps-trunk-build-linux-64', target: 'imports/dist/sdk'
        sh 'env | sort'
      }
    }
    stage('Build - SDK') {
      steps {
        sh "npm install"
        sh "npm run clean"
        sh "npm run build"
      }
      post {
        success {
          archiveArtifacts('ConnectSDK*.zip, carbon-banner*.zip')
        }
        cleanup {
          deleteDir()
        }
      }
    }
  }
}
