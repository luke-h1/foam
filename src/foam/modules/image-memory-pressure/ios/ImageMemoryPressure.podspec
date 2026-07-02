Pod::Spec.new do |s|
  s.name           = 'ImageMemoryPressure'
  s.version        = '1.0.0'
  s.summary        = 'Reports the process pre-jetsam memory headroom for image-cache eviction.'
  s.description    = 'Exposes os_proc_available_memory() (bytes remaining before the process hits its iOS memory limit) so JS can evict decoded-image caches proactively before the app is jettisoned.'
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
