/*
 
 This file contains a variety of utility functions used to operate a bare-bones tflite example, connected to the  XCode console.

 Created by Jess.

 */

import SwiftUI
import AVFoundation
import Accelerate
import TensorFlowLite
import Foundation

/// extra verbose logging to console from View & global env
func vLog(text: String) -> Void {
    // ...when not called from a `View`:
    print("vLog: " + text)
}

public extension View {
    func vLog(_ vars: String...) -> some View {
        for text in vars {
            print("pub. Log: " + text)
        }
        // this is surely not how this is done...idk
        return EmptyView()
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

func getLocalWavFS(str: String) -> Array<Any> {
    
    let url = URL(string: str)
   
    // use Apple's AVFoundation to import the audio:
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
            vLog(text: "Error reading AVAudioFormat from " + str + " ! ")
            return []
        }
        
        // todo: how can frameCapacity be calculated on the fly?
        let buf = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: 2048)
        
        try! file.read(into: buf!)
        let wavformArray = Array(UnsafeBufferPointer(start: buf?.floatChannelData?[0], count:Int(buf!.frameLength)))
        
        vLog(text: "Success reading AVAudioFormat from " + str +
                ", returning waveform as Array")
        
            
        return wavformArray

    } catch {
        vLog(text: "Error parsing AVAudioPCMBuffer " + str + " ! ")
        return []
    }
}
