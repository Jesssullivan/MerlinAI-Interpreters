//
//  CreateInterpreterView.swift
//  swift-pkgs-tmpui
//
//  Created by Jess on 11/2/20.
//
import SwiftUI
import AVFoundation
import Accelerate
import TensorFlowLite
import Foundation


// MARK: Private properties:
private var buffer:[Float] = []
private var labels: [String] = []
private let audioBufferInputTensorIndex: Int = 0
private let sampleRateInputTensorIndex: Int = 1
private let sampleRate: Int = 44100
private let ALPHA: Float = -1.7

// MARK: Bundled files:
// accessing of bundled files:
typealias BundleStorage = (name: String, extension: String)

public enum BundledFiles {
    static let model: BundleStorage = (name: "Model", extension: "tflite")
    static let labels: BundleStorage = (name: "Labels", extension: "txt")
    static let recording: BundleStorage = (name: "FullSongRecording", extension: "wav")
}


func wavToArray(file: BundleStorage) -> [Float] {
            
    guard let bundledWav = Bundle.main.path(
        forResource: file.name,
        ofType: file.extension
    ) else {
        NSLog("Failed to load wavToArray @ " + file.name)
        return []
    }
   
    // load as URL for AVAudioFile:
    let url = URL(string: bundledWav)

    // use AVFoundation to import the audio:
    do {
        
        let file = try AVAudioFile(forReading: url!)
        
        NSLog("Received Sample Rate: " + String(file.fileFormat.sampleRate))
        NSLog("Received Channel Count: " + String(file.fileFormat.channelCount))
        
        // Immediately unwrap:
        guard let format = AVAudioFormat(
                commonFormat: .pcmFormatFloat32,
                sampleRate: file.fileFormat.sampleRate,
                channels: 1,
                interleaved: false) else {
            NSLog("Error reading AVAudioFormat!")
            return []
        }
        
        /// todo: how can frameCapacity be calculated on the fly?
        let buf = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(sampleRate))
        try! file.read(into: buf!)
        
        let wavformArray:[Float] = Array(UnsafeBufferPointer(start: buf?.floatChannelData?[0], count:Int(Float(buf!.frameLength))))
        
        NSLog("Success reading AVAudioFormat! returning waveform as Array...")
        
        /// array can now be passed to classifier:
        return wavformArray

    } catch {
        NSLog("Error parsing AVAudioPCMBuffer.")
        return []
    }
}

// MARK: Entry:
struct CreateInterpreterView: View {
   
    @State var labelInfo = "...waiting for Labels Info..."
    @State var modelInfo = "...waiting for Model Info..."
    @State var interpreterInfo = "...waiting for Interpreter Info..."
    @State var tensorInfo = "...waiting for Tensor Info..."
    @State var Info = ""

    var body: some View {
        
        VStack {
            
            Text(labelInfo)
            Spacer(minLength: 5)
            Text(modelInfo)
            Spacer(minLength: 5)
            Text(interpreterInfo)
            Spacer(minLength: 5)
            Text(tensorInfo)
            Spacer(minLength: 5)
            Text(Info)

        }.onAppear {
            
            do {
                
                // MARK: load labels:
                let labelsURL = Bundle.main.url(forResource: "Labels", withExtension: "txt")
                NSLog("labesURL: " + (labelsURL?.path.description)!)
                self.labelInfo = "labesURL: " + (labelsURL?.path.description)!
                
                let contents = try String(contentsOf: labelsURL!, encoding: .utf8)
                labels = contents.components(separatedBy: .newlines)
                NSLog("labels: " + labels.description)
                self.labelInfo = "labels: " + labels.description
                
                // MARK: load Model & initialize interpreter:
                let modelPath = Bundle.main.bundleURL.appendingPathComponent("Model.tflite").path
                NSLog("modelPath: " + modelPath.description)
                self.modelInfo = "modelPath: " + modelPath.description
                
                let interpreter = try Interpreter(modelPath: modelPath)
                NSLog("Created interpreter")
                self.interpreterInfo = "Created interpreter"
                
                try interpreter.allocateTensors()
                NSLog("allocated Tensors")
                self.interpreterInfo = "allocated Tensors"

                // MARK: load test waveform:
                let waveformArray = wavToArray(file: (BundledFiles.recording.name,
                                                                 extension: BundledFiles.recording.extension))
              
                let bytes = waveformArray.map { x in return abs( x / ALPHA ) }
                // print read values?
                // bytes.map { i in return NSLog(i.description) }
        
                let byteData = Data(bytes: bytes, count: sampleRate * 4)

                // MARK: run interpreter:
                try interpreter.copy(byteData, toInputAt: audioBufferInputTensorIndex)

                /// Run inference by invoking the `Interpreter`.
                try interpreter.invoke()
                NSLog("invoked interpreter...")
                self.interpreterInfo = "invoked interpreter..."

                // Get the output `Tensor`
                let outputTensor = try interpreter.output(at: 0)
                NSLog("outputTensor dimensions: " + outputTensor.shape.dimensions.description)
                self.tensorInfo = "outputTensor dimensions: " + outputTensor.shape.dimensions.description

                // Copy output to `Data` to process the inference results.
                let outputSize = outputTensor.shape.dimensions.reduce(1, {x, y in x * y})
                NSLog("outputSize: " + outputSize.description)
                self.tensorInfo = "outputSize: " + outputSize.description
                self.Info = outputTensor.data.map {i in return i}.description
                
                NSLog("finished.")

            } catch {
                
                NSLog("\(error)")
                self.Info = "\(error)"

            }
        }
    }
}


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
