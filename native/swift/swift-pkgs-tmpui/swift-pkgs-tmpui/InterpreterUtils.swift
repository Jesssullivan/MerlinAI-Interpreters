//
//  CreateInterpreterViewV1.swift
//  swift-pkgs-tmpui
//
//  Created by Jess on 11/2/20.
//
// Misc interpreter stuff.
//



import SwiftUI
import AVFoundation
import Accelerate
import TensorFlowLite
import Foundation


// MARK: public properties:
var buffer:[Float] = []
var labels: [String] = []
let audioBufferInputTensorIndex: Int = 0
let sampleRateInputTensorIndex: Int = 1
let sampleRate: Int = 44100
let ALPHA: Float = -1.7
let maxInt16AsFloat32: Float32 = 44100.0 / 4

typealias BundleStorage = (name: String, extension: String)

public enum BundledFiles {
    static let model: BundleStorage = (name: "Model", extension: "tflite")
    static let labels: BundleStorage = (name: "Labels", extension: "txt")
    static let recording: BundleStorage = (name: "Taps", extension: "wav")
    static let tone: BundleStorage = (name: "Tone", extension: "wav")

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
// generate new file names:
public func newFileName(hLength: Int? = nil, ext:String? = nil) -> String {

    // use hour+minute time & hash string to name record file names
    let dFormatter = DateFormatter()
    dFormatter.dateFormat = "_hh:mma"
    
    // date string:
    let dString = dFormatter.string(from: Date()) // "12 AM"
    
    // hash string length default:
    let length = hLength ?? 6;
    
    // hash string chars:
    let letters = "abcdefghijklmnopqrstuvwxyz"
    let hString = String((0..<length).map{ _ in letters.randomElement()! })
    
    // file extension:
    let nExt = ext ?? ".wav";
    
    // return the new file name:
    vLog(text: "@newFileName created: " + hString + dString + nExt)
    return hString + dString + nExt
    
}

public func getStaticWavPath(staticName: String? = nil) -> String {
    
    // go get the static wav file :
    guard let wavPath = Bundle.main.path(
        forResource: BundledFiles.recording.name,
        ofType: BundledFiles.recording.extension
    ) else {
        vLog(text: "Could not get static file " +
                BundledFiles.recording.name + " of type " +
                BundledFiles.recording.name + " ! ")
        return "Err!"
    }

    vLog(text: "got static wav file path @ " + wavPath)
    return wavPath
}

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
