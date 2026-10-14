Pod::Spec.new do |s|
  s.name           = 'NativeChatList'
  s.version        = '1.0.0'
  s.summary        = 'UIKit chat message list'
  s.description    = 'Experimental UIKit chat list that lays out rows off the main thread'
  s.license        = 'MIT'
  s.author         = 'luke-h1'
  s.homepage       = 'https://lhowsam.com'
  s.platforms      = {
    :ios => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/luke-h1/foam' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoImage'
  s.dependency 'SDWebImage', '~> 5.21.0'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.swift"
end
