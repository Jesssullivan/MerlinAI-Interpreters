//
//  ContentView.swift
//
//  Created by Jess.
//

import SwiftUI
import AVFoundation
import Accelerate
import TensorFlowLite

/// extra verbose logging to console from View & global env
public func vLog(text: String) -> Void {
    //TODO: vLog: add OSLog components
    print("vLog: " + text)
}

public extension View {
    func vLog(_ vars: Any...) -> some View {
        for v in vars {
            print(v)
        }
        // this is surely not how this is done...idk
        return EmptyView()
    }
}

/// generate new file names:
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
            vLog(text: "Error reading AVAudioFormat from " + str + " ! ")
            return []
        }
        
        // todo: how can frameCapacity be calculated on the fly?
        let buf = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: 200000 )
        
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


// MARK: Entry
struct ContentView: View {
    
    @State var TestTextToUpdate = "Test: Generate a new Filename..."
    // @State var ReadAVTextToUpdate = "Test: Read PCM attributes from test .wav file..."

    var body: some View {
        VStack {
            Spacer(minLength: 30)
            Text("...Testing Ways to Display `AVCaptureSession`:")
            HStack {
                //RecordingView()
                Spacer(minLength: 10)
                VStreaming.init()
                SpectrogramView()
            }
            
            // test FSUtils-
            Text("...Testing Ways to Use File System:")
            HStack {
                Button(action: {
                    self.TestTextToUpdate = newFileName(hLength: 14, ext: ".wav")
                }) {
                    Circle()
                        .frame(minWidth: 0, maxWidth:66)
                        .foregroundColor(.green)
                }
                Text(TestTextToUpdate)
                Spacer(minLength: 33)
            }.onAppear {
                let wavPath = getStaticWavPath()
            //TODO: whoo! this worked, picking up here xD
                _ = getLocalWavFS(str: wavPath)
            }
        }
    }
}

// MARK: - Preview Wrapper

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
 

