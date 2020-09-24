//
//  StaticTest.swift
//  tmpui.1.1
//
//  Created by Jess on 9/19/20.
//

import Foundation
import SwiftUI
import AVFoundation
import TensorFlowLite

// TODO: - order of things:
/**
 import sample waveform (as wav!) --> array of floats
 todo: copy array to model & immediately invoke, log results
 --> ? --> profit
 todo: invoke tflite model from SwiftUI
 todo: add RTC decs & bindings for react-native interoperability
 */

// MARK: - internal bits:

// logging to console from View & global env, this is surely not how this is done...idk
private func Logger(text: String) -> String {
    //  _ = Logger(text: "foo" + "bar")
    print(text)
    return text
}

private var intrep = TfLiteInterpreter

private func getLocalWav(wavName: String) -> Array<Any> {
    let url = Bundle.main.url(forResource: wavName, withExtension: "wav")

    // use Apple's AVFoundation to import the audio:
    let file = try! AVAudioFile(forReading: url!)
    _ = Logger(text: "Received Sample Rate: " + String(file.fileFormat.sampleRate))
    _ = Logger(text: "Received Channel Count: " + String(file.fileFormat.channelCount))

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

    // can print the array to check if values are as they should be:
    // _ = Logger(text: wavformArray.description)
    // Copy the RGB data to the input `Tensor`.
    try TfLiteInterpreter.copy(rgbData, toInputAt: 0)

// Run inference by invoking the `Interpreter`.
    let startDate = Date()
    try interpreter.invoke()
    let len = 16000
    var audio = [Float](repeating: Float(1.0), count: len)
    let audioBuffer = Data(bytes: &audio, count: audio.count * MemoryLayout<Float>.stride)
    try TfLiteInterpreter.copy(audioBuffer, toInputAt: 0)

    return wavformArray

}
struct StaticView: View {

    // `FullSongRecording` has is a static, bundled .wav file
    // (downloaded directly from web tests @ tmpui.herokuapp.com/crop_dl)
    let wav = getLocalWav(wavName: "FullSongRecording")

    // fill the screen with something:
    var body: some View {
        Text("tmpUI")
            .padding()
    }
}

struct StaticView_Previews: PreviewProvider {
    static var previews: some View {
        StaticView()
    }
}
