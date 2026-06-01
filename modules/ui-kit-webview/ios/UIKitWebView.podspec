Pod::Spec.new do |s|
  s.name           = 'UIKitWebView'
  s.version        = '1.0.0'
  s.summary        = 'UIKit backed WebView.'
  s.description    = 'Expo native view wrapping WKWebView for player experiments.'
  s.license        = { type: 'MIT' }
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

  s.source_files = "**/*.swift"
end
