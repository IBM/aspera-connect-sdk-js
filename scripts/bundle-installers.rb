#!/usr/local/bin/ruby -w
#
# Note: This build script is intended to run from Mac
#

require 'fileutils'
require 'pathname'
require 'date'
$scriptdir = Pathname(__FILE__).realpath.dirname
$version = '3.10.0.123456'

#require "buildscriptenv.rb"
# require "#{$scriptdir}/../../buildsystem/lib/Shell.rb"
# require "#{$scriptdir}/../../buildsystem/lib/rcversion_helper"

def bundle_installers(output_dir)
  # Set the encoding first, the user might have set it wrong
  Encoding.default_external = Encoding::UTF_8
  Encoding.default_internal = Encoding::UTF_8

  imports_dir = "#{$scriptdir}/../imports"
  bin_dir = "#{output_dir}/bin"

  # FileUtils.rm_rf(output_dir)
  FileUtils.mkdir_p(bin_dir)

  mac_oneclick_name = ''
  mac_dmg_name = ''
  mac_pkg_name = ''
  mac_connect_version = ''
  mac_installer_revision = ''
  windows_msi_name = ''
  windows_oneclick_name = ''
  windows_fips_msi_name = ''
  windows_fips_oneclick_name = ''
  windows_connect_version = ''
  windows_installer_revision = ''
  linux64_sh_name = ''
  linux64_targz_name = ''
  linux64_connect_version = ''
  linux64_installer_revision = ''

  unless ENV["SKIP_INSTALLERS"]
    installer_src = ENV["OVERRIDE_INSTALLERS"] || "#{imports_dir}/dist/sdk"
    override_version = ENV["REV_NUMBER"]
    puts "Getting v4 binaries from: #{installer_src}"

    windows_msi_name = nil
    entries = Dir.glob("#{installer_src}/IBMAsperaConnect-ML-#{override_version}*.msi").sort
    # Get latest Windows msi from a different source directory
    if ENV["OVERRIDE_WIN_INSTALLERS"]
      entries = Dir.glob("#{ENV["OVERRIDE_WIN_INSTALLERS"]}/IBMAsperaConnect-ML-*.msi").sort
    end

    if entries.length >= 1
      entries -= Dir.glob("#{installer_src}/*FIPS*.msi").sort
      windows_msi = entries.last
      FileUtils.cp_r windows_msi, bin_dir
      windows_msi_name = File.basename(windows_msi)
    else
      raise "Expected 1 IBMAsperaConnect-ML-*.msi. To skip installers, export SKIP_INSTALLERS=1"
    end

    windows_fips_msi_name = nil
    entries = Dir.glob("#{installer_src}/IBMAsperaConnect-ML-FIPS-#{override_version}*.msi").sort
    if entries.length >= 1
      windows_fips_msi = entries.last
      FileUtils.cp_r windows_fips_msi, bin_dir
      windows_fips_msi_name = File.basename(windows_fips_msi)
    else
      raise "Expected 1 IBMAsperaConnect-ML-FIPS-*.msi. To skip installers, export SKIP_INSTALLERS=1"
    end

    unless ENV["SKIP_ONE_CLICK"]
      windows_oneclick_name = nil
      entries = Dir.glob("#{installer_src}/*AsperaConnectSetup-ML-#{override_version}*.exe").sort
      if ENV["OVERRIDE_WIN_INSTALLERS"]
        entries = Dir.glob("#{ENV["OVERRIDE_WIN_INSTALLERS"]}/*AsperaConnectSetup-ML-*.exe").sort
      end

      if entries.length >= 1
        entries -= Dir.glob("#{installer_src}/*FIPS*.exe").sort
        windows_oneclick = entries.last
        FileUtils.cp_r windows_oneclick, bin_dir
        windows_oneclick_name = File.basename(windows_oneclick)
      else
        raise "Expected 1 AsperaConnectSetup-ML-*.exe. To skip installers, export SKIP_INSTALLERS=1"
      end

      windows_fips_oneclick_name = nil
      entries = Dir.glob("#{installer_src}/*AsperaConnectSetup-ML-FIPS-#{override_version}*.exe").sort
      if entries.length >= 1
        windows_fips_oneclick = entries.last
        FileUtils.cp_r windows_fips_oneclick, bin_dir
        windows_fips_oneclick_name = File.basename(windows_fips_oneclick)
      else
        raise "Expected 1 AsperaConnectSetup-FIPS-ML-*.exe. To skip installers, export SKIP_INSTALLERS=1"
      end

      mac_oneclick_name = nil
      entries = Dir.glob("#{installer_src}/IBMAsperaConnectInstallerOneClick-#{override_version}*.dmg").sort
      if entries.length >= 1
        mac_oneclick = entries.last
        FileUtils.cp_r mac_oneclick, bin_dir
        mac_oneclick_name = File.basename(mac_oneclick)
      else
        raise "Expected 1 pkg.  Found #{entries}. To skip installers, export SKIP_INSTALLERS=1"
      end
    end

    mac_pkg_name = nil
    entries = Dir.glob("#{installer_src}/IBMAsperaConnectInstaller-#{override_version}*.dmg").sort
    if entries.length >= 1
      mac_pkg = entries.last
      FileUtils.cp_r mac_pkg, bin_dir
      mac_pkg_name = File.basename(mac_pkg)
    else
      raise "Expected 1 pkg.  Found #{entries}. To skip installers, export SKIP_INSTALLERS=1"
    end

    linux64_targz_name = nil
    entries = Dir.glob("#{installer_src}/ibm-aspera-connect-#{override_version}*.tar.gz").sort
    if entries.length >= 1
      linux64_targz = entries.last
      FileUtils.cp_r linux64_targz, bin_dir
      linux64_targz_name = File.basename(linux64_targz)
    else
      raise "Expected 1 .tar.gz  Found #{entries}. To skip installers, export SKIP_INSTALLERS=1"
    end

    ff_ext_name = nil
    entries = Dir.glob("#{imports_dir}/dist/sdk/*.xpi").sort
    if entries.length >= 1
      ff_xpi = entries.last
      FileUtils.cp_r ff_xpi, bin_dir
      ff_ext_name = File.basename(ff_xpi)
    else
      # TODO: Enable once firefox extension is being built
      # raise "Expected 1 .xpi. Found #{entries}. To skip installers, export SKIP_INSTALLERS=1"
    end

    # Update revisions in connect_references.json with current revisions
    mac_installer_revision = mac_pkg_name[/(\d*\.\d*\.\d*\.\d*)/, 1]
    mac_connect_version = mac_installer_revision
    windows_installer_revision = windows_msi_name[/(\d*\.\d*\.\d*\.\d*)/, 1]
    windows_connect_version = windows_msi_name[/(\d*\.\d*\.\d*\.\d*)/, 1]
    linux64_installer_revision = linux64_targz_name[/(\d*\.\d*\.\d*\.\d*)/, 1]
    linux64_connect_version = linux64_targz_name[/(\d*\.\d*\.\d*\.\d*)/, 1]
  end

  refs_version = ENV["REV_NUMBER"] || $version
  short_version = refs_version[/(\d*\.\d*\.\d*)/, 1]

  puts("Mac installer : #{mac_pkg_name}")
  puts("Mac installer version  : #{mac_connect_version}")
  puts("Mac installer revision : #{mac_installer_revision}")
  puts("Win installer   : #{windows_msi_name}")
  puts("Win installer version  : #{windows_connect_version}")
  puts("Win installer revision : #{windows_installer_revision}")

  # use the docs hash to create entries in connect_references.json
  puts "creating v4 json entries"
  "https://www.ibm.com/support/knowledgecenter/SSXMX3_3.9.9/kc/connect_user_osx.html"
  base_url = 'https://www.ibm.com/support/knowledgecenter'

  p 'creating v4 html entries'
  html_entries = Hash.new

  # Build HTML documentation hash
  ['win', 'osx', 'linux'].each{|os|
    puts "\n#{os}\n"
    link = "\"#{base_url}/SSXMX3_#{short_version}/kc/connect_user_#{os}.html\""
    puts link
    html_entries[os] = link
  }

  conver = "#{$scriptdir}/../files/connect_references.json"
  contents = File.read(conver)
  contents = contents.gsub(/#TIMESTAMP#/, DateTime.now.to_s)

  contents = contents.gsub(/#MAC_INSTALLER#/, mac_pkg_name)
  contents = contents.gsub(/#MAC_ONE_CLICK_INSTALLER#/, mac_oneclick_name)
  contents = contents.gsub(/#MAC_CONNECT_VERSION#/, mac_connect_version)
  contents = contents.gsub(/#MAC_INSTALLER_REVISION#/, mac_installer_revision)
  contents = contents.gsub(/#MAC_DOCS_HTML_ENTRIES#/, html_entries["osx"])

  contents = contents.gsub(/#WIN_INSTALLER#/, windows_msi_name)
  contents = contents.gsub(/#WIN_ONE_CLICK_INSTALLER#/, windows_oneclick_name)
  contents = contents.gsub(/#WIN_FIPS_INSTALLER#/, windows_fips_msi_name)
  contents = contents.gsub(/#WIN_FIPS_ONE_CLICK_INSTALLER#/, windows_fips_oneclick_name)
  contents = contents.gsub(/#WIN_CONNECT_VERSION#/, windows_connect_version)
  contents = contents.gsub(/#WIN_INSTALLER_REVISION#/, windows_installer_revision)
  contents = contents.gsub(/#WIN_DOCS_HTML_ENTRIES#/, html_entries["win"])

  contents = contents.gsub(/#LINUX64_CONNECT_INSTALLER#/, linux64_targz_name)
  contents = contents.gsub(/#LINUX64_CONNECT_VERSION#/, linux64_connect_version)
  contents = contents.gsub(/#LINUX64_INSTALLER_REVISION#/, linux64_installer_revision)
  contents = contents.gsub(/#LINUX_DOCS_HTML_ENTRIES#/, html_entries["linux"])

  # write sub'ed versions to dest
  cr = File.open("#{output_dir}/connect_references.json", 'w')
  cr.write(contents)
  cr.close()

  # Update connectversions.js based on connect_references.json
  cvpth = "#{$scriptdir}/../files/connectversions.js"
  cvjs_contents = File.read(cvpth)
  cvjs_contents = cvjs_contents.gsub(/#AS_CONNECT_REFERENCES#/, contents)

  cvjs = File.open("#{output_dir}/connectversions.js", 'w')
  cvjs.write(cvjs_contents)
  cvjs.close()

  # Minify both connect_references.json and connectversions.js
  `node #{$scriptdir}/3rdparty/minifier/minify-tool.js --json #{output_dir}/connect_references.json > #{output_dir}/connect_references.min.json`

  contents = File.read("#{output_dir}/connect_references.min.json")
  cvjs_contents = File.read(cvpth)
  cvjs_contents = cvjs_contents.gsub(/#AS_CONNECT_REFERENCES#/, contents)
  cr = File.open("#{output_dir}/connectversions.min.js.tmp", 'w')
  cr.write(cvjs_contents)
  cr.close()
  `node #{$scriptdir}/3rdparty/minifier/minify-tool.js --js #{output_dir}/connectversions.min.js.tmp > #{output_dir}/connectversions.min.js`
  FileUtils.rm_rf("#{output_dir}/connectversions.min.js.tmp")

  return 0
end

bundle_installers(ARGV[0])
