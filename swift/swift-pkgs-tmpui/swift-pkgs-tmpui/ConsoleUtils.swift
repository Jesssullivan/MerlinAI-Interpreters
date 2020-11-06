/*
Misc.


import SwiftUI
import AVFoundation
import Accelerate
import TensorFlowLite
import Foundation

 typealias BundleStorage = (name: String, extension: String)

 public enum BundledFiles {
     static let model: BundleStorage = (name: "Model", extension: "tflite")
     static let labels: BundleStorage = (name: "Labels", extension: "txt")
     static let recording: BundleStorage = (name: "TestWaveform", extension: "wav")
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
 */
