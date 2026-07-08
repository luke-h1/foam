Pod::Spec.new do |s|
  s.name           = 'PaintedUsername'
  s.version        = '1.0.0'
  s.summary        = 'Native 7TV painted username rendering for chat.'
  s.description    = 'Renders 7TV cosmetic username paints with Core Graphics for extension-parity gradients, drop shadows, and strokes in a single native view.'
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

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
