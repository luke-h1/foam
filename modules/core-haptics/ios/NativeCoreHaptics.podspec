require 'json'

Pod::Spec.new do |s|
  s.name           = 'NativeCoreHaptics'
  s.version        = '1.0.0'
  s.summary        = 'Core Haptics native module for custom haptic feedback.'
  s.description    = 'Expo native module that exposes iOS Core Haptics APIs for custom haptic feedback patterns and impact.'
  s.license        = { type: 'MIT' }
  s.authors        = 'Foam'
  s.homepage       = 'https://github.com/luke-h1/foam.git'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/luke-h1/foam.git', tag: "v#{s.version}" }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
