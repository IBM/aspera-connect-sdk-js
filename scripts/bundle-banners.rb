#!/usr/local/bin/ruby -w
#
# Note: This build script is intended to run from Mac
#

require 'fileutils'
require 'pathname'
$scriptdir = Pathname(__FILE__).realpath.dirname

#require "buildscriptenv.rb"
# require "#{$scriptdir}/../../buildsystem/lib/Shell.rb"
# require "#{$scriptdir}/../../buildsystem/lib/rcversion_helper"

def bundle_banners(output_dir)
  # Set the encoding first, the user might have set it wrong
  Encoding.default_external = Encoding::UTF_8
  Encoding.default_internal = Encoding::UTF_8

  #######################Auto-topbar#######################
  # JS locales
  localize_location = "#{$scriptdir}/../packages/legacy-install/auto-topbar"
  localize_contents = File.read("#{localize_location}/localize-intro.js")
  localize_contents = localize_contents.gsub(/#LOCALE_EN_US#/, File.read("#{localize_location}/localize-en-US.js"))
  localize_contents = localize_contents.gsub(/#LOCALE_ES_ES#/, File.read("#{localize_location}/localize-es-ES.js"))
  localize_contents = localize_contents.gsub(/#LOCALE_FR_FR#/, File.read("#{localize_location}/localize-fr-FR.js"))
  localize_contents = localize_contents.gsub(/#LOCALE_JA_JP#/, File.read("#{localize_location}/localize-ja-JP.js"))
  localize_contents = localize_contents.gsub(/#LOCALE_ZH_CN#/, File.read("#{localize_location}/localize-zh-CN.js"))
  localize_contents = localize_contents.gsub(/#LOCALE_KO_KR#/, File.read("#{localize_location}/localize-ko-KR.js"))

  # Build auto-topbar index.html and minify it
  topbar_location = "#{$scriptdir}/../packages/legacy-install/auto-topbar"
  topbar_contents = File.read("#{topbar_location}/index.html")
  topbar_contents = topbar_contents.gsub(/#INSTALL_CSS#/, File.read("#{topbar_location}/install.css"))
  topbar_contents = topbar_contents.gsub(/#LOCALIZE_JS#/, localize_contents)
  topbar_contents = topbar_contents.gsub(/#INSTALL_JS#/, File.read("#{topbar_location}/install.js"))

  # Output to the install folder
  install_output_dir = "#{output_dir}/install"
  FileUtils.mkdir_p "#{install_output_dir}/auto-topbar"
  topbar_index = File.open("#{install_output_dir}/auto-topbar/index.html", 'w+')
  topbar_index.write(topbar_contents)
  topbar_index.close()

  # Shell.execute "node #{$scriptdir}/3rdparty/minifier/minify-tool.js --html #{install_output_dir}/auto-topbar/index.html > #{install_output_dir}/auto-topbar/index.min.html"

  #######################Carbon-installer#######################
  # JS locales
  localize_location = "#{$scriptdir}/../packages/legacy-install/carbon-installer"
  localize_contents = File.read("#{localize_location}/localize-intro.js")
  localize_contents = localize_contents.gsub(/#LOCALE_EN_US#/, File.read("#{localize_location}/localize-en-US.js"))
  localize_contents = localize_contents.gsub(/#LOCALE_ES_ES#/, File.read("#{localize_location}/localize-es-ES.js"))
  localize_contents = localize_contents.gsub(/#LOCALE_FR_FR#/, File.read("#{localize_location}/localize-fr-FR.js"))
  localize_contents = localize_contents.gsub(/#LOCALE_JA_JP#/, File.read("#{localize_location}/localize-ja-JP.js"))
  localize_contents = localize_contents.gsub(/#LOCALE_ZH_CN#/, File.read("#{localize_location}/localize-zh-CN.js"))
  localize_contents = localize_contents.gsub(/#LOCALE_KO_KR#/, File.read("#{localize_location}/localize-ko-KR.js"))

  # Build carbon-installer index.html and minify it
  carbon_location = "#{$scriptdir}/../packages/legacy-install/carbon-installer"
  carbon_contents = File.read("#{carbon_location}/index.html")
  carbon_contents = carbon_contents.gsub(/#INSTALL_CSS#/, File.read("#{carbon_location}/install.css"))
  carbon_contents = carbon_contents.gsub(/#LOCALIZE_JS#/, localize_contents)
  carbon_contents = carbon_contents.gsub(/#INSTALL_JS#/, File.read("#{carbon_location}/install.js"))

  # Output to the install folder
  install_output_dir = "#{output_dir}/install"
  FileUtils.mkdir_p "#{install_output_dir}/carbon-installer"
  FileUtils.cp("#{carbon_location}/download_indicator_top.png", "#{install_output_dir}/carbon-installer/")
  FileUtils.cp("#{carbon_location}/download_indicator_down.png", "#{install_output_dir}/carbon-installer/")
  FileUtils.cp("#{carbon_location}/pictogram_download.svg", "#{install_output_dir}/carbon-installer/")
  FileUtils.cp("#{carbon_location}/pictogram_openbox.svg", "#{install_output_dir}/carbon-installer/")
  FileUtils.cp("#{carbon_location}/pictogram_puzzle.svg", "#{install_output_dir}/carbon-installer/")
  FileUtils.cp("#{carbon_location}/connect-logo.png", "#{install_output_dir}/carbon-installer/")
  FileUtils.cp("#{carbon_location}/checkmark.svg", "#{install_output_dir}/carbon-installer/")
  FileUtils.cp("#{carbon_location}/tooltip_howto.gif", "#{install_output_dir}/carbon-installer/")
  FileUtils.cp_r("#{carbon_location}/ibm_fonts", "#{install_output_dir}/carbon-installer/")
  carbon_index = File.open("#{install_output_dir}/carbon-installer/index.html", 'w+')
  carbon_index.write(carbon_contents)
  carbon_index.close()
  # Shell.execute "node #{$scriptdir}/3rdparty/minifier/minify-tool.js --html #{install_output_dir}/carbon-installer/index.html > #{install_output_dir}/carbon-installer/index.min.html"
  ########################################################################

  FileUtils.cp_r "#{$scriptdir}/../packages/legacy-install/auto-iframe", install_output_dir
  return 0
end

bundle_banners(ARGV[0])
