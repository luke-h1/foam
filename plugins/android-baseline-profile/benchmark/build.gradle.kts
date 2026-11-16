import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
  id("com.android.test")
  id("org.jetbrains.kotlin.android")
}

val targetPackage = providers.gradleProperty("foam.benchmark.targetPackage").get()

android {
  namespace = "com.lhowsam.foam.benchmark"
  compileSdk = 36

  defaultConfig {
    minSdk = 28
    targetSdk = 36
    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    testInstrumentationRunnerArguments["targetPackage"] = targetPackage
    manifestPlaceholders["targetPackage"] = targetPackage
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  buildTypes {
    create("benchmark") {
      isDebuggable = true
      signingConfig = getByName("debug").signingConfig
      matchingFallbacks += listOf("release")
    }
  }

  targetProjectPath = ":app"
  experimentalProperties["android.experimental.self-instrumenting"] = true
}

kotlin {
  compilerOptions {
    jvmTarget.set(JvmTarget.JVM_17)
  }
}

evaluationDependsOn(":app")
repositories {
  project(":app").repositories.withType<MavenArtifactRepository>().forEach { maven(it.url) }
}

androidComponents {
  // Macrobenchmark refuses to measure a debuggable app
  beforeVariants(selector().all()) {
    it.enable = it.buildType == "benchmark"
  }
}

dependencies {
  implementation("androidx.benchmark:benchmark-macro-junit4:1.5.0")
  implementation("androidx.test.ext:junit:1.3.0")
  implementation("androidx.test.uiautomator:uiautomator:2.3.0")
}
