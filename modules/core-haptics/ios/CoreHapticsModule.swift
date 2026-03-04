import CoreHaptics
import ExpoModulesCore

public class NativeCoreHapticsModule: Module {
    var hapticEngine: CHHapticEngine?

    public func definition() -> ModuleDefinition {
        Name("NativeCoreHaptics")

        OnCreate {
            self.initializeHapticEngine()
        }

        OnDestroy {
            self.cleanupHapticEngine()
        }

        OnAppEntersForeground {
            self.restartHapticEngineIfNeeded()
        }

        OnAppEntersBackground {
            self.pauseHapticEngine()
        }

        // Plays a transient haptic feedback
        AsyncFunction("impact") { (sharpness: Double, intensity: Double) in
            guard let engine = self.hapticEngine else {
                print("Haptic engine not available")
                return
            }

            let sharpnessParameter = CHHapticEventParameter(
                parameterID: .hapticSharpness, value: Float(sharpness))
            let intensityParameter = CHHapticEventParameter(
                parameterID: .hapticIntensity, value: Float(intensity))

            do {
                let event = CHHapticEvent(
                    eventType: .hapticTransient,
                    parameters: [intensityParameter, sharpnessParameter],
                    relativeTime: 0
                )

                let pattern = try CHHapticPattern(events: [event], parameters: [])
                let player = try engine.makePlayer(with: pattern)
                try player.start(atTime: CHHapticTimeImmediate)
            } catch {
                print("Failed to play `impact` haptic: \(error)")
            }
        }.runOnQueue(.main)

        // play a full haptic pattern
        AsyncFunction("playPattern") { (patternData: HapticPatternData) in
            guard let engine = self.hapticEngine else {
                print("Haptic engine not available")
                return
            }

            do {
                let pattern = try patternData.toCHHapticPattern()
                let player = try engine.makePlayer(with: pattern)
                try player.start(atTime: CHHapticTimeImmediate)
            } catch {
                print("Failed to play `playPattern` haptic: \(error)")
            }
        }.runOnQueue(.main)
    }

    private func initializeHapticEngine() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else {
            print("Haptics not supported on this device")
            return
        }

        do {
            self.hapticEngine = try CHHapticEngine()

            try self.hapticEngine?.start()

            self.hapticEngine?.resetHandler = { [weak self] in
                print("Haptic engine reset - restarting")
                self?.restartHapticEngineIfNeeded()
            }

            self.hapticEngine?.stoppedHandler = { [weak self] reason in
                print("Haptic engine stopped: \(reason)")

                switch reason {
                case .audioSessionInterrupt, .applicationSuspended, .idleTimeout:
                    break

                case .systemError, .notifyWhenFinished, .gameControllerDisconnect, .engineDestroyed:
                    self?.restartHapticEngineIfNeeded()

                @unknown default:
                    print("Unknown haptic engine stopped reason: \(reason)")
                }
            }

            print("Haptic engine initialized successfully")
        } catch {
            print("Failed to initialize haptic engine: \(error)")
        }
    }

    private func cleanupHapticEngine() {
        hapticEngine?.stop()
        hapticEngine = nil
        print("Haptic engine cleaned up")
    }

    private func pauseHapticEngine() {
        print("App > backgrounding - haptic engine idled")
    }

    private func restartHapticEngineIfNeeded() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }

        do {
            if hapticEngine == nil {
                initializeHapticEngine()
            } else {
                try hapticEngine?.start()
                print("Haptic engine restarted")
            }
        } catch {
            print("Failed to restart haptic engine: \(error)")
            cleanupHapticEngine()
            initializeHapticEngine()
        }
    }

}

// MARK: types to represent CHHapticPattern data

struct HapticEventParameter: Record {
    @Field
    var parameterID: String

    @Field
    var value: Double
}

struct HapticEvent: Record {
    @Field
    var eventType: String

    @Field
    var time: Double = 0.0

    @Field
    var eventDuration: Double?

    @Field
    var parameters: [HapticEventParameter] = []
}

struct HapticParameterCurveControlPoint: Record {
    @Field
    var relativeTime: Double

    @Field
    var value: Double
}

struct HapticParameterCurve: Record {
    @Field
    var parameterID: String

    @Field
    var controlPoints: [HapticParameterCurveControlPoint] = []

    @Field
    var relativeTime: Double = 0.0
}

struct HapticPatternData: Record {
    @Field
    var events: [HapticEvent] = []

    @Field
    var parameterCurves: [HapticParameterCurve] = []
}

extension HapticParameterCurve {
    func toCHHapticParameterCurve() -> CHHapticParameterCurve {
        let parameterID = CHHapticDynamicParameter.ID(from: self.parameterID)
        let controlPoints = self.controlPoints.map { controlPoint in
            CHHapticParameterCurve.ControlPoint(
                relativeTime: controlPoint.relativeTime,
                value: Float(controlPoint.value)
            )
        }

        return CHHapticParameterCurve(
            parameterID: parameterID,
            controlPoints: controlPoints,
            relativeTime: self.relativeTime
        )
    }
}

extension HapticPatternData {
    func toCHHapticPattern() throws -> CHHapticPattern {
        let events = try self.events.map { try $0.toCHHapticEvent() }
        let parameterCurves = self.parameterCurves.map { $0.toCHHapticParameterCurve() }

        return try CHHapticPattern(events: events, parameterCurves: parameterCurves)
    }
}

extension HapticEvent {
    func toCHHapticEvent() throws -> CHHapticEvent {
        let eventType = try CHHapticEvent.EventType(from: self.eventType)
        let parameters = self.parameters.map {
            param in
            CHHapticEventParameter(
                parameterID: CHHapticEvent.ParameterID(from: param.parameterID),
                value: Float(param.value)
            )
        }

        if let duration = self.eventDuration {
            return CHHapticEvent(
                eventType: eventType,
                parameters: parameters,
                relativeTime: self.time,
                duration: duration
            )
        } else {
            return CHHapticEvent(
                eventType: eventType,
                parameters: parameters,
                relativeTime: self.time
            )
        }
    }
}

extension CHHapticEvent.EventType {
    init(from string: String) throws {
        switch string {
        case "hapticTransient": self = .hapticTransient
        case "hapticContinuous": self = .hapticContinuous
        case "audioContinuous": self = .audioContinuous
        case "audioCustom": self = .audioCustom

        default:
            throw NSError(
                domain: "HapticError", code: 1,
                userInfo: [
                    NSLocalizedDescriptionKey: "Invalid haptic event type: \(string)"
                ])

        }
    }
}

extension CHHapticEvent.ParameterID {
    init(from string: String) {
        switch string {
        case "hapticIntensity": self = .hapticIntensity
        case "hapticSharpness": self = .hapticSharpness
        case "attackTime": self = .attackTime
        case "decayTime": self = .decayTime
        case "releaseTime": self = .releaseTime
        case "sustained": self = .sustained
        case "audioVolume": self = .audioVolume
        case "audioPitch": self = .audioPitch
        case "audioPan": self = .audioPan
        case "audioBrightness": self = .audioBrightness
        default: self = .hapticIntensity
        }
    }
}

extension CHHapticDynamicParameter.ID {
    init(from string: String) {
        switch string {
        case "hapticIntensityControl": self = .hapticIntensityControl
        case "hapticSharpnessControl": self = .hapticSharpnessControl
        case "audioVolumeControl": self = .audioVolumeControl
        case "audioPanControl": self = .audioPanControl
        case "audioBrightnessControl": self = .audioBrightnessControl
        case "audioPitchControl": self = .audioPitchControl
        default: self = .hapticIntensityControl
        }
    }
}
