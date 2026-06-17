Pod::Spec.new do |s|
  s.name           = 'CpuUsage'
  s.version        = '1.0.0'
  s.summary        = 'Reports the current process CPU usage.'
  s.description    = 'Sums per-thread CPU usage for the current task (the same number top reports for the process) so the dev chat-perf benchmark can show on-device CPU load.'
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

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
