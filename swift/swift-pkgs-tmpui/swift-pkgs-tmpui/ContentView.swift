//
//  ContentView.swift
//
//  Created by Jess.
//

import SwiftUI
import AVKit
import AVFoundation
import Accelerate
import CoreImage
import UIKit

//MARK: - internal

/// extra verbose logging to console from View & global env
private func vLog(text: String) -> Void {
    //TODO: vLog: add OSLog components
    // this is surely not how this is done...idk
    print("vLog: " + text)
}

extension View {
    func vLog(_ vars: Any...) -> some View {
        for v in vars {
            print(v)
        }
        return EmptyView()
    }
}

/// generate new file names:
private func newFileName(hLength: Int? = nil, ext:String? = nil) -> String {

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


private func getStaticWavPath(staticName: String? = nil) -> String {
    
    // defaults for static wav file:
    typealias staticFiles = (name: String, extension: String)

    enum defaults {
        static let recording: staticFiles = (name: "FullSongRecording", extension: "wav")
    }
    
    // go get the static wav file :
    guard let wavPath = Bundle.main.path(
        forResource: defaults.recording.name,
        ofType: defaults.recording.extension
    ) else {
        vLog(text: "Could not get static file " +
                defaults.recording.name + " of type " +
                defaults.recording.name + " ! ")
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
            return []
        }
        
        // todo: how can frameCapacity be calculated on the fly?
        let buf = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: 200000 )
        
        try! file.read(into: buf!)
        let wavformArray = Array(UnsafeBufferPointer(start: buf?.floatChannelData?[0], count:Int(buf!.frameLength)))
        
        return wavformArray
    } catch {
        //print("toast")
        return []
    }
}

func dorp() -> Void {
    print("Chonky Floof")
}

struct ContentVwiew: View {
    var body: some View {
        Text("Hello, world!")
            .padding()
    }
}

struct ContentView: View {
    var body: some View {
        VStack {
            Text(newFileName())
            Text(newFileName(hLength:22, ext:".veryBig"))
        }.onAppear {
            let wavPath = getStaticWavPath()

            //TODO: whoo! this worked, pick up here tommorrow xD
            _ = getLocalWavFS(str: wavPath)
            
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
