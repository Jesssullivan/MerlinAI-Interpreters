
import Foundation
import SwiftUI
import AVFoundation
import TensorFlowLite
//import PythonKit

// TODO: - order of things:
/**
 import sample waveform (as wav!) --> array of floats
 todo: copy array to model & immediately invoke, log results
 --> ? --> profit
 todo: invoke tflite model from SwiftUI
 todo: add RTC decs & bindings for react-native interoperability
 */

/*
let len = 44100
var audio = [Float](repeating: Float(1.0), count: len)
    

/// A result from invoking the `Interpreter`.
struct Result {
  let inferenceTime: Double
}

/// Information about a model file or labels file.
typealias FileInfo = (name: String, extension: String)

enum ConvActions {
  static let modelInfo: FileInfo = (name: "model", extension: "tflite")
  static let labelsInfo: FileInfo = (name: "conv_actions_labels", extension: "txt")
}

/// This class handles all data preprocessing and makes calls to run inference on a given audio
/// buffer by invoking the TensorFlow Lite `Interpreter`. It then formats the inferences obtained
/// and averages the recognized commands by running them through RecognizeCommands.
class ModelDataHandler {

  // MARK: - Internal Properties
  /// The current thread count used by the TensorFlow Lite Interpreter.
  let threadCount: Int

  let threadCountLimit = 10
  let sampleRate = 44100

  // MARK: - Private Properties
  private var buffer:[Int] = []
  private let audioBufferInputTensorIndex = 0
  private let sampleRateInputTensorIndex = 1
  private let labelOffset = 2
  private let sampleDuration = 1000
  private let minimumCount = 3
  private let averageWindowDuration = 1000.0
  private let suppressionMs = 1500.0
  private let threshold = 0.5
  private let minTimeBetweenSamples = 30.0
  private let maxInt16AsFloat32: Float32 = 32767.0

  /// List of labels from the given labels file.
  private var labels: [String] = []

  /// TensorFlow Lite `Interpreter` object for performing inference on a given model.
  private var interpreter: Interpreter

  private var recordingLength: Int {
    return (sampleRate * sampleDuration) / 1000
  }

  // MARK: - Initialization
  /// A failable initializer for `ModelDataHandler`. A new instance is created if the model and
  /// labels files are successfully loaded from the app's main bundle. Default `threadCount` is 1.
  init?(modelFileInfo: FileInfo, labelsFileInfo: FileInfo, threadCount: Int = 1) {
    let modelFilename = modelFileInfo.name

    // Construct the path to the model file.
    guard let modelPath = Bundle.main.path(
      forResource: modelFilename,
      ofType: modelFileInfo.extension
    ) else {
      print("Failed to load the model file with name: \(modelFilename).")
      return nil
    }

    // Specify the options for the `Interpreter`.
    self.threadCount = threadCount
    var options = Interpreter.Options()
    options.threadCount = threadCount
    do {
      // Create the `Interpreter`.
      interpreter = try Interpreter(modelPath: modelPath, options: options)
      // Allocate memory for the model's input `Tensor`s.
      try interpreter.allocateTensors()
    } catch let error {
      print("Failed to create the interpreter with error: \(error.localizedDescription)")
      return nil
    }
    loadLabels(fileInfo: labelsFileInfo)
  }

  // MARK: - Internal Methods
  /// Invokes the `Interpreter` and processes and returns the inference results.
  func runModel(onBuffer buffer: [Int16]) -> Result? {
    let interval: TimeInterval
    let outputTensor: Tensor
    do {
      // Copy the `[Int16]` buffer data as an array of `Float`s to the audio buffer input `Tensor`'s.
      let audioBufferData = Data(copyingBufferOf: buffer.map { Float($0) / maxInt16AsFloat32 })
      try interpreter.copy(audioBufferData, toInputAt: audioBufferInputTensorIndex)

      // Copy the sample rate data to the sample rate input `Tensor`.
      var rate = Int32(sampleRate)
      let sampleRateData = Data(bytes: &rate, count: MemoryLayout.size(ofValue: rate))
      try interpreter.copy(sampleRateData, toInputAt: sampleRateInputTensorIndex)

      // Run inference by invoking the `Interpreter`.
      let startDate = Date()
      try interpreter.invoke()
      interval = Date().timeIntervalSince(startDate) * 1000

      // Get the output `Tensor` to process the inference results.
      outputTensor = try interpreter.output(at: 0)
    } catch let error {
      print("Failed to invoke the interpreter with error: \(error.localizedDescription)")
      return nil
    }

    // Gets the formatted and averaged results.
    let scores = [Float32](unsafeData: outputTensor.data) ?? []
    let command =  getResults(withScores: scores)

    // Returns result.
    let result = Result(recognizedCommand: command, inferenceTime: interval)

    return result
  }

  /// Returns the labels other than silence and unknown for display.
  func offsetLabelsForDisplay() -> [String] {
    return Array(labels[labelOffset..<labels.count])
  }


  // MARK: - Private Methods
  /// Formats the results and runs them through Recognize Commands to average the results over a
  /// window duration.
  private func getResults(withScores scores: [Float]) -> RecognizedCommand? {

    var results: [Float] = []
    for i in 0..<labels.count {
      results.append(scores[i])
    }

    // Runs results through recognize commands.
    let command = recognizeCommands?.process(
      latestResults: results,
      currentTime: Date().timeIntervalSince1970 * 1000
    )

    // Check if command is new and the identified result is not silence or unknown.
    guard let newCommand = command,
      let index = labels.index(of: newCommand.name),
      newCommand.isNew,
      index >= labelOffset
    else {
        return nil
    }
    return newCommand
  }

  /// Loads the labels from the labels file and stores them in the `labels` property.
  private func loadLabels(fileInfo: FileInfo) {
    let filename = fileInfo.name
    let fileExtension = fileInfo.extension
    guard let fileURL = Bundle.main.url(forResource: filename, withExtension: fileExtension) else {
      fatalError("Labels file not found in bundle. Please add a labels file with name " +
                   "\(filename).\(fileExtension) and try again.")
    }
    do {
      let contents = try String(contentsOf: fileURL, encoding: .utf8)
      labels = contents.components(separatedBy: .newlines)
    } catch {
      fatalError("Labels file named \(filename).\(fileExtension) cannot be read. Please add a " +
                   "valid labels file and try again.")
    }
  }
}

// MARK: - Extensions
extension Data {
  /// Creates a new buffer by copying the buffer pointer of the given array.
  ///
  /// - Warning: The given array's element type `T` must be trivial in that it can be copied bit
  ///     for bit with no indirection or reference-counting operations; otherwise, reinterpreting
  ///     data from the resulting buffer has undefined behavior.
  /// - Parameter array: An array with elements of type `T`.
  init<T>(copyingBufferOf array: [T]) {
    self = array.withUnsafeBufferPointer(Data.init)
  }
}

extension Array {
  /// Creates a new array from the bytes of the given unsafe data.
  ///
  /// - Warning: The array's `Element` type must be trivial in that it can be copied bit for bit
  ///     with no indirection or reference-counting operations; otherwise, copying the raw bytes in
  ///     the `unsafeData`'s buffer to a new array returns an unsafe copy.
  /// - Note: Returns `nil` if `unsafeData.count` is not a multiple of
  ///     `MemoryLayout<Element>.stride`.
  /// - Parameter unsafeData: The data containing the bytes to turn into an array.
  init?(unsafeData: Data) {
    guard unsafeData.count % MemoryLayout<Element>.stride == 0 else { return nil }
    #if swift(>=5.0)
    self = unsafeData.withUnsafeBytes { .init($0.bindMemory(to: Element.self)) }
    #else
    self = unsafeData.withUnsafeBytes {
      .init(UnsafeBufferPointer<Element>(
        start: $0,
        count: unsafeData.count / MemoryLayout<Element>.stride
      ))
    }
    #endif  // swift(>=5.0)
  }
}

let wavformArray = Array(UnsafeBufferPointer(start: buf?.floatChannelData?[0], count:Int(buf!.frameLength)))
    
    do {
        // initialize intepreter:
        let interpreter = try Interpreter(modelPath:model)

        // Allocate memory:
        try interpreter.allocateTensors()

        _ = Date()
        
    
        
        let audioBuffer = Data(bytes: &audio, count: audio.count * MemoryLayout<Float>.stride)
        
        // Copy the input data to the input `Tensor`.
        try interpreter.copy(audioBuffer, toInputAt: 0)
        
        try interpreter.invoke()
        
        // Get the output `Tensor`
        let outputTensor = try interpreter.output(at: 0)

        // Copy output to `Data` to process the inference results.
        let outputSize = outputTensor.shape.dimensions.reduce(1, {x, y in x * y})
        let outputData =
              UnsafeMutableBufferPointer<Float32>.allocate(capacity: outputSize)
              outputTensor.data.copyBytes(to: outputData)
        
        print(outputData)
        
    } catch {
        print("Error with D'egg")
    }
}
 */

