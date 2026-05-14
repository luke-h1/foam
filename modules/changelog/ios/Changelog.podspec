

Pod::Spec.new do |s|
  s.name           = 'Changelog'
  s.version        = '1.0.0'
  s.summary        = 'Changelog sheet'
  s.description    = 'Changelog sheet'
  s.license        = 'MIT'
  s.author         = 'luke-h1'
  s.homepage       = 'https://lhowsam.com'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/luke-h1/foam' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.swift"
end
