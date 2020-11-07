//
//  CreateInterpreterViewV2.swift
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

// MARK: Entry:
struct CreateInterpreterViewV2: View {
   
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

                /// todo: how can frameCapacity be calculated on the fly?
                let url = Bundle.main.url(forResource: BundledFiles.recording.name,
                                                             withExtension: BundledFiles.recording.extension)

                let file = try AVAudioFile(forReading: url!)
                
                NSLog("Received Sample Rate: " + String(file.fileFormat.sampleRate))
                NSLog("Received Channel Count: " + String(file.fileFormat.channelCount))
                
                // Immediately unwrap:
                let format = AVAudioFormat(
                        commonFormat: .pcmFormatFloat32,
                        sampleRate: file.fileFormat.sampleRate,
                        channels: 1,
                        interleaved: false)
                
                let buf = AVAudioPCMBuffer(pcmFormat: format!, frameCapacity: AVAudioFrameCount(sampleRate))
               
                try file.read(into: buf!)
                                 func toNSData(PCMBuffer: AVAudioPCMBuffer) -> NSData {
                    let channels = UnsafeBufferPointer(start: PCMBuffer.floatChannelData, count: 1)
                    let ch0Data = NSData(bytes: channels[0], length:Int(PCMBuffer.frameCapacity * PCMBuffer.format.streamDescription.pointee.mBytesPerFrame))
                    return ch0Data
                }
                
                let byteData = toNSData(PCMBuffer: buf!)
                
                // MARK: run interpreter:
                try interpreter.copy(byteData as Data, toInputAt: audioBufferInputTensorIndex)

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
