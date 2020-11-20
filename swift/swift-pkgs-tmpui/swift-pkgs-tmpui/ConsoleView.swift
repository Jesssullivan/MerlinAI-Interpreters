//
//  ConsoleView.swift
//  swift-pkgs-tmpui
//
//  Created by Jess.

/*
import SwiftUI
import AVFoundation
import Accelerate
import TensorFlowLite
import Foundation


// MARK: Private properties:
private var buffer:[Float] = []
private var labels: [String] = []
private let audioBufferInputTensorIndex = 0
private let sampleRateInputTensorIndex = 1
private let sampleRate = 44100

// MARK: Local methods:
/// extra verbose logging to console from View & global env
func vLog(text: String) -> Void {
    // ...when not called from a `View`:
    print("vLog: " + text)
}

public extension View {
    func vLog(_ vars: String...) -> some View {
        for text in vars {
            // when called from a `View`:
            print(": " + text)
        }
        // this is surely not how this is done...idk
        return EmptyView()
    }
}


// MARK: Bundled files:
// accessing of bundled files:
typealias BundleStorage = (name: String, extension: String)

public enum BundledFiles {
    static let model: BundleStorage = (name: "Model", extension: "tflite")
    static let labels: BundleStorage = (name: "Labels", extension: "txt")
    static let recording: BundleStorage = (name: "TestWaveform", extension: "wav")
}



// MARK: Merlin's Interpreter:
class MerlinInterpreter {
    
    /// to be populated from initializer:
    private var interpreter: Interpreter
    
    // MARK: Load Interpreter w/ model.
    init?() {
        
        /// load in model in `BundledFiles`:
        guard let modelPath = Bundle.main.path(
            forResource: BundledFiles.model.name,
            ofType: BundledFiles.model.extension
        ) else {
            vLog(text: "Failed to load the model :(")
            return nil
        }
        
        vLog(text: "Successfully loaded model! :)")
        
        // MARK: initialize Interpreter:
        
        do {
            
            // Create Interpreter:
            interpreter = try Interpreter(modelPath: modelPath)
            vLog(text: "Successfully created interpreter!")
            
            // Allocate tensors:
            try interpreter.allocateTensors()
            vLog(text: "Successfully allocated tensors! \n\n:)")
    
            
        } catch let error {
            vLog(text: "Failed to create interpreter! \n @ \(error.localizedDescription)!")
            return nil
        }
      
        // MARK: Establish Labels:
        
        /// intialize & map labels available in BundledFiles:
        let filename = BundledFiles.labels.name
        let fileExtension = BundledFiles.labels.extension
        
        /// load from bundle:
        guard let fileURL = Bundle.main.url(forResource: filename, withExtension: fileExtension) else {
            fatalError("a terrible issue has occured with labels @ " +
                        "\(filename).\(fileExtension) !")
        }
        
        do {
            
            let contents = try String(contentsOf: fileURL, encoding: .utf8)
            labels = contents.components(separatedBy: .newlines)
            
        } catch {
            fatalError("An awful thing has happened")
        }
        
    }

    // MARK: Public Interpreter Methods:
    
    public func wavToArray(file: BundleStorage) -> [Float] {
                
        guard let bundledWav = Bundle.main.path(
            forResource: file.name,
            ofType: file.extension
        ) else {
            vLog(text: "Failed to load wavToArray @ " + file.name)
            return []
        }
       
        // load as URL for AVAudioFile:
        let url = URL(string: bundledWav)

        // use AVFoundation to import the audio:
        do {
            
            let file = try AVAudioFile(forReading: url!)
            
            vLog(text: "Received Sample Rate: " + String(file.fileFormat.sampleRate))
            vLog(text: "Received Channel Count: " + String(file.fileFormat.channelCount))
            
            // Immediately unwrap:
            guard let format = AVAudioFormat(
                    commonFormat: .pcmFormatFloat32,
                    sampleRate: file.fileFormat.sampleRate,
                    channels: 1,
                    interleaved: false) else {
                vLog(text: "Error reading AVAudioFormat!")
                return []
            }
            
            let buf = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(sampleRate))
            try! file.read(into: buf!)
            
            let wavformArray = Array(UnsafeBufferPointer(start: buf?.floatChannelData?[0], count:Int(buf!.frameLength)))
            
            vLog(text: "Success reading AVAudioFormat! returning waveform as Array...")
            
            /// array can now be passed to classifier:
            return wavformArray

        } catch {
            vLog(text: "Error parsing AVAudioPCMBuffer.")
            return []
        }
    }

    public func classify(buffer: [Float]) -> Void {
      
        var outputTensor: Tensor
     
        do {
                        
            /// Copy buffer:
            let audioBufferData = Data(copyingBufferOf: buffer.map { Float($0) })
            vLog(text: "audioBufferData: " + audioBufferData.description)
            
            try interpreter.copy(audioBufferData, toInputAt: audioBufferInputTensorIndex)

            /// Copy sample rate:
            var rate = Int32(sampleRate)
            let sampleRateData = Data(bytes: &rate, count: MemoryLayout.size(ofValue: rate))
            try interpreter.copy(sampleRateData, toInputAt: sampleRateInputTensorIndex)
            
            vLog(text: try interpreter.input(at: 0).shape.dimensions.description)
            /// YOLO:
            try interpreter.invoke()

            let outputTensor = try interpreter.output(at: 0)
            
            vLog(text: outputTensor.data.description)
            // Copy output to `Data` to process the inference results.
            let outputSize = outputTensor.shape.dimensions.reduce(1, {x, y in x * y})
            let outputData =
                  UnsafeMutableBufferPointer<Float32>.allocate(capacity: outputSize)
            outputTensor.data.copyBytes(to: outputData)
            
       
            vLog(text: "@ Tensor: " + outputTensor.data.description)
            
        } catch let error {
            print("Something has gone horribly wrong." +
                  "\n\n \(error.localizedDescription)")
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
    #endif
  }
}

// MARK: Entry:
struct ConsoleView: View {

    @State var Info = "Loading Intepreter..."
    
    var body: some View {
        VStack {
            SpectrogramView()
            Spacer(minLength: 3)
            Text("Logging to XCode console if available...")
            Spacer(minLength: 33)
            Text(Info)
        }.onAppear {
            let Merlin = MerlinInterpreter()
            let audioArray = Merlin?.wavToArray(file: (name: "TestWaveform", extension: "wav"))
            Merlin?.classify(buffer: audioArray!)
            self.Info = "Check Logs."
        }
    }
}
*/
