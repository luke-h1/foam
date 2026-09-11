Pod::Spec.new do |s|
  s.name           = 'FabricRecycleFix'
  s.version        = '1.0.0'
  s.summary        = 'Resets hidden on recycled Fabric views.'
  s.description    = 'Runtime backport of facebook/react-native#57590 so a pooled display:none view is not reused still hidden. React core ships prebuilt, so a source patch cannot reach it.'
  s.license        = { type: 'BSD-3-Clause' }
  s.authors        = 'Foam'
  s.homepage       = 'https://github.com/luke-h1/foam.git'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/luke-h1/foam.git', tag: "v#{s.version}" }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
