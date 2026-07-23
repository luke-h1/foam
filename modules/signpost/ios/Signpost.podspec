Pod::Spec.new do |s|
  s.name           = 'Signpost'
  s.version        = '1.0.0'
  s.summary        = 'Emits os_signpost Points of Interest for Instruments profiling.'
  s.description    = 'Bridges JS to OSSignposter (.pointsOfInterest) so Foam events appear on the Instruments timeline next to Time Profiler and Core Animation.'
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
