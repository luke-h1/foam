import Darwin
import ExpoModulesCore
import Foundation

public class CpuUsageModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CpuUsage")

    Function("getUsage") { () -> Double in
      Self.currentCpuUsage()
    }

    Function("getUsedMemoryMb") { () -> Double in
      Self.currentUsedMemoryMb()
    }
  }

  private static func currentUsedMemoryMb() -> Double {
    var info = task_vm_info_data_t()
    var count = mach_msg_type_number_t(
      MemoryLayout<task_vm_info_data_t>.stride / MemoryLayout<natural_t>.stride
    )

    let result = withUnsafeMutablePointer(to: &info) {
      $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
        task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), $0, &count)
      }
    }

    guard result == KERN_SUCCESS else {
      return 0
    }

    return Double(info.phys_footprint) / (1024.0 * 1024.0)
  }

  private static let basicInfoCount = mach_msg_type_number_t(
    MemoryLayout<thread_basic_info_data_t>.size / MemoryLayout<integer_t>.size
  )

  private static func currentCpuUsage() -> Double {
    var threadList: thread_act_array_t?
    var threadCount = mach_msg_type_number_t(0)

    guard task_threads(mach_task_self_, &threadList, &threadCount) == KERN_SUCCESS,
          let threads = threadList
    else {
      return 0
    }

    defer {
      for index in 0 ..< Int(threadCount) {
        mach_port_deallocate(mach_task_self_, threads[index])
      }

      vm_deallocate(
        mach_task_self_,
        vm_address_t(UInt(bitPattern: threads)),
        vm_size_t(Int(threadCount) * MemoryLayout<thread_t>.stride)
      )
    }

    var total = 0.0

    for index in 0 ..< Int(threadCount) {
      var info = thread_basic_info_data_t()
      var count = Self.basicInfoCount

      let result = withUnsafeMutablePointer(to: &info) {
        $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
          thread_info(threads[index], thread_flavor_t(THREAD_BASIC_INFO), $0, &count)
        }
      }

      if result == KERN_SUCCESS, (info.flags & TH_FLAGS_IDLE) == 0 {
        total += Double(info.cpu_usage) / Double(TH_USAGE_SCALE) * 100.0
      }
    }

    return total
  }
}
